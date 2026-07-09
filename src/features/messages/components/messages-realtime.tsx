"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

type MessageRow = { conversation_id: string };

/**
 * Subscribes to Supabase Realtime for the signed-in user's chat messages and
 * invalidates the conversation list / active thread / unread badge on any
 * change. Two filters are needed (unlike NotificationRealtime's single
 * recipient_id filter) because postgres_changes only supports one equality
 * filter per `.on()` call: recipient_id catches new incoming messages,
 * sender_id catches updates on messages the user sent (read receipts,
 * deletes) so their own open thread stays in sync too.
 *
 * Mounted in the dashboard layout with the server-resolved userId. Render-null.
 * Requires the 20260703010100_enable_messages_realtime migration.
 *
 * Auth ordering matters here: postgres_changes subscriptions are RLS-checked
 * server-side using the JWT attached to the *first* phx_join for the channel.
 * A fresh client's session hasn't necessarily reached the realtime socket yet
 * when this effect runs, so subscribing immediately can join as `anon` (which
 * has no column privileges on `messages`) and get silently rejected forever —
 * setAuth() must be awaited before .subscribe() so the join carries the token.
 */
export function MessagesRealtime({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidate = (payload: RealtimePostgresChangesPayload<MessageRow>) => {
      const row = (payload.new as MessageRow | undefined) ?? (payload.old as MessageRow | undefined);
      queryClient.invalidateQueries({ queryKey: queryKeys.messageThreads() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessageCount() });
      if (row?.conversation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(row.conversation_id) });
      }
    };

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`messages:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
          invalidate,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${userId}` },
          invalidate,
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return null;
}
