import "server-only";

import { createNotification } from "@/features/notifications/server/create-notification";
import { getPolicy } from "@/features/notifications/server/notification-events";
import {
  resolveByStrategy,
  type RecipientContext,
} from "@/features/notifications/server/resolve-recipients";
import type { NotificationType } from "@/features/notifications/types/notification-types";

/**
 * High-level, business-facing notification triggers. Modules call these AFTER
 * their transaction commits; everything here is best-effort and never throws
 * (a push/notification failure must not fail the business operation).
 *
 * Channel, priority, recipient strategy, actor-exclusion and dedupe all come
 * from the policy registry (notification-events.ts) via `dispatchNotification`.
 * Feature actions must NOT make channel/recipient decisions themselves — they
 * only describe the event and supply display content.
 */

type NotificationContent = { title: string; body: string };

async function safe(run: () => Promise<void>, label: string): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`[notifications] ${label} failed`, error);
  }
}

/**
 * Single entry point for every staff/business notification. Resolves recipients
 * from the event's policy, applies actor exclusion, derives a per-recipient
 * dedupe key when the policy requires idempotency, and fans out best-effort.
 *
 * `content` may be static or a function of the recipient (e.g. the new vs.
 * previous agent on a reassignment).
 */
export async function dispatchNotification(input: {
  type: NotificationType;
  actorId: string | null;
  recipientContext?: RecipientContext;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  content:
    | NotificationContent
    | ((ctx: { recipientId: string; isAssignedAgent: boolean }) => NotificationContent);
  metadata?: Record<string, unknown>;
  /**
   * Occurrence discriminator folded into the dedupe key. Use a value that is
   * STABLE for one logical event but DIFFERENT across genuine repeats — e.g. the
   * assigned agent id (assignment events) or the record's updatedAt epoch
   * (recurring status changes). Without it, a second legitimate reschedule /
   * reassignment to a constant recipient would be wrongly suppressed.
   */
  dedupeDiscriminator?: string;
}): Promise<void> {
  const policy = getPolicy(input.type);
  // Unknown or activity-log-only events create no notification.
  if (!policy || policy.channels.length === 0) return;

  const ctx = input.recipientContext ?? {};
  let recipients = await resolveByStrategy(policy.recipientStrategy, ctx);
  if (policy.excludeActor && input.actorId) {
    recipients = recipients.filter((id) => id !== input.actorId);
  }
  const unique = [...new Set(recipients.filter(Boolean))];

  await Promise.all(
    unique.map(async (recipientId) => {
      const content =
        typeof input.content === "function"
          ? input.content({
              recipientId,
              isAssignedAgent: recipientId === ctx.assignedAgentId,
            })
          : input.content;

      // Per-recipient idempotency key (only when the policy requires it and we
      // have a stable entity to key on). Repeated submissions / retries / fan-out
      // races resolve to a no-op via the unique dedupeKey.
      const dedupeKey =
        policy.deduplicate && input.entityId
          ? [input.type, input.entityId, input.dedupeDiscriminator ?? "", recipientId].join(":")
          : undefined;

      try {
        await createNotification({
          type: input.type,
          recipientId,
          title: content.title,
          body: content.body,
          entityType: input.entityType,
          entityId: input.entityId,
          actionUrl: input.actionUrl,
          actorId: input.actorId ?? undefined,
          metadata: input.metadata,
          dedupeKey,
        });
      } catch (error) {
        console.error("[notifications] createNotification failed", input.type, error);
      }
    }),
  );
}

// ── Invitations (replaces the legacy notifyAdmins path) ───────────────────────

export function notifyInvitationCreated(input: {
  invitationId: string;
  invitedEmail: string;
  role: string;
  actorId: string | null;
  actorName: string;
}): Promise<void> {
  const roleLabel = input.role.charAt(0) + input.role.slice(1).toLowerCase();
  return safe(
    () =>
      dispatchNotification({
        type: "INVITATION_CREATED",
        actorId: input.actorId,
        entityType: "AGENT_INVITATION",
        entityId: input.invitationId,
        content: {
          title: input.role === "MANAGER" ? "Manager invited" : "New agent invited",
          body: `${input.actorName} invited ${input.invitedEmail} to join as ${roleLabel}.`,
        },
      }),
    "notifyInvitationCreated",
  );
}

