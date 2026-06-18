import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { ContractStatus, OpportunityStatus, UserRole, UserStatus } from "@/generated/prisma/enums";

export type AgentDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: "ADMIN" | "MANAGER" | "AGENT";
  status: UserStatus;
  createdAt: string;
};

export type AgentMetrics = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
};

type ListAgentsResult =
  | { ok: true; agents: AgentDto[]; metrics: AgentMetrics }
  | { ok: false; error: string; status: number };

export async function listAgents(): Promise<ListAgentsResult> {
  const auth = await requirePermission("agents:view");
  if (!auth.ok) return { ok: false, error: auth.error, status: 403 };

  const profiles = await prisma.profile.findMany({
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
  });

  const agents: AgentDto[] = profiles.map((p) => ({
    id: p.id,
    name: p.fullName ?? p.email.split("@")[0],
    email: p.email,
    phone: p.phone,
    city: p.city,
    role: p.role as "ADMIN" | "MANAGER" | "AGENT",
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  const metrics: AgentMetrics = {
    total: agents.length,
    active: agents.filter((a) => a.status === UserStatus.ACTIVE).length,
    pending: agents.filter((a) => a.status === UserStatus.PENDING || a.status === UserStatus.INVITED).length,
    inactive: agents.filter((a) => a.status === UserStatus.INACTIVE || a.status === UserStatus.SUSPENDED).length,
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

  const [properties, totalDeals, openDeals, revenueAgg] = await Promise.all([
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
    prisma.contract.aggregate({
      where: { assignedAgentId: agentId, status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] } },
      _sum: { value: true },
    }),
  ]);

  const agent: AgentDetailDto = {
    id: profile.id,
    name: profile.fullName ?? profile.email.split("@")[0],
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    role: profile.role as "ADMIN" | "MANAGER" | "AGENT",
    status: profile.status,
    createdAt: profile.createdAt.toISOString(),
    totalListings: properties.length,
    totalDeals,
    openDeals,
    totalRevenue: revenueAgg._sum.value ? Number(revenueAgg._sum.value) : 0,
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
