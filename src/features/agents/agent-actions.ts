import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { UserRole, UserStatus } from "@/generated/prisma/enums";

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

  await prisma.profile.update({
    where: { id: agentId },
    data: { status: newStatus },
  });

  return { ok: true };
}
