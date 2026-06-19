"use client";

import { useQuery } from "@tanstack/react-query";

import { pushKeys } from "@/features/notifications/queries/notification-query-keys";
import { isPushSupported } from "@/features/notifications/utils/push-capability";

export type PushStatusData = {
  supported: boolean;
  serverConfigured: boolean;
  hasActiveSubscription: boolean;
  activeSubscriptionCount: number;
};

async function fetchPushStatus(): Promise<Omit<PushStatusData, "supported">> {
  const res = await fetch("/api/push/status", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load push status");
  const json = await res.json();
  return {
    serverConfigured: Boolean(json.serverConfigured),
    hasActiveSubscription: Boolean(json.hasActiveSubscription),
    activeSubscriptionCount: Number(json.activeSubscriptionCount ?? 0),
  };
}

/**
 * Server-known push status (subscription count, VAPID configured) merged with
 * client-only browser support detection. `supported` can only be known on the
 * client, so it is composed here rather than fetched.
 */
export function usePushStatusQuery() {
  return useQuery({
    queryKey: pushKeys.status(),
    queryFn: fetchPushStatus,
    select: (data): PushStatusData => ({ ...data, supported: isPushSupported() }),
    staleTime: 30_000,
  });
}
