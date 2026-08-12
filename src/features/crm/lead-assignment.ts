import "server-only";

import { prisma } from "@/lib/prisma";

export type LeadAgentResolution = {
  agentId: string | null;
  source: "listing_agent" | "listing_creator" | "unassigned";
};

/**
 * Resolve who a lead tied to a listing should be assigned to: the listing's
 * assigned agent, falling back to whoever created the listing, falling back
 * to unassigned. Both candidates must be an ACTIVE profile to count — an
 * inactive/suspended agent is treated the same as no agent.
 */
export async function resolveLeadAgent(propertyId: string | null | undefined): Promise<LeadAgentResolution> {
  if (!propertyId) return { agentId: null, source: "unassigned" };

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { assignedAgentId: true, createdById: true },
  });
  if (!property) return { agentId: null, source: "unassigned" };

  const candidateIds = [property.assignedAgentId, property.createdById].filter(
    (id): id is string => !!id,
  );
  if (candidateIds.length === 0) return { agentId: null, source: "unassigned" };

  const activeProfiles = await prisma.profile.findMany({
    where: { id: { in: candidateIds }, status: "ACTIVE" },
    select: { id: true },
  });
  const activeIds = new Set(activeProfiles.map((p) => p.id));

  if (property.assignedAgentId && activeIds.has(property.assignedAgentId)) {
    return { agentId: property.assignedAgentId, source: "listing_agent" };
  }
  if (property.createdById && activeIds.has(property.createdById)) {
    return { agentId: property.createdById, source: "listing_creator" };
  }
  return { agentId: null, source: "unassigned" };
}