export function notifyInvitationAccepted(input: {
  invitationId: string;
  joinedName: string;
  roleLabel: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "INVITATION_ACCEPTED",
        actorId: null,
        entityType: "AGENT_INVITATION",
        entityId: input.invitationId,
        content: {
          title: "Invitation accepted",
          body: `${input.joinedName} accepted their invitation and joined as ${input.roleLabel}.`,
        },
      }),
    "notifyInvitationAccepted",
  );
}

export function notifyInvitationRevoked(input: {
  invitationId: string;
  invitedEmail: string;
  actorId: string | null;
  actorName: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "INVITATION_REVOKED",
        actorId: input.actorId,
        entityType: "AGENT_INVITATION",
        entityId: input.invitationId,
        content: {
          title: "Invitation revoked",
          body: `The invitation for ${input.invitedEmail} was revoked by ${input.actorName}.`,
        },
      }),
    "notifyInvitationRevoked",
  );
}

// ── Listings ──────────────────────────────────────────────────────────────────

export function notifyListingCreated(input: {
  propertyId: string;
  title: string;
  listingId: string;
  actorId: string | null;
  actorName: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "LISTING_CREATED",
        actorId: input.actorId,
        entityType: "PROPERTY",
        entityId: input.propertyId,
        actionUrl: "/dashboard/listings",
        content: {
          title: "New listing created",
          body: `${input.actorName} created "${input.title}" (${input.listingId}).`,
        },
      }),
    "notifyListingCreated",
  );
}

export function notifyListingStatusChanged(input: {
  propertyId: string;
  title: string;
  listingId: string;
  status: string;
  actorId: string | null;
  actorName: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "LISTING_STATUS_CHANGED",
        actorId: input.actorId,
        entityType: "PROPERTY",
        entityId: input.propertyId,
        actionUrl: "/dashboard/listings",
        content: {
          title: "Listing status changed",
          body: `${input.actorName} changed "${input.title}" (${input.listingId}) to ${input.status}.`,
        },
      }),
    "notifyListingStatusChanged",
  );
}

export function notifyListingDeleted(input: {
  propertyId: string;
  title: string;
  listingId: string;
  actorId: string | null;
  actorName: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "LISTING_DELETED",
        actorId: input.actorId,
        entityType: "PROPERTY",
        entityId: input.propertyId,
        actionUrl: "/dashboard/listings",
        content: {
          title: "Listing deleted",
          body: `${input.actorName} deleted "${input.title}" (${input.listingId}).`,
        },
      }),
    "notifyListingDeleted",
  );
}

export function notifyListingAssigned(input: {
  propertyId: string;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "LISTING_ASSIGNED",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        dedupeDiscriminator: input.assignedAgentId ?? "unassigned",
        entityType: "PROPERTY",
        entityId: input.propertyId,
        // No per-listing detail route exists yet; deep-link to the listings list.
        actionUrl: "/dashboard/listings",
        content: ({ isAssignedAgent }) =>
          isAssignedAgent
            ? { title: "Listing assigned to you", body: "A listing has been assigned to you." }
            : { title: "Listing reassigned", body: "A listing was assigned to an agent." },
      }),
    "notifyListingAssigned",
  );
}

// ── Leads ───────────────────────────────────────────────────────────────────

