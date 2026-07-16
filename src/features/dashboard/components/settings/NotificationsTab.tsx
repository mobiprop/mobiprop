"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PushNotificationSettings } from "@/features/notifications/components/push-notification-settings";
import { updateDashboardNotificationPreferences } from "@/features/profile/actions";
import {
  resolvePreferences,
  type DashboardNotificationPreferences,
} from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";
import { Toggle } from "./Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const NOTIFICATION_ITEM_IDS: (keyof DashboardNotificationPreferences)[] = [
  "emailEnabled",
  "pushEnabled",
  "newMessages",
  "newLeads",
  "leadAssignments",
  "tourUpdates",
  "listingUpdates",
  "opportunityUpdates",
  "signatureUpdates",
  "weeklyReports",
  "marketingUpdates",
];

type NotificationsTabProps = {
  profile: Profile;
};

export function NotificationsTab({ profile }: NotificationsTabProps) {
  const { t } = useTranslation("dashboardSettings");
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
      setError(t("notifications.saveError"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>{t("notifications.heading")}</p>

      {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}

      <PushNotificationSettings />

      <div className="flex flex-col gap-3">
        {NOTIFICATION_ITEM_IDS.map((id) => (
          <div key={id} className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t(`notifications.items.${id}.title`)}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t(`notifications.items.${id}.description`)}</p>
            </div>
            <Toggle checked={prefs[id]} onChange={(v) => toggle(id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
