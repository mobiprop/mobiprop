/**
 * Canonical notification event catalog. `type` is stored as a plain String on
 * the Notification row (so new modules can add events without a migration), but
 * this union keeps creation/routing type-safe across the app.
 */
export type NotificationType =
  | "INVITATION_CREATED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REVOKED"
  | "INVITATION_RESENT"
  | "LISTING_CREATED"
  | "LISTING_ASSIGNED"
  | "LISTING_STATUS_CHANGED"
  | "LISTING_FEATURED_CHANGED"
  | "LISTING_DELETED"
  | "LEAD_CREATED"
  | "LEAD_ASSIGNED"
  | "LEAD_REASSIGNED"
  | "LEAD_BECAME_HOT"
  | "LEAD_CONVERTED"
  | "TOUR_REQUESTED"
  | "TOUR_ASSIGNED"
  | "TOUR_CONFIRMED"
  | "TOUR_RESCHEDULED"
  | "TOUR_CANCELLED"
  | "TOUR_COMPLETED"
  | "TOUR_NO_SHOW"
  | "OPPORTUNITY_STAGE_CHANGED"
  | "OPPORTUNITY_WON"
  | "OPPORTUNITY_LOST"
  | "DOCUSIGN_ENVELOPE_SENT"
  | "DOCUSIGN_ENVELOPE_DELIVERED"
  | "DOCUSIGN_ENVELOPE_COMPLETED"
  | "DOCUSIGN_ENVELOPE_DECLINED"
  | "DOCUSIGN_ENVELOPE_VOIDED"
  | "DOCUSIGN_ENVELOPE_EXPIRING_SOON"
  | "MESSAGE_RECEIVED";

/** Audience separation — staff-only operational events vs client-facing ones. */
export type NotificationAudience = "STAFF" | "CLIENT";

/** Delivery channels an event may use. IN_APP is always implied for any
 * non-empty channel set (the in-app row is the source of truth). EMAIL is
 * declared for forthcoming flows but is not yet delivered by the pipeline. */
export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL";

/**
 * Urgency of an event. Priority is derived from the policy registry only — it
 * is NOT stored on the Notification row. CRITICAL events bypass the per-category
 * push toggle (they still honour the master push switch).
 */
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

/**
 * Named recipient-resolution strategies. The mapping from strategy → concrete
 * Profile ids lives in resolve-recipients.ts; policies only reference the name,
 * so role rules can change in one place (project guide §18).
 */
export type RecipientStrategy =
  | "NONE"
  | "ALL_ADMINS"
  | "MANAGERS_AND_ADMINS"
  | "ALL_STAFF"
  | "ASSIGNED_AGENT_PLUS_ADMINS"
  | "NEW_AND_PREV_AGENT_PLUS_ADMINS"
  | "LISTING_AGENT_WITH_MANAGEMENT_FALLBACK"
  | "TOUR_AGENT_WITH_MANAGEMENT_FALLBACK"
  | "DOCUSIGN_STAKEHOLDERS"
  | "DIRECT_RECIPIENT";

/** Safe status shape returned by GET /api/push/status (never exposes keys). */
export type PushStatus = {
  supported: boolean;
  serverConfigured: boolean;
  hasActiveSubscription: boolean;
  activeSubscriptionCount: number;
};

/** Payload delivered to the service worker (and shown on a possibly-locked screen). */
export type WebPushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url: string;
  tag?: string;
  notificationId: string;
};
