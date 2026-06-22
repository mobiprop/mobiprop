import "server-only";

import { audienceAllowsRole, getPolicy } from "@/features/notifications/server/notification-events";
import { decideChannels } from "@/features/notifications/server/notification-policies";
import {
  processPushDeliveriesForNotification,
  type ProcessSummary,
} from "@/features/notifications/server/process-notification-deliveries";
import type { NotificationType } from "@/features/notifications/types/notification-types";
import { isInternalUrl } from "@/features/notifications/utils/is-internal-url";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type CreateNotificationInput = {
  type: NotificationType;
  recipientId: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  /** Idempotency key for scheduled / fan-out events. Duplicate keys are no-ops. */
  dedupeKey?: string;
};

export type CreateNotificationResult =
  | { ok: true; notificationId: string; skipped?: false; pushSummary?: ProcessSummary }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

/**
 * Shared entry point for creating a notification. The in-app row is the source
 * of truth; push is an optional, best-effort channel attempted AFTER the record
 * is committed. Designed to be called best-effort from business modules — it
 * does not throw on push failures.
 *
 * Steps: validate event + URL → confirm recipient is active & in-audience →
 * dedupe → create in-app row + IN_APP delivery → evaluate preferences → create
 * PUSH delivery records → trigger immediate push delivery.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const policy = getPolicy(input.type);
  if (!policy) return { ok: false, error: `Unknown notification type: ${input.type}` };

  // Activity-log-only events (no channels) must never create a notification row.
  if (policy.channels.length === 0) {
    return { ok: true, skipped: true, reason: "activity_only" };
  }

  if (input.actionUrl && !isInternalUrl(input.actionUrl)) {
    return { ok: false, error: "actionUrl must be a same-origin internal path" };
  }

  const recipient = await prisma.profile.findUnique({
    where: { id: input.recipientId },
    select: { id: true, role: true, status: true, preferences: true },
  });
  if (!recipient || recipient.status !== "ACTIVE") {
    return { ok: true, skipped: true, reason: "recipient_inactive_or_missing" };
  }
  if (!audienceAllowsRole(policy.audience, recipient.role)) {
    return { ok: true, skipped: true, reason: "audience_mismatch" };
  }

  // Idempotency: a duplicate dedupeKey is a successful no-op.
  if (input.dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey: input.dedupeKey },
      select: { id: true },
    });
    if (existing) return { ok: true, skipped: true, reason: "duplicate" };
  }

  let notificationId: string;
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        actionUrl: input.actionUrl,
        actorId: input.actorId,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        dedupeKey: input.dedupeKey,
        // Record the in-app channel as immediately delivered (source of truth).
        deliveries: {
          create: { channel: "IN_APP", status: "SENT", deliveredAt: new Date() },
        },
      },
      select: { id: true },
    });
    notificationId = notification.id;
  } catch (error) {
    // Unique violation on dedupeKey from a race → treat as a successful no-op.
    if ((error as { code?: string })?.code === "P2002") {
      return { ok: true, skipped: true, reason: "duplicate" };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create notification" };
  }

  const decision = decideChannels(input.type, recipient);

  if (!decision.push) {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: "PUSH",
        status: "SKIPPED",
        errorCode: decision.pushSkipReason ?? "push_not_allowed",
      },
    });
    return { ok: true, notificationId };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: recipient.id, isActive: true },
    select: { id: true },
  });

  if (subscriptions.length === 0) {
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: "PUSH",
        status: "SKIPPED",
        errorCode: "no_active_subscription",
      },
    });
    return { ok: true, notificationId };
  }

  await prisma.notificationDelivery.createMany({
    data: subscriptions.map((sub) => ({
      notificationId,
      subscriptionId: sub.id,
      channel: "PUSH" as const,
      status: "PENDING" as const,
    })),
  });

  // Fire the immediate delivery attempt. Awaited but isolated — failures are
  // swallowed inside the processor, so callers never see a push error.
  const pushSummary = await processPushDeliveriesForNotification(notificationId);

  return { ok: true, notificationId, pushSummary };
}

/**
 * Fan a single event out to multiple recipients (best-effort per recipient).
 * Pass a `dedupeKeyFor` to make each recipient's notification idempotent.
 */
export async function notifyRecipients(
  recipientIds: string[],
  content: Omit<CreateNotificationInput, "recipientId" | "dedupeKey">,
  options?: { dedupeKeyFor?: (recipientId: string) => string },
): Promise<void> {
  const unique = [...new Set(recipientIds.filter(Boolean))];
  await Promise.all(
    unique.map(async (recipientId) => {
      try {
        await createNotification({
          ...content,
          recipientId,
          dedupeKey: options?.dedupeKeyFor?.(recipientId),
        });
      } catch (error) {
        console.error("[notifications] createNotification failed", content.type, error);
      }
    }),
  );
}
