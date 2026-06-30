import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { computeCommissionAmount, resolveCompanyRevenue, resolveAgentEarnings } from "@/lib/commission";
import { OpportunityStatus, UserRole, UserStatus } from "@/generated/prisma/enums";

export type AgentDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: "ADMIN" | "MANAGER" | "AGENT";
  status: UserStatus;
  /** This agent's own computed commission earnings — sum of the resolved
   * agentCommission across their CLOSED_WON opportunities. Distinct from company
   * revenue (the resolved Commission Amount the brokerage earns). */
  totalEarnings: number;
  createdAt: string;
};

/** Sums each agent's computed commission earnings across their CLOSED_WON opportunities. */
async function buildEarningsByAgent(): Promise<Map<string, number>> {
  const rows = await prisma.opportunity.findMany({
    where: { status: OpportunityStatus.CLOSED_WON, assignedAgentId: { not: null } },
    select: { assignedAgentId: true, dealSize: true, agentCommissionValue: true, agentCommissionUnit: true },
  });

  const earnings = new Map<string, number>();
  for (const row of rows) {
    if (!row.assignedAgentId) continue;
    const amount = computeCommissionAmount(
      row.dealSize !== null ? Number(row.dealSize) : null,
      row.agentCommissionValue !== null ? Number(row.agentCommissionValue) : null,
      row.agentCommissionUnit,
    );
    if (!amount) continue;
    earnings.set(row.assignedAgentId, (earnings.get(row.assignedAgentId) ?? 0) + amount);
  }
  return earnings;
}

export type AgentMetrics = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  newThisMonth: number;
  /** Company-wide open Opportunities — not scoped to any one agent. */
  activeDeals: number;
  activeDealsNewThisMonth: number;
  /** Company-wide revenue: sum of the resolved Commission Amount across
   * CLOSED_WON Opportunities (see §17 — revenue is the brokerage's commission,
   * not the deal size, and is driven by the Opportunity, not the Contract). */
  totalRevenue: number;
  totalListings: number;
  totalListingsNewThisMonth: number;
};

type ListAgentsResult =
  | { ok: true; agents: AgentDto[]; metrics: AgentMetrics }
  | { ok: false; error: string; status: number };

export async function listAgents(): Promise<ListAgentsResult> {
  const auth = await requirePermission("agents:view");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [profiles, newThisMonth, activeDeals, activeDealsNewThisMonth, wonRevenueRows, totalListings, totalListingsNewThisMonth, earningsByAgent] =
    await Promise.all([
      prisma.profile.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
          // Exclude the caller themselves so admins don't see themselves in the "approve" list
          NOT: { id: auth.profile.id },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          city: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.profile.count({
        where: { role: { in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] }, createdAt: { gte: startOfMonth } },
      }),
      prisma.opportunity.count({ where: { status: OpportunityStatus.OPEN } }),
      prisma.opportunity.count({ where: { status: OpportunityStatus.OPEN, createdAt: { gte: startOfMonth } } }),
      // Company revenue = resolved commission (not deal size), so we need the
      // rows, not a DB _sum of dealSize.
      prisma.opportunity.findMany({
        where: { status: OpportunityStatus.CLOSED_WON },
        select: { dealSize: true, commission: true, commissionUnit: true },
      }),
      prisma.property.count(),
      prisma.property.count({ where: { createdAt: { gte: startOfMonth } } }),
      buildEarningsByAgent(),
    ]);

  const agents: AgentDto[] = profiles.map((p) => ({
    id: p.id,
    name: p.fullName ?? p.email.split("@")[0],
    email: p.email,
    phone: p.phone,
    city: p.city,
    role: p.role as "ADMIN" | "MANAGER" | "AGENT",
    status: p.status,
    totalEarnings: earningsByAgent.get(p.id) ?? 0,
    createdAt: p.createdAt.toISOString(),
  }));

  const metrics: AgentMetrics = {
    total: agents.length,
    active: agents.filter((a) => a.status === UserStatus.ACTIVE).length,
    pending: agents.filter((a) => a.status === UserStatus.PENDING || a.status === UserStatus.INVITED).length,
    inactive: agents.filter((a) => a.status === UserStatus.INACTIVE || a.status === UserStatus.SUSPENDED).length,
    newThisMonth,
    activeDeals,
    activeDealsNewThisMonth,
    totalRevenue: wonRevenueRows.reduce((s, o) => s + resolveCompanyRevenue(o), 0),
    totalListings,
    totalListingsNewThisMonth,
  };

  return { ok: true, agents, metrics };
}

type UpdateAgentStatusResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function updateAgentStatus(
  agentId: string,
  newStatus: "ACTIVE" | "INACTIVE",
): Promise<UpdateAgentStatusResult> {
  const auth = await requirePermission("agents:update");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const agent = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!agent || agent.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  const previous = agent.status;

  await prisma.profile.update({
    where: { id: agentId },
    data: { status: newStatus },
  });

  await logActivity({
    actorId: auth.profile.id,
    action: newStatus === "ACTIVE" ? "AGENT_ACTIVATED" : "AGENT_DEACTIVATED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: { status: previous },
    newValues: { status: newStatus },
  });

  return { ok: true };
}

export type UpdateAgentInput = {
  fullName?: string;
  phone?: string | null;
  city?: string | null;
  role?: "AGENT" | "MANAGER";
};

