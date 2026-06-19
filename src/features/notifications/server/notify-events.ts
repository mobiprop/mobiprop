import "server-only";

import { createNotification } from "@/features/notifications/server/create-notification";
import { notifyRecipients } from "@/features/notifications/server/create-notification";
import {
  resolveLeadAssignedRecipients,
  resolveLeadReassignedRecipients,
  resolveListingAssignedRecipients,
  resolveTourRequestedRecipients,
  resolveTourStatusRecipients,
} from "@/features/notifications/server/resolve-recipients";
import type { NotificationType } from "@/features/notifications/types/notification-types";

/**
 * High-level, business-facing notification triggers. Modules call these AFTER
 * their transaction commits; everything here is best-effort and never throws
 * (a push/notification failure must not fail the business operation).
 *
 * Recipient policy lives in resolve-recipients.ts; content/wording lives here.
 * The acting user is always excluded — no one needs to be pinged about their
 * own action.
 */

function withoutActor(ids: string[], actorId: string | null | undefined): string[] {
  return ids.filter((id) => id !== actorId);
}

async function safe(run: () => Promise<void>, label: string): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`[notifications] ${label} failed`, error);
  }
}

export function notifyLeadAssigned(input: {
  leadId: string;
  assignedAgentId: string | null;
  previousAgentId: string | null;
  isReassign: boolean;
  actorId: string | null;
}): Promise<void> {
  const actionUrl = `/dashboard/leads/${input.leadId}`;

  return safe(async () => {
    if (input.isReassign) {
      const recipients = withoutActor(
        await resolveLeadReassignedRecipients({
          assignedAgentId: input.assignedAgentId,
          previousAgentId: input.previousAgentId,
        }),
        input.actorId,
      );

      await Promise.all(
        recipients.map((recipientId) => {
          const isNewAgent = recipientId === input.assignedAgentId;
          return createNotification({
            type: "LEAD_REASSIGNED",
            recipientId,
            title: isNewAgent ? "Lead assigned to you" : "Lead reassigned",
            body: isNewAgent
              ? "A lead has been assigned to you."
              : "A lead you managed was reassigned to another agent.",
            entityType: "LEAD",
            entityId: input.leadId,
            actionUrl,
            actorId: input.actorId ?? undefined,
          });
        }),
      );
      return;
    }

    const recipients = withoutActor(
      await resolveLeadAssignedRecipients({ assignedAgentId: input.assignedAgentId }),
      input.actorId,
    );
    await notifyRecipients(recipients, {
      type: "LEAD_ASSIGNED",
      title: "Lead assigned to you",
      body: "A new lead has been assigned to you.",
      entityType: "LEAD",
      entityId: input.leadId,
      actionUrl,
      actorId: input.actorId ?? undefined,
    });
  }, "notifyLeadAssigned");
}

export function notifyTourRequested(input: {
  tourId: string;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(async () => {
    const recipients = withoutActor(
      await resolveTourRequestedRecipients({ assignedAgentId: input.assignedAgentId }),
      input.actorId,
    );
    await notifyRecipients(recipients, {
      type: "TOUR_REQUESTED",
      title: "New tour requested",
      body: "A new property tour has been requested.",
      entityType: "TOUR",
      entityId: input.tourId,
      actionUrl: `/dashboard/tours/${input.tourId}`,
      actorId: input.actorId ?? undefined,
    });
  }, "notifyTourRequested");
}

const TOUR_STATUS_CONTENT: Partial<Record<NotificationType, { title: string; body: string }>> = {
  TOUR_CONFIRMED: { title: "Tour confirmed", body: "A property tour has been confirmed." },
  TOUR_RESCHEDULED: { title: "Tour rescheduled", body: "A property tour has been rescheduled." },
  TOUR_CANCELLED: { title: "Tour cancelled", body: "A property tour has been cancelled." },
};

export function notifyTourStatusChanged(input: {
  tourId: string;
  assignedAgentId: string | null;
  type: Extract<NotificationType, "TOUR_CONFIRMED" | "TOUR_RESCHEDULED" | "TOUR_CANCELLED">;
  actorId: string | null;
}): Promise<void> {
  const content = TOUR_STATUS_CONTENT[input.type];
  if (!content) return Promise.resolve();

  return safe(async () => {
    const recipients = withoutActor(
      await resolveTourStatusRecipients({ assignedAgentId: input.assignedAgentId }),
      input.actorId,
    );
    await notifyRecipients(recipients, {
      type: input.type,
      title: content.title,
      body: content.body,
      entityType: "TOUR",
      entityId: input.tourId,
      actionUrl: `/dashboard/tours/${input.tourId}`,
      actorId: input.actorId ?? undefined,
    });
  }, "notifyTourStatusChanged");
}

export function notifyListingAssigned(input: {
  propertyId: string;
  assignedAgentId: string | null;
  actorId: string | null;
}): Promise<void> {
  return safe(async () => {
    const recipients = withoutActor(
      await resolveListingAssignedRecipients({ assignedAgentId: input.assignedAgentId }),
      input.actorId,
    );
    await notifyRecipients(recipients, {
      type: "LISTING_ASSIGNED",
      title: "Listing assigned to you",
      body: "A listing has been assigned to you.",
      entityType: "PROPERTY",
      entityId: input.propertyId,
      // No per-listing detail route exists yet; deep-link to the listings list.
      actionUrl: "/dashboard/listings",
      actorId: input.actorId ?? undefined,
    });
  }, "notifyListingAssigned");
}
