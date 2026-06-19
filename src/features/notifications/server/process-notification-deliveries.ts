import "server-only";

import { deactivateSubscription } from "@/features/notifications/server/deactivate-expired-subscription";
import { sendWebPush } from "@/features/notifications/server/send-web-push";
import {
  isAuthStatus,
  isGoneStatus,
  isRetryableStatus,
  MAX_PUSH_ATTEMPTS,
  nextRetryAt,
} from "@/features/notifications/utils/delivery-status";
import { isInternalUrl } from "@/features/notifications/utils/is-internal-url";
import type { WebPushPayload } from "@/features/notifications/types/notification-types";
import { prisma } from "@/lib/prisma";
import type { Notification, PushSubscription } from "@/generated/prisma/client";

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_BADGE = "/icons/notification-badge.png";
const DEFAULT_URL = "/dashboard/notifications";

export type ProcessSummary = { sent: number; failed: number; skipped: number; retry: number };

/** Build a safe, same-origin push payload from a notification record. */
function buildPayload(notification: Notification): WebPushPayload {
  const url =
    notification.actionUrl && isInternalUrl(notification.actionUrl)
      ? notification.actionUrl
      : DEFAULT_URL;

  return {
    title: notification.title,
    body: notification.body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    url,
    tag: notification.id,
    notificationId: notification.id,
  };
}

/**
 * Attempt PUSH delivery for every PENDING delivery of a notification. Updates
 * delivery + subscription state per the provider response and schedules retries
 * for transient failures. Best-effort: a thrown error here must never propagate
 * to the business action that created the notification.
 */
export async function processPushDeliveriesForNotification(
  notificationId: string,
): Promise<ProcessSummary> {
  const summary: ProcessSummary = { sent: 0, failed: 0, skipped: 0, retry: 0 };

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return summary;

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { notificationId, channel: "PUSH", status: "PENDING" },
      include: { subscription: true },
    });

    const payload = buildPayload(notification);

    for (const delivery of deliveries) {
      const result = await processOne(delivery.id, delivery.subscription, payload, delivery.attemptCount);
      summary[result] += 1;
    }
  } catch (error) {
    console.error("[push] delivery processing failed", { notificationId, error });
  }

  return summary;
}

type Outcome = "sent" | "failed" | "skipped" | "retry";

async function processOne(
  deliveryId: string,
  subscription: PushSubscription | null,
  payload: WebPushPayload,
  attemptCount: number,
): Promise<Outcome> {
  const now = new Date();

  if (!subscription || !subscription.isActive) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "SKIPPED",
        lastAttemptAt: now,
        errorCode: "no_active_subscription",
      },
    });
    return "skipped";
  }

  const result = await sendWebPush(
    { endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
    payload,
  );
  const nextAttempt = attemptCount + 1;

  if (result.ok) {
    await prisma.$transaction([
      prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SENT",
          attemptCount: nextAttempt,
          lastAttemptAt: now,
          deliveredAt: now,
          providerStatus: result.statusCode,
          errorCode: null,
          errorMessage: null,
          nextAttemptAt: null,
        },
      }),
      prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { failureCount: 0, lastUsedAt: now, lastSuccessAt: now },
      }),
    ]);
    return "sent";
  }

  const status = result.statusCode;

  // Permanent: endpoint gone — fail and deactivate, never retry.
  if (isGoneStatus(status)) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        attemptCount: nextAttempt,
        lastAttemptAt: now,
        providerStatus: status,
        errorCode: "subscription_gone",
        errorMessage: result.errorMessage,
        nextAttemptAt: null,
      },
    });
    await deactivateSubscription(subscription.id, `provider_status_${status}`);
    return "failed";
  }

  // Auth/config (bad VAPID) — fail without endless retry; surface for ops.
  if (isAuthStatus(status)) {
    console.error("[push] PUSH_DELIVERY_FAILED auth/config", {
      event: "PUSH_DELIVERY_FAILED",
      deliveryId,
      subscriptionId: subscription.id,
      statusCode: status,
      attemptCount: nextAttempt,
    });
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        attemptCount: nextAttempt,
        lastAttemptAt: now,
        providerStatus: status,
        errorCode: "auth_config",
        errorMessage: result.errorMessage,
        nextAttemptAt: null,
      },
    });
    return "failed";
  }

  // Transient — schedule a retry with backoff until attempts are exhausted.
  if (isRetryableStatus(status) && nextAttempt < MAX_PUSH_ATTEMPTS) {
    await prisma.$transaction([
      prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "PENDING",
          attemptCount: nextAttempt,
          lastAttemptAt: now,
          providerStatus: status,
          errorCode: "transient",
          errorMessage: result.errorMessage,
          nextAttemptAt: nextRetryAt(nextAttempt, now),
        },
      }),
      prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { failureCount: { increment: 1 }, lastFailureAt: now },
      }),
    ]);
    return "retry";
  }

  // Everything else (or retries exhausted) — terminal failure.
  await prisma.$transaction([
    prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        attemptCount: nextAttempt,
        lastAttemptAt: now,
        providerStatus: status,
        errorCode: "failed",
        errorMessage: result.errorMessage,
        nextAttemptAt: null,
      },
    }),
    prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { failureCount: { increment: 1 }, lastFailureAt: now },
    }),
  ]);
  return "failed";
}