export function notifyLeadAssigned(input: {
  leadId: string;
  assignedAgentId: string | null;
  previousAgentId: string | null;
  isReassign: boolean;
  actorId: string | null;
}): Promise<void> {
  const actionUrl = `/dashboard/leads/${input.leadId}`;

  return safe(
    () =>
      dispatchNotification({
        type: input.isReassign ? "LEAD_REASSIGNED" : "LEAD_ASSIGNED",
        actorId: input.actorId,
        recipientContext: {
          assignedAgentId: input.assignedAgentId,
          previousAgentId: input.previousAgentId,
        },
        // Keyed by the (new) assigned agent so reassignment to a different agent
        // is a distinct event, while a retry of the same assignment is a no-op.
        dedupeDiscriminator: input.assignedAgentId ?? "unassigned",
        entityType: "LEAD",
        entityId: input.leadId,
        actionUrl,
        content: ({ isAssignedAgent }) =>
          isAssignedAgent
            ? { title: "Lead assigned to you", body: "A new lead has been assigned to you." }
            : { title: "Lead reassigned", body: "A lead you managed was reassigned to another agent." },
      }),
    "notifyLeadAssigned",
  );
}

// ── Tours ─────────────────────────────────────────────────────────────────────

export function notifyTourRequested(input: {
  tourId: string;
  leadId: string | null;
  assignedAgentId: string | null;
  actorId: string | null;
  /** Public listing-page request vs. a staff member scheduling directly from
   * the dashboard — same REQUESTED-status event, different wording. */
  source?: "PUBLIC_REQUEST" | "DASHBOARD_CREATED";
}): Promise<void> {
  const content =
    input.source === "DASHBOARD_CREATED"
      ? { title: "Tour scheduled", body: "A property tour was scheduled on your calendar." }
      : { title: "New tour request", body: "A customer requested a property visit." };

  return safe(
    () =>
      dispatchNotification({
        type: "TOUR_REQUESTED",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        entityType: "TOUR",
        entityId: input.tourId,
        actionUrl: input.leadId ? `/dashboard/leads/${input.leadId}` : `/dashboard/leads`,
        // customer-safe: no submitter name / contact details in the body.
        content,
      }),
    "notifyTourRequested",
  );
}

export function notifyTourAssigned(input: {
  tourId: string;
  leadId: string | null;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "TOUR_ASSIGNED",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        dedupeDiscriminator: input.assignedAgentId ?? "unassigned",
        entityType: "TOUR",
        entityId: input.tourId,
        actionUrl: input.leadId ? `/dashboard/leads/${input.leadId}` : `/dashboard/leads`,
        content: ({ isAssignedAgent }) =>
          isAssignedAgent
            ? { title: "Tour assigned to you", body: "A property tour has been assigned to you." }
            : { title: "Tour reassigned", body: "A property tour was assigned to another agent." },
      }),
    "notifyTourAssigned",
  );
}

const TOUR_STATUS_CONTENT: Partial<Record<NotificationType, NotificationContent>> = {
  TOUR_CONFIRMED: { title: "Tour confirmed", body: "A property tour has been confirmed." },
  TOUR_RESCHEDULED: { title: "Tour rescheduled", body: "A property tour has been rescheduled." },
  TOUR_CANCELLED: { title: "Tour cancelled", body: "A property tour has been cancelled." },
  TOUR_COMPLETED: { title: "Tour completed", body: "A property tour was marked completed." },
  TOUR_NO_SHOW: { title: "Tour no-show", body: "A property tour was marked as a no-show." },
};

export function notifyTourStatusChanged(input: {
  tourId: string;
  leadId: string | null;
  assignedAgentId: string | null;
  type: Extract<
    NotificationType,
    "TOUR_CONFIRMED" | "TOUR_RESCHEDULED" | "TOUR_CANCELLED" | "TOUR_COMPLETED" | "TOUR_NO_SHOW"
  >;
  actorId: string | null;
  /** The tour's updatedAt — makes each genuine status change a distinct event
   * for dedupe (a retry shares it; a second reschedule does not). */
  occurredAt: Date;
}): Promise<void> {
  const content = TOUR_STATUS_CONTENT[input.type];
  if (!content) return Promise.resolve();

  return safe(
    () =>
      dispatchNotification({
        type: input.type,
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        dedupeDiscriminator: String(input.occurredAt.getTime()),
        entityType: "TOUR",
        entityId: input.tourId,
        actionUrl: input.leadId ? `/dashboard/leads/${input.leadId}` : `/dashboard/leads`,
        content,
      }),
    "notifyTourStatusChanged",
  );
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export function notifyOpportunityStageChanged(input: {
  opportunityId: string;
  title: string;
  assignedAgentId: string | null;
  actorId: string | null;
  /** updatedAt epoch — each genuine stage change is a distinct dedupe event. */
  occurredAt: Date;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "OPPORTUNITY_STAGE_CHANGED",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        dedupeDiscriminator: String(input.occurredAt.getTime()),
        entityType: "OPPORTUNITY",
        entityId: input.opportunityId,
        actionUrl: "/dashboard/opportunities",
        content: { title: "Opportunity stage updated", body: `"${input.title}" moved to a new stage.` },
      }),
    "notifyOpportunityStageChanged",
  );
}

