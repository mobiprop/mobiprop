"use client";

import { useState } from "react";

import { updateDashboardNotificationPreferences } from "@/features/profile/actions";
import {
  resolvePreferences,
  type DashboardNotificationPreferences,
} from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";
import { Toggle } from "./Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const NOTIFICATION_ITEMS: {
  id: keyof DashboardNotificationPreferences;
  title: string;
  description: string;
}[] = [
  { id: "emailEnabled", title: "Email Notifications", description: "Receive email updates about your activity" },
  { id: "newMessages", title: "New Messages", description: "Get notified when you receive a new message" },
  { id: "newLeads", title: "New Leads", description: "Alert when a new lead is added" },
  { id: "contractUpdates", title: "Contract Updates", description: "Notifications about contract changes" },
  { id: "weeklyReports", title: "Weekly Reports", description: "Receive weekly performance reports" },
  { id: "marketingUpdates", title: "Marketing Updates", description: "Updates about new features and products" },
];

type NotificationsTabProps = {
  profile: Profile;
};

export function NotificationsTab({ profile }: NotificationsTabProps) {
  const [prefs, setPrefs] = useState(resolvePreferences(profile).dashboardNotifications);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: keyof DashboardNotificationPreferences, enabled: boolean) {
    const previous = prefs;
    const next = { ...prefs, [id]: enabled };

    // Optimistic update; roll back if the save fails.
    setPrefs(next);
    setError(null);

    try {
      const result = await updateDashboardNotificationPreferences(next);
      if ("error" in result) {
        setPrefs(previous);
        setError(result.error);
      }
    } catch {
      setPrefs(previous);
      setError("Failed to save your notification preferences. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-medium text-[#0d2138]" style={mont}>Notification Preferences</p>

      {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}

      <div className="flex flex-col gap-3">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{item.title}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>{item.description}</p>
            </div>
            <Toggle checked={prefs[item.id]} onChange={(v) => toggle(item.id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
