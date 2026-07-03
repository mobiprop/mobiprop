"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { onlineStaffStore } from "@/features/messages/online-staff-store";

/**
 * Joins a fixed Supabase Realtime Presence channel shared by every staff
 * member currently on the dashboard, and mirrors the "who's online right
 * now" set into onlineStaffStore. Real presence (socket-connection-driven),
 * not a fake boolean or a "last seen" heartbeat — closing the tab drops the
 * user from every other client's presence state automatically.
 *
 * Security note: `presence:staff` is a fixed channel name joinable by any
 * anon-key holder, since no Realtime Authorization (private channels + RLS
 * on realtime.messages) is configured. Every dashboard page is already
 * gated by requireDashboardAccess() server-side, and presence only ever
 * leaks "which Profile UUIDs are connected" (no names, no message content),
 * so this is low-risk for an internal tool — revisit with Realtime
 * Authorization only if the anon key's blast radius needs tightening for
 * other reasons too.
 *
 * Mounted in the dashboard layout with the server-resolved userId. Render-null.
 */
export function StaffPresenceRealtime({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase.channel("presence:staff", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        onlineStaffStore.setOnlineIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
