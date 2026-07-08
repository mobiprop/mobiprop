import "server-only";

import {
  startOfMonth as dfStartOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { logActivity } from "@/lib/activity-log";
import { resolveCompanyRevenue, resolveAgentEarnings } from "@/lib/commission";
import { uploadAvatar, removeAvatar } from "@/lib/supabase/storage";
import { OpportunityStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export type AgentDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  /** Private admin-only notes (Edit Agent modal) — distinct from the agent's
   * own public bio (Profile.description). */
  notes: string | null;
  teamLeaderId: string | null;
  teamLeaderName: string | null;
  role: "ADMIN" | "MANAGER" | "AGENT";
  status: UserStatus;
  /** This agent's own computed commission earnings — sum of the resolved
   * agentCommission across their CLOSED_WON opportunities. Distinct from company
   * revenue (the resolved Commission Amount the brokerage earns). */
  totalEarnings: number;
  createdAt: string;
};

type ProfileWithTeamLeader = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  notes: string | null;
  teamLeaderId: string | null;
  teamLeader: { fullName: string | null; email: string } | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};

function toAgentDto(p: ProfileWithTeamLeader, totalEarnings: number): AgentDto {
  return {
    id: p.id,
    name: p.fullName ?? p.email.split("@")[0],
    email: p.email,
    phone: p.phone,
    city: p.city,
    avatarUrl: p.avatarUrl,
    notes: p.notes,
    teamLeaderId: p.teamLeaderId,
    teamLeaderName: p.teamLeader ? (p.teamLeader.fullName ?? p.teamLeader.email) : null,
    role: p.role as "ADMIN" | "MANAGER" | "AGENT",
    status: p.status,
    totalEarnings,
    createdAt: p.createdAt.toISOString(),
  };
}

