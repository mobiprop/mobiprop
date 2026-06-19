import "server-only";

import type { NotificationAudience, NotificationType } from "@/features/notifications/types/notification-types";
import type { DashboardNotificationPreferences } from "@/features/profile/preferences";

/**
 * Static catalog describing how each event routes. `category` is the preference
 * toggle (in staff `dashboardNotifications`) that gates the PUSH channel;
 * `critical` events always create the in-app row regardless of preferences.
 *
 * Keep recipient logic OUT of here — that lives in resolve-recipients.ts.
 */
export type NotificationEventDef = {
  audience: NotificationAudience | "ANY";
  /** Preference key gating push, or null for always-on (e.g. invitations). */
  category: keyof DashboardNotificationPreferences | null;
  critical: boolean;
};

export const NOTIFICATION_EVENTS: Record<NotificationType, NotificationEventDef> = {
  INVITATION_CREATED: { audience: "STAFF", category: null, critical: true },
  INVITATION_ACCEPTED: { audience: "STAFF", category: null, critical: true },
  INVITATION_REVOKED: { audience: "STAFF", category: null, critical: true },
  INVITATION_RESENT: { audience: "STAFF", category: null, critical: false },

  LISTING_CREATED: { audience: "STAFF", category: "listingUpdates", critical: false },
  LISTING_ASSIGNED: { audience: "STAFF", category: "listingUpdates", critical: false },
  LISTING_STATUS_CHANGED: { audience: "STAFF", category: "listingUpdates", critical: false },
  LISTING_FEATURED_CHANGED: { audience: "STAFF", category: "listingUpdates", critical: false },
  LISTING_DELETED: { audience: "STAFF", category: "listingUpdates", critical: false },

  LEAD_CREATED: { audience: "STAFF", category: "newLeads", critical: false },
  LEAD_ASSIGNED: { audience: "STAFF", category: "leadAssignments", critical: false },
  LEAD_REASSIGNED: { audience: "STAFF", category: "leadAssignments", critical: false },
  LEAD_BECAME_HOT: { audience: "STAFF", category: "leadAssignments", critical: false },
  LEAD_CONVERTED: { audience: "STAFF", category: "leadAssignments", critical: false },

  TOUR_REQUESTED: { audience: "STAFF", category: "tourUpdates", critical: false },
  TOUR_CONFIRMED: { audience: "ANY", category: "tourUpdates", critical: false },
  TOUR_RESCHEDULED: { audience: "ANY", category: "tourUpdates", critical: false },
  TOUR_CANCELLED: { audience: "ANY", category: "tourUpdates", critical: false },

  OPPORTUNITY_STAGE_CHANGED: { audience: "STAFF", category: "opportunityUpdates", critical: false },
  OPPORTUNITY_WON: { audience: "STAFF", category: "opportunityUpdates", critical: false },
  OPPORTUNITY_LOST: { audience: "STAFF", category: "opportunityUpdates", critical: false },

  CONTRACT_CREATED: { audience: "STAFF", category: "contractUpdates", critical: false },
  CONTRACT_EXPIRING: { audience: "STAFF", category: "contractUpdates", critical: true },
  CONTRACT_EXPIRED: { audience: "STAFF", category: "contractUpdates", critical: true },
};

export function getEventDef(type: NotificationType): NotificationEventDef | null {
  return NOTIFICATION_EVENTS[type] ?? null;
}

/** True when the recipient's role is allowed to receive this event's audience. */
export function audienceAllowsRole(
  audience: NotificationEventDef["audience"],
  role: "ADMIN" | "MANAGER" | "AGENT" | "USER",
): boolean {
  if (audience === "ANY") return true;
  if (audience === "STAFF") return role !== "USER";
  return role === "USER"; // CLIENT
}
