"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pushKeys } from "@/features/notifications/queries/notification-query-keys";
import { ensureServiceWorker } from "@/features/notifications/utils/register-service-worker";

export type DisablePushResult = { browserUnsubscribed: boolean };

/**
 * Disable push on the current device. Server-first: mark the server record
 * inactive (so delivery stops even if the browser unsubscribe later fails),
 * then best-effort `unsubscribe()` in the browser. A failed browser unsubscribe
 * is reported as a warning, not a hard error — status reconciles on next load.
 */
async function disablePush(): Promise<DisablePushResult> {
  const registration = await ensureServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();

  if (subscription) {
    const res = await fetch("/api/push/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Failed to disable push on the server.");
    }

    let browserUnsubscribed = false;
    try {
      browserUnsubscribed = await subscription.unsubscribe();
    } catch {
      browserUnsubscribed = false;
    }
    return { browserUnsubscribed };
  }

  // No browser subscription found — nothing to unsubscribe locally.
  return { browserUnsubscribed: true };
}

export function useDisablePushMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disablePush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.status() });
    },
  });
}