export function notifyOpportunityClosed(input: {
  opportunityId: string;
  title: string;
  won: boolean;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: input.won ? "OPPORTUNITY_WON" : "OPPORTUNITY_LOST",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        dedupeDiscriminator: input.opportunityId,
        entityType: "OPPORTUNITY",
        entityId: input.opportunityId,
        actionUrl: "/dashboard/opportunities",
        content: input.won
          ? { title: "Opportunity won", body: `"${input.title}" was marked Closed Won.` }
          : { title: "Opportunity lost", body: `"${input.title}" was marked Closed Lost.` },
      }),
    "notifyOpportunityClosed",
  );
}

// ── Contracts ─────────────────────────────────────────────────────────────────

export function notifyContractCreated(input: {
  contractId: string;
  title: string;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "CONTRACT_CREATED",
        actorId: input.actorId,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        entityType: "CONTRACT",
        entityId: input.contractId,
        actionUrl: "/dashboard/contracts",
        content: { title: "New contract created", body: `Contract "${input.title}" was created.` },
      }),
    "notifyContractCreated",
  );
}

/** Fired by the daily contract-expiry cron — 60 days before a rental contract's end date. */
export function notifyContractExpiring(input: {
  contractId: string;
  title: string;
  endDate: Date;
  assignedAgentId: string | null;
}): Promise<void> {
  const daysLeft = Math.max(0, Math.round((input.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return safe(
    () =>
      dispatchNotification({
        type: "CONTRACT_EXPIRING",
        actorId: null,
        recipientContext: { assignedAgentId: input.assignedAgentId },
        // One notification per contract — the cron's own idempotency check
        // (expiryNotifiedAt) is the primary guard; this dedupes any same-day retry.
        dedupeDiscriminator: "expiry",
        entityType: "CONTRACT",
        entityId: input.contractId,
        actionUrl: "/dashboard/contracts",
        content: {
          title: "Rental contract expiring soon",
          body: `"${input.title}" ends in ${daysLeft} days (${input.endDate.toLocaleDateString("en-US")}).`,
        },
      }),
    "notifyContractExpiring",
  );
}

// ── Messages ──────────────────────────────────────────────────────────────────

/**
 * entityId is the CONVERSATION id (not the message id) so markConversationRead
 * can bulk-mark every MESSAGE_RECEIVED notification for that conversation in one
 * updateMany. The stored title/body here are per-message (used by the in-app
 * Notifications panel); the push payload actually sent is recomputed live from
 * current unread state in process-notification-deliveries.ts, not from this
 * content.
 */
export function notifyMessageReceived(input: {
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  bodySnippet: string;
}): Promise<void> {
  return safe(
    () =>
      dispatchNotification({
        type: "MESSAGE_RECEIVED",
        actorId: input.senderId,
        recipientContext: { recipientId: input.recipientId },
        entityType: "CONVERSATION",
        entityId: input.conversationId,
        actionUrl: "/dashboard/messages",
        content: { title: `Message from ${input.senderName}`, body: input.bodySnippet },
        metadata: { conversationId: input.conversationId, senderId: input.senderId, senderName: input.senderName },
      }),
    "notifyMessageReceived",
  );
}
