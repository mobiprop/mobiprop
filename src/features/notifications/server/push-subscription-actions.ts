import "server-only";

import { randomUUID } from "crypto";

import { deactivateSubscription } from "@/features/notifications/server/deactivate-expired-subscription";
import { sendWebPush } from "@/features/notifications/server/send-web-push";
import { checkCooldown } from "@/features/notifications/server/rate-limit";
import type { PushSubscriptionInput } from "@/features/notifications/schemas/push-subscription-schema";
import type { WebPushPayload } from "@/features/notifications/types/notification-types";
import { isGoneStatus } from "@/features/notifications/utils/delivery-status";
import { resolvePreferences } from "@/features/profile/preferences";
import { isPushServerConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import type { Profile } from "@/generated/prisma/client";

export type PushActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status: number };

export type PushStatusResponse = {
  serverConfigured: boolean;
  hasActiveSubscription: boolean;
  activeSubscriptionCount: number;
};

const TEST_PUSH_COOLDOWN_MS = 30_000;

/** Coarse browser/platform hints from a User-Agent string (no PII stored). */
function parseUserAgent(ua: string | null): { browser?: string; platform?: string } {
  if (!ua) return {};
  let browser: string | undefined;
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let platform: string | undefined;
  if (/iphone|ipad|ipod/i.test(ua)) platform = "iOS";
  else if (/android/i.test(ua)) platform = "Android";
  else if (/mac os x/i.test(ua)) platform = "macOS";
  else if (/windows/i.test(ua)) platform = "Windows";
  else if (/linux/i.test(ua)) platform = "Linux";

  return { browser, platform };
}

/** Flip the staff push master switch on without disturbing other preferences. */
async function ensurePushPreferenceEnabled(profile: Profile): Promise<void> {
  const current = resolvePreferences(profile);
  if (current.dashboardNotifications.pushEnabled) return;

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      preferences: {
        ...current,
        dashboardNotifications: { ...current.dashboardNotifications, pushEnabled: true },
      },
    },
  });
}

/** GET /api/push/status — safe summary only (never exposes endpoint/keys). */
export async function getPushStatus(): Promise<PushActionResult<{ data: PushStatusResponse }>> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error, status: 401 };

  const activeSubscriptionCount = await prisma.pushSubscription.count({
    where: { userId: auth.profile.id, isActive: true },
  });

  return {
    ok: true,
    data: {
      serverConfigured: isPushServerConfigured(),
      hasActiveSubscription: activeSubscriptionCount > 0,
      activeSubscriptionCount,
    },
  };
}

/** POST /api/push/subscriptions — upsert the current browser's subscription. */
export async function upsertPushSubscription(
  input: PushSubscriptionInput,
  userAgent: string | null,
): Promise<PushActionResult<{ subscriptionId: string }>> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error, status: 401 };

  const { browser, platform } = parseUserAgent(userAgent);
  const now = new Date();

  // Upsert by endpoint. If the endpoint previously belonged to another user
  // (same browser, different login), reassign it to the authenticated user —
  // they control the browser. userId is always derived from the session.
  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: auth.profile.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent ?? undefined,
      browser,
      platform,
      deviceLabel: input.deviceLabel,
      isActive: true,
      lastUsedAt: now,
    },
    update: {
      userId: auth.profile.id,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent ?? undefined,
      browser,
      platform,
      deviceLabel: input.deviceLabel,
      isActive: true,
      failureCount: 0,
      lastUsedAt: now,
    },
    select: { id: true },
  });

  await ensurePushPreferenceEnabled(auth.profile);

  return { ok: true, subscriptionId: subscription.id };
}

/** DELETE /api/push/subscriptions — deactivate the current browser's device. */
export async function deletePushSubscription(
  endpoint: string,
): Promise<PushActionResult<{ deactivated: boolean }>> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error, status: 401 };

  // Only affect a subscription that belongs to the current user.
  const result = await prisma.pushSubscription.updateMany({
    where: { endpoint, userId: auth.profile.id },
    data: { isActive: false },
  });

  return { ok: true, deactivated: result.count > 0 };
}

/** POST /api/push/test — self-only test push, rate-limited per user. */
export async function sendTestPush(): Promise<
  PushActionResult<{ sent: number; failed: number; skipped: number; lastError?: string }>
> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error, status: 401 };

  if (!isPushServerConfigured()) {
    return { ok: false, error: "Push delivery is not configured on the server (VAPID keys missing). Restart the server after adding them to .env.", status: 503 };
  }

  const cooldown = checkCooldown(`test-push:${auth.profile.id}`, TEST_PUSH_COOLDOWN_MS);
  if (!cooldown.ok) {
    return {
      ok: false,
      error: `Please wait ${cooldown.retryAfterSeconds}s before sending another test.`,
      status: 429,
    };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: auth.profile.id, isActive: true },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (subscriptions.length === 0) {
    return { ok: false, error: "No active push subscription on this account.", status: 409 };
  }

  // A test is a pure browser-push connectivity check: it sends directly to the
  // caller's active devices and intentionally does NOT create an in-app
  // Notification row, so it never appears in the bell / notifications list. The
  // synthetic notificationId is only used as the SW notification tag/data.
  const payload: WebPushPayload = {
    title: "Test notification",
    body: "Push notifications are working on this device.",
    icon: "/icons/icon-192.png",
    badge: "/icons/notification-badge.png",
    url: "/dashboard/settings",
    tag: "push-test",
    notificationId: `test-${randomUUID()}`,
  };

  const now = new Date();
  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
      );
      if (result.ok) {
        sent += 1;
        await prisma.pushSubscription
          .update({
            where: { id: sub.id },
            data: { lastUsedAt: now, lastSuccessAt: now, failureCount: 0 },
          })
          .catch(() => {});
        return;
      }
      failed += 1;
      lastError = result.errorMessage;
      // Clean up endpoints the provider says are gone (404/410).
      if (isGoneStatus(result.statusCode)) {
        await deactivateSubscription(sub.id, `provider_status_${result.statusCode}`);
      }
    }),
  );

  return { ok: true, sent, failed, skipped: 0, lastError };
}
