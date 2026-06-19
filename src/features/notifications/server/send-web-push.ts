import "server-only";

import webpush from "web-push";

import { getVapidConfig } from "@/lib/env";
import type { WebPushPayload } from "@/features/notifications/types/notification-types";

/**
 * Thin wrapper around `web-push`. VAPID details are configured lazily on first
 * use so a missing key never breaks the build or unrelated requests. Returns a
 * structured result instead of throwing, so the delivery worker can classify
 * provider HTTP status codes (see utils/delivery-status.ts).
 */

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const vapid = getVapidConfig();
  if (!vapid) return false;

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
  return true;
}

export type SubscriptionTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendPushResult =
  | { ok: true; statusCode: number }
  | { ok: false; statusCode?: number; errorMessage: string };

export async function sendWebPush(
  target: SubscriptionTarget,
  payload: WebPushPayload,
): Promise<SendPushResult> {
  if (!ensureConfigured()) {
    return { ok: false, errorMessage: "Push server not configured (missing VAPID keys)" };
  }

  try {
    const result = await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true, statusCode: result.statusCode };
  } catch (error) {
    // web-push throws WebPushError with a numeric statusCode on HTTP failures.
    const statusCode =
      typeof (error as { statusCode?: unknown })?.statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : undefined;
    const errorMessage = error instanceof Error ? error.message : "Unknown push error";
    return { ok: false, statusCode, errorMessage };
  }
}
