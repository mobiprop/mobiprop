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
 */
export function MessagesRealtime({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const invalidate = (payload: RealtimePostgresChangesPayload<MessageRow>) => {
      const row = (payload.new as MessageRow | undefined) ?? (payload.old as MessageRow | undefined);
      queryClient.invalidateQueries({ queryKey: queryKeys.messageThreads() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessageCount() });
      if (row?.conversation_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(row.conversation_id) });
      }
    };

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return null;
}
