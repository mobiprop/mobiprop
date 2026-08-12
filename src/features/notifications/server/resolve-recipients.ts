import "server-only";

import type { RecipientStrategy } from "@/features/notifications/types/notification-types";
import { prisma } from "@/lib/prisma";

/**
 * Centralized recipient resolution. Business modules describe WHAT happened and
 * name a RecipientStrategy (in the policy registry); this file decides WHO is
 * notified, so role rules change in one place without touching feature code
 * (project guide §18).
 *
 * Every strategy returns a de-duplicated list of ACTIVE Profile ids; unknown or
 * inactive ids are dropped. The acting user is excluded later (per policy) at
 * the notify-events layer.
 */

export type RecipientContext = {
  /** Currently-assigned agent (lead/listing/tour/contract owner). */
  assignedAgentId?: string | null;
  /** Previous agent, for reassignment events. */
  previousAgentId?: string | null;
  /** Exact single recipient for DIRECT_RECIPIENT (e.g. a chat message's other participant). */
  recipientId?: string | null;
};

async function keepActive(ids: (string | null | undefined)[]): Promise<string[]> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return [];

  const active = await prisma.profile.findMany({
    where: { id: { in: unique }, status: "ACTIVE" },
    select: { id: true },
  });
  return active.map((p) => p.id);
}

/** Active profile ids for one or more roles. */
async function activeIdsForRoles(roles: ("ADMIN" | "MANAGER" | "AGENT")[]): Promise<string[]> {
  const rows = await prisma.profile.findMany({
    where: { role: { in: roles }, status: "ACTIVE" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Resolve a strategy to a de-duplicated list of active recipient ids.
 *
 * Fallback strategies notify management ONLY when no operational owner exists —
 * an assigned agent handling the record does not also ping every admin/manager
 * (project plan §2, §14). Oversight roles are copied explicitly via the
 * *_PLUS_ADMINS strategies where the business wants full visibility.
 */
export async function resolveByStrategy(
  strategy: RecipientStrategy,
  ctx: RecipientContext,
): Promise<string[]> {
  switch (strategy) {
    case "NONE":
      return [];

    case "ALL_ADMINS":
      return activeIdsForRoles(["ADMIN"]);

    case "MANAGERS_AND_ADMINS":
      return activeIdsForRoles(["ADMIN", "MANAGER"]);

    case "ALL_STAFF":
      return activeIdsForRoles(["ADMIN", "MANAGER", "AGENT"]);

    case "ASSIGNED_AGENT_PLUS_ADMINS":
      return keepActive([ctx.assignedAgentId, ...(await activeIdsForRoles(["ADMIN"]))]);

    case "NEW_AND_PREV_AGENT_PLUS_ADMINS":
      return keepActive([
        ctx.assignedAgentId,
        ctx.previousAgentId,
        ...(await activeIdsForRoles(["ADMIN"])),
      ]);

    case "LISTING_AGENT_WITH_MANAGEMENT_FALLBACK":
    case "TOUR_AGENT_WITH_MANAGEMENT_FALLBACK":
    case "LEAD_AGENT_WITH_MANAGEMENT_FALLBACK": {
      const agent = await keepActive([ctx.assignedAgentId]);
      if (agent.length > 0) return agent;
      // No operational owner → escalate to management.
      return activeIdsForRoles(["ADMIN", "MANAGER"]);
    }

    case "DOCUSIGN_STAKEHOLDERS":
      return keepActive([ctx.assignedAgentId, ...(await activeIdsForRoles(["ADMIN", "MANAGER"]))]);

    case "DIRECT_RECIPIENT":
      return keepActive([ctx.recipientId]);

    default: {
      // Exhaustiveness guard — a new strategy must be handled here.
      const _never: never = strategy;
      return _never;
    }
  }
}