/** Sums each agent's computed commission earnings across their CLOSED_WON opportunities. */
async function buildEarningsByAgent(): Promise<Map<string, number>> {
  const rows = await prisma.opportunity.findMany({
    where: { status: OpportunityStatus.CLOSED_WON, assignedAgentId: { not: null }, isDeleted: false },
    select: { assignedAgentId: true, dealSize: true, commission: true, commissionUnit: true, agentCommissionValue: true, agentCommissionUnit: true },
  });

  const earnings = new Map<string, number>();
  for (const row of rows) {
    if (!row.assignedAgentId) continue;
    const amount = resolveAgentEarnings(row);
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

  // Everything on this page is scoped to the caller's team: for MANAGER the
  // roster shows only their direct reports (agents whose teamLeaderId points
  // to them) and the deals/revenue/listings metrics cover self + those
  // reports; ADMIN (scopeIds === null) stays company-wide.
  const scopeIds = await resolveOwnerScopeIds(auth.profile);
  const opportunityOwnerScope: Prisma.OpportunityWhereInput =
    scopeIds === null ? {} : { OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
  const propertyOwnerScope: Prisma.PropertyWhereInput =
    scopeIds === null ? {} : { OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
  const rosterWhere: Prisma.ProfileWhereInput = {
    role: { in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT] },
    // Exclude the caller themselves so admins don't see themselves in the "approve" list
    NOT: { id: auth.profile.id },
    ...(scopeIds === null ? {} : { teamLeaderId: auth.profile.id }),
  };

  const [profiles, newThisMonth, activeDeals, activeDealsNewThisMonth, wonRevenueRows, totalListings, totalListingsNewThisMonth, earningsByAgent] =
    await Promise.all([
      prisma.profile.findMany({
        where: rosterWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          city: true,
          avatarUrl: true,
          notes: true,
          teamLeaderId: true,
          teamLeader: { select: { fullName: true, email: true } },
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.profile.count({
        where: { ...rosterWhere, createdAt: { gte: startOfMonth } },
      }),
      prisma.opportunity.count({ where: { status: OpportunityStatus.OPEN, isDeleted: false, ...opportunityOwnerScope } }),
      prisma.opportunity.count({
        where: { status: OpportunityStatus.OPEN, isDeleted: false, createdAt: { gte: startOfMonth }, ...opportunityOwnerScope },
      }),
      // Company revenue = resolved commission (not deal size), so we need the
      // rows, not a DB _sum of dealSize.
      prisma.opportunity.findMany({
        where: { status: OpportunityStatus.CLOSED_WON, isDeleted: false, ...opportunityOwnerScope },
        select: { dealSize: true, commission: true, commissionUnit: true },
      }),
      prisma.property.count({ where: propertyOwnerScope }),
      prisma.property.count({ where: { createdAt: { gte: startOfMonth }, ...propertyOwnerScope } }),
      buildEarningsByAgent(),
    ]);

  const agents: AgentDto[] = profiles.map((p) => toAgentDto(p, earningsByAgent.get(p.id) ?? 0));

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
  notes?: string | null;
  teamLeaderId?: string | null;
};

type UpdateAgentResult =
  | { ok: true; agent: AgentDto }
  | { ok: false; error: string; status: number };

/** Confirms a teamLeaderId refers to a real, active Manager/Admin — never the
 * agent itself. */
async function validateTeamLeader(agentId: string, teamLeaderId: string): Promise<string | null> {
  if (teamLeaderId === agentId) return "An agent can't be their own team leader.";

  const leader = await prisma.profile.findUnique({
    where: { id: teamLeaderId },
    select: { role: true, status: true },
  });
  if (!leader || (leader.role !== UserRole.MANAGER && leader.role !== UserRole.ADMIN) || leader.status !== UserStatus.ACTIVE) {
    return "Team leader must be an active Manager or Admin.";
  }
  return null;
}

/** Admin-only edit of an agent's profile fields — name/phone/city/role/notes/
 * team leader. Role is deliberately restricted to AGENT|MANAGER: promoting to
 * or demoting from ADMIN isn't supported through this endpoint (ADMIN accounts
 * are only created via the invite flow's invitations:inviteAdmin gate). This
 * also blocks a caller from using this endpoint to change an existing ADMIN's
 * role at all — including their own — even by calling the API directly. */
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

  if (existing.role === UserRole.ADMIN && input.role) {
    return { ok: false, error: "An Admin's role can't be changed here.", status: 403 };
  }

  if (input.teamLeaderId) {
    const leaderError = await validateTeamLeader(agentId, input.teamLeaderId);
    if (leaderError) return { ok: false, error: leaderError, status: 422 };
  }

  const data: {
    fullName?: string;
    phone?: string | null;
    city?: string | null;
    role?: UserRole;
    notes?: string | null;
    teamLeaderId?: string | null;
  } = {};
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.city !== undefined) data.city = input.city;
  if (input.role !== undefined) data.role = input.role;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.teamLeaderId !== undefined) data.teamLeaderId = input.teamLeaderId || null;

  const updated = await prisma.profile.update({
    where: { id: agentId },
    data,
    include: { teamLeader: { select: { fullName: true, email: true } } },
  });

  await logActivity({
    actorId: auth.profile.id,
    action: "AGENT_UPDATED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: {
      fullName: existing.fullName,
      phone: existing.phone,
      city: existing.city,
      role: existing.role,
      notes: existing.notes,
      teamLeaderId: existing.teamLeaderId,
    },
    newValues: {
      fullName: updated.fullName,
      phone: updated.phone,
      city: updated.city,
      role: updated.role,
      notes: updated.notes,
      teamLeaderId: updated.teamLeaderId,
    },
  });

  const earningsByAgent = await buildEarningsByAgent();

  return {
    ok: true,
    agent: toAgentDto(updated, earningsByAgent.get(updated.id) ?? 0),
  };
}

const MAX_AGENT_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB, matches the self-service profile photo limit
const ALLOWED_AGENT_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Admin-only: upload/replace an agent's profile photo (Edit Agent modal). */
export async function updateAgentAvatar(agentId: string, file: File): Promise<UpdateAgentResult> {
  const auth = await requirePermission("agents:update");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const existing = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!existing || existing.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  if (file.size > MAX_AGENT_AVATAR_BYTES) {
    return { ok: false, error: "Image must be smaller than 5MB.", status: 400 };
  }
  if (!ALLOWED_AGENT_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Image must be a PNG, JPEG, WEBP or GIF.", status: 400 };
  }

  let avatarUrl: string;
  try {
    avatarUrl = await uploadAvatar(agentId, file);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to upload photo.", status: 500 };
  }

  const updated = await prisma.profile.update({
    where: { id: agentId },
    data: { avatarUrl },
    include: { teamLeader: { select: { fullName: true, email: true } } },
  });

  await logActivity({
    actorId: auth.profile.id,
    action: "AGENT_UPDATED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: { avatarUrl: existing.avatarUrl },
    newValues: { avatarUrl: updated.avatarUrl },
  });

  const earningsByAgent = await buildEarningsByAgent();
  return { ok: true, agent: toAgentDto(updated, earningsByAgent.get(updated.id) ?? 0) };
}

