"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Subscribes to Supabase Realtime for the signed-in user's notifications and
 * invalidates the in-app caches on any change. Also clears the TanStack cache on
 * sign-out / account switch so one user's notifications never linger for another.
 *
 * Mounted in the authenticated dashboard layout with the server-resolved userId
 * (= Profile.id = auth.users.id), so the subscription is only created after auth
 * is known. Render-null. Realtime delivery requires the
 * 20260620010000_enable_notifications_realtime migration; until it is applied the
 * channel simply receives nothing (the app still works via polling/refetch).
 *
 * Auth ordering matters here: postgres_changes subscriptions are RLS-checked
 * server-side using the JWT attached to the *first* phx_join for the channel.
 * A fresh client's session hasn't necessarily reached the realtime socket yet
 * when this effect runs, so subscribing immediately can join as `anon` (which
 * has no column privileges on `notifications`) and get silently rejected
 * forever — setAuth() must be awaited before .subscribe() so the join carries
 * the token.
 */
export function NotificationRealtime({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationsCount() });
    };

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      // One channel per user; filtered server-side to this recipient only.
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          invalidate,
        )
        .subscribe();
    })();

    // Drop all cached server-state when the user signs out or switches accounts.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user && session.user.id !== userId)) {
        queryClient.clear();
      }
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [userId, queryClient]);

  return null;
}
