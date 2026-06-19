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

/**
 * Active profile ids for one or more roles. Used to broadcast staff events to
 * oversight roles (admins always; managers where the event warrants it).
 */
async function activeIdsForRoles(roles: ("ADMIN" | "MANAGER")[]): Promise<string[]> {
  const rows = await prisma.profile.findMany({
    where: { role: { in: roles }, status: "ACTIVE" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Admins get full visibility: every staff-facing notification includes all
 * active admins, regardless of assignment. Callers still exclude the acting user
 * (no one is pinged about their own action) at the notify-events layer.
 */
function activeAdminIds(): Promise<string[]> {
  return activeIdsForRoles(["ADMIN"]);
}

/** Lead assigned → the assigned agent + all active admins. */
export async function resolveLeadAssignedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, ...(await activeAdminIds())]);
}

/** Lead reassigned → the new agent, the previous agent, + all active admins. */
export async function resolveLeadReassignedRecipients(input: {
  assignedAgentId: string | null;
  previousAgentId: string | null;
}): Promise<string[]> {
  return keepActive([
    input.assignedAgentId,
    input.previousAgentId,
    ...(await activeAdminIds()),
  ]);
}

/** Tour requested → assigned agent (if any) + all active admins & managers. */
export async function resolveTourRequestedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, ...(await activeIdsForRoles(["ADMIN", "MANAGER"]))]);
}

/**
 * Tour status change → the assigned agent + all active admins. The submitting
 * client is tracked by email snapshot (not necessarily a Profile), so client
 * push is out of scope until accounts are linked; in-app/email can cover them.
 */
export async function resolveTourStatusRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, ...(await activeAdminIds())]);
}

/** Listing assigned → the newly assigned agent + all active admins. */
export async function resolveListingAssignedRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, ...(await activeAdminIds())]);
}

/** Contract expiring → assigned agent plus all active managers/admins. */
export async function resolveContractExpiringRecipients(input: {
  assignedAgentId: string | null;
}): Promise<string[]> {
  return keepActive([input.assignedAgentId, ...(await activeIdsForRoles(["ADMIN", "MANAGER"]))]);
}