type UpdateAgentResult =
  | { ok: true; agent: AgentDto }
  | { ok: false; error: string; status: number };

/** Admin-only edit of an agent's profile fields — name/phone/city/role. Role is
 * deliberately restricted to AGENT|MANAGER, mirroring the invite flow: Admin is
 * never assignable through this UI. */
export async function updateAgent(
  agentId: string,
  input: UpdateAgentInput,
): Promise<UpdateAgentResult> {
  const auth = await requirePermission("agents:update");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const existing = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!existing || existing.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  if (input.role && input.role !== UserRole.AGENT && input.role !== UserRole.MANAGER) {
    return { ok: false, error: "Role must be AGENT or MANAGER.", status: 400 };
  }

  const data: { fullName?: string; phone?: string | null; city?: string | null; role?: UserRole } = {};
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.city !== undefined) data.city = input.city;
  if (input.role !== undefined) data.role = input.role;

  const updated = await prisma.profile.update({ where: { id: agentId }, data });

  await logActivity({
    actorId: auth.profile.id,
    action: "AGENT_UPDATED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: { fullName: existing.fullName, phone: existing.phone, city: existing.city, role: existing.role },
    newValues: { fullName: updated.fullName, phone: updated.phone, city: updated.city, role: updated.role },
  });

  const earningsByAgent = await buildEarningsByAgent();

  return {
    ok: true,
    agent: {
      id: updated.id,
      name: updated.fullName ?? updated.email.split("@")[0],
      email: updated.email,
      phone: updated.phone,
      city: updated.city,
      role: updated.role as "ADMIN" | "MANAGER" | "AGENT",
      status: updated.status,
      totalEarnings: earningsByAgent.get(updated.id) ?? 0,
      createdAt: updated.createdAt.toISOString(),
    },
  };
}

type DeleteAgentResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function deleteAgent(agentId: string): Promise<DeleteAgentResult> {
  const auth = await requirePermission("agents:delete");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  if (agentId === auth.profile.id) {
    return { ok: false, error: "You cannot delete your own account.", status: 400 };
  }

  const agent = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!agent || agent.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  await prisma.profile.delete({ where: { id: agentId } });

  await logActivity({
    actorId: auth.profile.id,
    action: "AGENT_DELETED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: { email: agent.email, role: agent.role, status: agent.status },
  });

  return { ok: true };
}

export type AssignedPropertySummary = {
  id: string;
  listingId: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  location: string;
  salePrice: number | null;
  rentPrice: number | null;
};

export type AgentDetailDto = AgentDto & {
  totalListings: number;
  totalDeals: number;
  openDeals: number;
  totalRevenue: number;
  properties: AssignedPropertySummary[];
};

type GetAgentDetailResult =
  | { ok: true; agent: AgentDetailDto }
  | { ok: false; error: string; status: number };

/** Agent profile + their assigned listings and deal stats (ADMIN/MANAGER only). */
export async function getAgentDetail(agentId: string): Promise<GetAgentDetailResult> {
  const auth = await requirePermission("agents:view");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const profile = await prisma.profile.findUnique({
    where: { id: agentId },
    select: { id: true, email: true, fullName: true, phone: true, city: true, role: true, status: true, createdAt: true },
  });
  if (!profile || profile.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  const [properties, totalDeals, openDeals, wonOpportunities] = await Promise.all([
    prisma.property.findMany({
      where: { assignedAgentId: agentId },
      select: {
        id: true,
        listingId: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        location: true,
        salePrice: true,
        rentPrice: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contract.count({ where: { assignedAgentId: agentId } }),
    prisma.opportunity.count({ where: { assignedAgentId: agentId, status: OpportunityStatus.OPEN } }),
    // Revenue is driven by closed-won Opportunities, not Contracts (client decision,
    // see ulrich-claude-code-project-context.md §17) — a deal counts the moment it's
    // won, regardless of whether its Contract is signed yet. "Total Revenue" is the
    // resolved company commission; "Total Earnings" is the resolved agent commission.
    prisma.opportunity.findMany({
      where: { assignedAgentId: agentId, status: OpportunityStatus.CLOSED_WON },
      select: {
        dealSize: true, commission: true, commissionUnit: true,
        agentCommissionValue: true, agentCommissionUnit: true,
      },
    }),
  ]);

  const totalRevenue = wonOpportunities.reduce((sum, o) => sum + resolveCompanyRevenue(o), 0);
  const totalEarnings = wonOpportunities.reduce((sum, o) => sum + resolveAgentEarnings(o), 0);

  const agent: AgentDetailDto = {
    id: profile.id,
    name: profile.fullName ?? profile.email.split("@")[0],
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    role: profile.role as "ADMIN" | "MANAGER" | "AGENT",
    status: profile.status,
    totalEarnings,
    createdAt: profile.createdAt.toISOString(),
    totalListings: properties.length,
    totalDeals,
    openDeals,
    totalRevenue,
    properties: properties.map((p) => ({
      id: p.id,
      listingId: p.listingId,
      slug: p.slug,
      title: p.title,
      type: p.type,
      status: p.status,
      location: p.location,
      salePrice: p.salePrice === null ? null : Number(p.salePrice),
      rentPrice: p.rentPrice === null ? null : Number(p.rentPrice),
    })),
  };

  return { ok: true, agent };
}
