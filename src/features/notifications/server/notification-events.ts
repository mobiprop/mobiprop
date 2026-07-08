import "server-only";

import type {
  NotificationAudience,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  RecipientStrategy,
} from "@/features/notifications/types/notification-types";
import type { DashboardNotificationPreferences } from "@/features/profile/preferences";

/**
 * Centralized notification policy registry — the single source of truth for how
 * each event routes: which channels it may use, its priority, who receives it,
 * whether the actor is excluded, whether it must be deduplicated, and whether
 * its content must stay customer-safe.
 *
 * Channel decisions must NOT be spread across lead/listing/tour/invitation
 * actions — those call the thin triggers in notify-events.ts, which read this
 * registry. Recipient resolution lives in resolve-recipients.ts (this file only
 * names the strategy).
 *
 * Notes:
 * - `channels: []` means activity-log-only — no notification row is created.
 * - `pushCategory` is the staff preference toggle that gates PUSH; `null` means
 *   always-on (e.g. invitations, which never push anyway).
 * - CRITICAL priority bypasses the category toggle (still honours the master
 *   push switch). Priority is derived here only — never stored on the row.
 * - EMAIL may appear in `channels` for forthcoming flows, but the delivery
 *   pipeline does not send email yet (invitation/auth emails are sent directly
 *   by their own modules).
 */
export type NotificationPolicy = {
  channels: NotificationChannel[];
  priority: NotificationPriority;
  recipientStrategy: RecipientStrategy;
  /** Roles allowed to receive this event (defence-in-depth in createNotification). */
  audience: NotificationAudience | "ANY";
  /** Preference key gating PUSH, or null for always-on. */
  pushCategory: keyof DashboardNotificationPreferences | null;
  /** Skip notifying the user who triggered the event. */
  excludeActor: boolean;
  /** Require an idempotency dedupeKey when fanning out. */
  deduplicate: boolean;
  /** Content (esp. the push body) must not leak private customer data. */
  customerSafe: boolean;
};

const STAFF = "STAFF" as const;
const ANY = "ANY" as const;

