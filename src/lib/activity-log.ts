import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type ActivityEntityType = "AGENT_INVITATION" | "PROFILE" | "PROFILE_SETTINGS";

export type ActivityAction =
  | "INVITATION_CREATED"
  | "INVITATION_RESENT"
  | "INVITATION_REVOKED"
  | "INVITATION_ACCEPTED"
  | "PROFILE_CREATED"
  | "ROLE_ASSIGNED"
  | "PROFILE_SETTINGS_UPDATED"
  | "SECURITY_SETTINGS_UPDATED"
  | "NOTIFICATION_PREFERENCES_UPDATED"
  | "GENERAL_PREFERENCES_UPDATED"
  | "PASSWORD_CHANGED";

type LogActivityInput = {
  /** Profile id of the user who performed the action; null for system/self-serve flows. */
  actorId?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
};

/**
 * Append an audit-trail entry. Best-effort by design: a logging failure is
 * reported to the server console but never aborts the action being logged.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues,
        newValues: input.newValues,
      },
    });
  } catch (error) {
    console.error("[activity-log] failed to record", input.action, error);
  }
}
