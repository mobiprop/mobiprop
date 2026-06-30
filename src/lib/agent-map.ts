import "server-only";

import { prisma } from "@/lib/prisma";

export type AgentMapEntry = { id: string; fullName: string | null; email: string };

/**
 * Bulk-resolves Profile ids (e.g. `assignedAgentId` columns) to a display
 * name/email. Opportunities/Contracts/Leads only store a loose UUID — there's
 * no Prisma relation to Profile across the auth/app boundary — so callers
 * batch their ids through this instead of N+1 querying per row.
 */
export async function buildAgentMap(agentIds: (string | null)[]): Promise<Map<string, AgentMapEntry>> {
  const ids = [...new Set(agentIds.filter(Boolean) as string[])];
  if (ids.length === 0) return new Map();
  const agents = await prisma.profile.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true, email: true },
  });
  return new Map(agents.map((a) => [a.id, a]));
}

export function agentDisplayName(entry: AgentMapEntry | undefined | null): string | null {
  if (!entry) return null;
  return entry.fullName ?? entry.email.split("@")[0];
}
