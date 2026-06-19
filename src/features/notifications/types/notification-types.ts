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
  | "TOUR_CONFIRMED"
  | "TOUR_RESCHEDULED"
  | "TOUR_CANCELLED"
  | "OPPORTUNITY_STAGE_CHANGED"
  | "OPPORTUNITY_WON"
  | "OPPORTUNITY_LOST"
  | "CONTRACT_CREATED"
  | "CONTRACT_EXPIRING"
  | "CONTRACT_EXPIRED";

/** Audience separation — staff-only operational events vs client-facing ones. */
export type NotificationAudience = "STAFF" | "CLIENT";

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
