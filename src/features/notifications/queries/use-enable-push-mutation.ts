"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pushKeys } from "@/features/notifications/queries/notification-query-keys";
import { ensureServiceWorker } from "@/features/notifications/utils/register-service-worker";
import { isPushSupported } from "@/features/notifications/utils/push-capability";
import { urlBase64ToUint8Array } from "@/features/notifications/utils/url-base64-to-uint8-array";

/** Distinguishable failure reasons so the UI can show the right guidance. */
export class PushEnableError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unsupported"
      | "not-configured"
      | "permission-denied"
      | "subscribe-failed"
      | "server-rejected",
  ) {
    super(message);
    this.name = "PushEnableError";
  }
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let platform = "device";
  if (/iphone|ipad|ipod/i.test(ua)) platform = "iOS";
  else if (/android/i.test(ua)) platform = "Android";
  else if (/mac os x/i.test(ua)) platform = "Mac";
  else if (/windows/i.test(ua)) platform = "Windows";
  else if (/linux/i.test(ua)) platform = "Linux";

  return `${browser} on ${platform}`;
}

async function enablePush(): Promise<void> {
  if (!isPushSupported()) {
    throw new PushEnableError("Push notifications are not supported in this browser.", "unsupported");
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new PushEnableError("Push notifications are not configured on the server.", "not-configured");
  }

  const registration = await ensureServiceWorker();
  if (!registration) {
    throw new PushEnableError("Could not register the service worker.", "unsupported");
  }

  // Permission must be requested in direct response to the user click.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new PushEnableError(
      "Notification permission was not granted. Enable it in your browser settings.",
      "permission-denied",
    );
  }

  // Reuse an existing browser subscription only if it was created with the same
  // VAPID key. If the key has changed (or the subscription has no key), the old
  // endpoint is bound to a different key pair and the server would get a 401 from
  // FCM when trying to send — so we unsubscribe and create a fresh one.
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const expectedKey = urlBase64ToUint8Array(vapidPublicKey);
    const existingKey = subscription.options?.applicationServerKey;
    const keyMatches =
      existingKey instanceof ArrayBuffer &&
      existingKey.byteLength === expectedKey.byteLength &&
      new Uint8Array(existingKey).every((b, i) => b === expectedKey[i]);

    if (!keyMatches) {
      await subscription.unsubscribe().catch(() => {});
      subscription = null;
    }
  }

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    } catch (error) {
      throw new PushEnableError(
        error instanceof Error ? error.message : "Failed to subscribe to push.",
        "subscribe-failed",
      );
    }
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: json.keys,
      deviceLabel: deviceLabel(),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new PushEnableError(body?.error ?? "The server rejected the subscription.", "server-rejected");
  }
}

export function useEnablePushMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enablePush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}