export const NOTIFICATION_POLICIES: Record<NotificationType, NotificationPolicy> = {
  // ── Invitations — in-app audit to admins; the invite/welcome email is sent
  //    directly by staff-actions, so EMAIL is not a pipeline channel here. ──
  INVITATION_CREATED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ALL_ADMINS",
    audience: STAFF, pushCategory: null, excludeActor: true, deduplicate: false, customerSafe: false,
  },
  INVITATION_ACCEPTED: {
    channels: ["IN_APP"], priority: "LOW", recipientStrategy: "ALL_ADMINS",
    audience: STAFF, pushCategory: null, excludeActor: false, deduplicate: false, customerSafe: false,
  },
  INVITATION_REVOKED: {
    channels: ["IN_APP"], priority: "LOW", recipientStrategy: "ALL_ADMINS",
    audience: STAFF, pushCategory: null, excludeActor: true, deduplicate: false, customerSafe: false,
  },
  INVITATION_RESENT: {
    channels: ["IN_APP"], priority: "LOW", recipientStrategy: "ALL_ADMINS",
    audience: STAFF, pushCategory: null, excludeActor: true, deduplicate: false, customerSafe: false,
  },

  // ── Listings ──
  LISTING_CREATED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ALL_STAFF",
    audience: STAFF, pushCategory: "listingUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  LISTING_ASSIGNED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "listingUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  LISTING_STATUS_CHANGED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "MANAGERS_AND_ADMINS",
    audience: STAFF, pushCategory: "listingUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },
  LISTING_FEATURED_CHANGED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "listingUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },
  LISTING_DELETED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "MANAGERS_AND_ADMINS",
    audience: STAFF, pushCategory: "listingUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },

  // ── Leads ──
  LEAD_CREATED: {
    channels: [], priority: "LOW", recipientStrategy: "NONE",
    audience: STAFF, pushCategory: null, excludeActor: true, deduplicate: false, customerSafe: false,
  },
  LEAD_ASSIGNED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "leadAssignments", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  LEAD_REASSIGNED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "NEW_AND_PREV_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "leadAssignments", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  LEAD_BECAME_HOT: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "leadAssignments", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  LEAD_CONVERTED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "newLeads", excludeActor: true, deduplicate: false, customerSafe: false,
  },

  // ── Tours — public request is externally initiated (push-worthy, customer-safe). ──
  TOUR_REQUESTED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "TOUR_AGENT_WITH_MANAGEMENT_FALLBACK",
    audience: STAFF, pushCategory: "tourUpdates", excludeActor: false, deduplicate: true, customerSafe: true,
  },
  TOUR_ASSIGNED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  TOUR_CONFIRMED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: ANY, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: true,
  },
  TOUR_RESCHEDULED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: ANY, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: true,
  },
  TOUR_CANCELLED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: ANY, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: true,
  },
  TOUR_COMPLETED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  TOUR_NO_SHOW: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "tourUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },

  // ── Opportunities (policies defined; module does not emit these yet). ──
  OPPORTUNITY_STAGE_CHANGED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "opportunityUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },
  OPPORTUNITY_WON: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "opportunityUpdates", excludeActor: true, deduplicate: true, customerSafe: false,
  },
  OPPORTUNITY_LOST: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "ASSIGNED_AGENT_PLUS_ADMINS",
    audience: STAFF, pushCategory: "opportunityUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },

  // ── DocuSign envelopes — sent/delivered are informational (in-app only);
  //    completed/declined are push-worthy; expiring soon is CRITICAL. ──
  DOCUSIGN_ENVELOPE_SENT: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: true, deduplicate: false, customerSafe: false,
  },
  DOCUSIGN_ENVELOPE_DELIVERED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: false, deduplicate: true, customerSafe: false,
  },
  DOCUSIGN_ENVELOPE_COMPLETED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: false, deduplicate: true, customerSafe: false,
  },
  DOCUSIGN_ENVELOPE_DECLINED: {
    channels: ["IN_APP", "PUSH"], priority: "HIGH", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: false, deduplicate: true, customerSafe: false,
  },
  DOCUSIGN_ENVELOPE_VOIDED: {
    channels: ["IN_APP"], priority: "NORMAL", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: false, deduplicate: true, customerSafe: false,
  },
  DOCUSIGN_ENVELOPE_EXPIRING_SOON: {
    channels: ["IN_APP", "PUSH"], priority: "CRITICAL", recipientStrategy: "DOCUSIGN_STAKEHOLDERS",
    audience: STAFF, pushCategory: "signatureUpdates", excludeActor: false, deduplicate: true, customerSafe: false,
  },

  // ── Internal staff chat. excludeActor stays false since DIRECT_RECIPIENT
  //    never resolves to the actor by construction (it's always "the other
  //    participant"), not because actor-exclusion is meaningfully skipped.
  //    Grouped push copy ("N messages from M conversations") is computed live
  //    in process-notification-deliveries.ts, not here. ──
  MESSAGE_RECEIVED: {
    channels: ["IN_APP", "PUSH"], priority: "NORMAL", recipientStrategy: "DIRECT_RECIPIENT",
    audience: STAFF, pushCategory: "newMessages", excludeActor: false, deduplicate: false, customerSafe: false,
  },
};

export function getPolicy(type: NotificationType): NotificationPolicy | null {
  return NOTIFICATION_POLICIES[type] ?? null;
}

/** True when the recipient's role is allowed to receive this event's audience. */
export function audienceAllowsRole(
  audience: NotificationPolicy["audience"],
  role: "ADMIN" | "MANAGER" | "AGENT" | "USER",
): boolean {
  if (audience === "ANY") return true;
  if (audience === "STAFF") return role !== "USER";
  return role === "USER"; // CLIENT
}
