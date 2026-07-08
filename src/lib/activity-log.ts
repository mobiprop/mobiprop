import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type ActivityEntityType =
  | "AGENT_INVITATION"
  | "PROFILE"
  | "PROFILE_SETTINGS"
  | "PROPERTY"
  | "CONTACT"
  | "LEAD"
  | "LEAD_NOTE"
  | "TOUR"
  | "LOCATION"
  | "OPPORTUNITY"
  | "CONTRACT"
  | "BLOG_POST"
  | "BLOG_CATEGORY";

export type ActivityAction =
  | "INVITATION_CREATED"
  | "INVITATION_RESENT"
  | "INVITATION_REVOKED"
  | "INVITATION_ACCEPTED"
  | "AGENT_ACTIVATED"
  | "AGENT_DEACTIVATED"
  | "AGENT_DELETED"
  | "AGENT_UPDATED"
  | "PROFILE_CREATED"
  | "ROLE_ASSIGNED"
  | "PROFILE_SETTINGS_UPDATED"
  | "SECURITY_SETTINGS_UPDATED"
  | "NOTIFICATION_PREFERENCES_UPDATED"
  | "GENERAL_PREFERENCES_UPDATED"
  | "PASSWORD_CHANGED"
  | "PROPERTY_CREATED"
  | "PROPERTY_UPDATED"
  | "PROPERTY_DELETED"
  | "PROPERTY_STATUS_CHANGED"
  | "PROPERTY_FEATURED_CHANGED"
  | "PROPERTY_IMAGE_UPLOADED"
  | "PROPERTY_IMAGE_REMOVED"
  | "PROPERTY_COVER_CHANGED"
  | "PROPERTY_IMAGES_REORDERED"
  | "PROPERTY_IMAGE_OPTIMIZATION_FALLBACK"
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "CONTACT_DELETED"
  | "CONTACT_RESTORED"
  | "CONTACT_PROPERTY_LINKED"
  | "CONTACT_PROPERTY_UNLINKED"
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "LEAD_CONTACT_LINKED"
  | "LEAD_LISTING_LINKED"
  | "LEAD_ASSIGNED"
  | "LEAD_REASSIGNED"
  | "LEAD_SCORE_CHANGED"
  | "LEAD_TEMPERATURE_CHANGED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_FOLLOW_UP_CHANGED"
  | "LEAD_NOTE_ADDED"
  | "LEAD_NOTE_UPDATED"
  | "LEAD_INQUIRY_RECEIVED"
  | "LEAD_TOUR_LINKED"
  | "LEAD_CONVERTED"
  | "LEAD_ARCHIVED"
  | "LEAD_RESTORED"
  | "TOUR_CREATED"
  | "TOUR_CONFIRMED"
  | "TOUR_RESCHEDULED"
  | "TOUR_COMPLETED"
  | "TOUR_CANCELLED"
  | "TOUR_NO_SHOW"
  | "TOUR_ASSIGNED"
  | "TOUR_REASSIGNED"
  | "TOUR_UPDATED"
  | "TOUR_LEAD_CREATED"
  | "TOUR_LEAD_REUSED"
  | "LOCATION_CREATED"
  | "LOCATION_UPDATED"
  | "LOCATION_DELETED"
  | "GOOGLE_CALENDAR_CONNECTED"
  | "GOOGLE_CALENDAR_DISCONNECTED"
  | "OPPORTUNITY_CREATED"
  | "OPPORTUNITY_UPDATED"
  | "OPPORTUNITY_STATUS_CHANGED"
  | "OPPORTUNITY_DELETED"
  | "CONTRACT_CREATED"
  | "CONTRACT_UPDATED"
  | "CONTRACT_STATUS_CHANGED"
  | "CONTRACT_DELETED"
  | "CONTRACT_DOCUMENT_UPLOADED"
  | "CONTRACT_DOCUMENT_REMOVED"
  | "BLOG_POST_CREATED"
  | "BLOG_POST_UPDATED"
  | "BLOG_POST_DELETED"
  | "BLOG_POST_STATUS_CHANGED"
  | "BLOG_CATEGORY_CREATED"
  | "BLOG_CATEGORY_UPDATED"
  | "BLOG_CATEGORY_DELETED";

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
