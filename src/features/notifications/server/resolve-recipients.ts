import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Centralized recipient policies. Business modules describe WHAT happened; these
 * functions decide WHO is notified, so role rules can change in one place without
 * touching lead/tour/listing code (project guide §18).
 *
 * Each function returns a de-duplicated list of recipient Profile ids. Only
 * ACTIVE staff profiles are returned; unknown/inactive ids are dropped.
 */

async function keepActive(ids: (string | null | undefined)[]): Promise<string[]> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return [];

  const active = await prisma.profile.findMany({
    where: { id: { in: unique }, status: "ACTIVE" },
    select: { id: true },
  });
  return active.map((p) => p.id);
}

/** Lead assigned → the assigned agent. */
export function resolveLeadAssignedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId]);
}

/** Lead reassigned → the new agent (and the previous agent, where present). */
export function resolveLeadReassignedRecipients(input: {
  assignedAgentId: string | null;
  previousAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, input.previousAgentId]);
}

/** Tour requested → the assigned listing agent (manager fan-out can be added later). */
export function resolveTourRequestedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId]);
}

/**
 * Tour status change → the assigned agent. The submitting client is tracked by
 * email snapshot (not necessarily a Profile), so client push is out of scope
 * until accounts are linked; in-app/email can cover them later.
 */
export function resolveTourStatusRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId]);
}

/** Listing assigned → the newly assigned agent. */
export function resolveListingAssignedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId]);
}

/** Contract expiring → assigned agent plus all active managers/admins. */
export async function resolveContractExpiringRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  const staff = await prisma.profile.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] }, status: "ACTIVE" },
    select: { id: true },
  });
  return keepActive([input.assignedAgentId, ...staff.map((s) => s.id)]);
}