/** Admin-only: remove an agent's profile photo. */
export async function removeAgentAvatar(agentId: string): Promise<UpdateAgentResult> {
  const auth = await requirePermission("agents:update");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const existing = await prisma.profile.findUnique({ where: { id: agentId } });
  if (!existing || existing.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  await removeAvatar(agentId);

  const updated = await prisma.profile.update({
    where: { id: agentId },
    data: { avatarUrl: null },
    include: { teamLeader: { select: { fullName: true, email: true } } },
  });

  await logActivity({
    actorId: auth.profile.id,
    action: "AGENT_UPDATED",
    entityType: "PROFILE",
    entityId: agentId,
    oldValues: { avatarUrl: existing.avatarUrl },
    newValues: { avatarUrl: null },
  });

  const earningsByAgent = await buildEarningsByAgent();
  return { ok: true, agent: toAgentDto(updated, earningsByAgent.get(updated.id) ?? 0) };
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

// Reporting-period filter for the Agent Detail page's deal/revenue stats
// (Total Deals, Open Deals, Total Revenue, Total Earnings). Total Listings and
// the Properties table are deliberately left as current-state snapshots, not
// scoped to the period, since "assigned listings" isn't an event that happens
// within a window the way a deal being created/won is.
export type AgentDetailPeriod = "current_month" | "last_month" | "this_quarter" | "this_year";

function resolvePeriodBounds(period: AgentDetailPeriod): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return { start: dfStartOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case "this_quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "current_month":
    default:
      return { start: dfStartOfMonth(now), end: endOfMonth(now) };
  }
}

/** Agent profile + their assigned listings and deal stats (ADMIN/MANAGER only). */
export async function getAgentDetail(
  agentId: string,
  period: AgentDetailPeriod = "current_month",
): Promise<GetAgentDetailResult> {
  const auth = await requirePermission("agents:view");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const profile = await prisma.profile.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      city: true,
      avatarUrl: true,
      notes: true,
      teamLeaderId: true,
      teamLeader: { select: { fullName: true, email: true } },
      role: true,
      status: true,
      createdAt: true,
    },
  });
  if (!profile || profile.role === UserRole.USER) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  // Mirrors the roster scoping in listAgents: a MANAGER may only open their
  // own detail or a direct report's; ADMIN (null scope) can open anyone's.
  const scopeIds = await resolveOwnerScopeIds(auth.profile);
  if (scopeIds !== null && profile.id !== auth.profile.id && profile.teamLeaderId !== auth.profile.id) {
    return { ok: false, error: "Agent not found.", status: 404 };
  }

  const { start, end } = resolvePeriodBounds(period);

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
    // Total/open deals are scoped to the selected reporting period, by when
    // the opportunity was created.
    prisma.opportunity.count({
      where: { assignedAgentId: agentId, isDeleted: false, createdAt: { gte: start, lte: end } },
    }),
    prisma.opportunity.count({
      where: {
        assignedAgentId: agentId,
        status: OpportunityStatus.OPEN,
        isDeleted: false,
        createdAt: { gte: start, lte: end },
      },
    }),
    // Revenue is driven by closed-won Opportunities, not Contracts (client decision,
    // see ulrich-claude-code-project-context.md §17) — a deal counts the moment it's
    // won, regardless of whether its Contract is signed yet. "Total Revenue" is the
    // resolved company commission; "Total Earnings" is the resolved agent commission.
    // No dedicated "closed at" column exists, so `updatedAt` is used as the proxy
    // for close date — same convention as the main dashboard's revenue queries
    // (dashboard-actions.ts).
    prisma.opportunity.findMany({
      where: {
        assignedAgentId: agentId,
        status: OpportunityStatus.CLOSED_WON,
        isDeleted: false,
        updatedAt: { gte: start, lte: end },
      },
      select: {
        dealSize: true, commission: true, commissionUnit: true,
        agentCommissionValue: true, agentCommissionUnit: true,
      },
    }),
  ]);

  const totalRevenue = wonOpportunities.reduce((sum, o) => sum + resolveCompanyRevenue(o), 0);
  const totalEarnings = wonOpportunities.reduce((sum, o) => sum + resolveAgentEarnings(o), 0);

  const agent: AgentDetailDto = {
    ...toAgentDto(profile, totalEarnings),
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
