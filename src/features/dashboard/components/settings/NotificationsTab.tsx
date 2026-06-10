"use client";

import { useState } from "react";

import { Toggle } from "./Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "email", title: "Email Notifications", description: "Receive email updates about your activity", enabled: true },
  { id: "messages", title: "New Messages", description: "Get notified when you receive a new message", enabled: true },
  { id: "leads", title: "New Leads", description: "Alert when a new lead is added", enabled: true },
  { id: "contracts", title: "Contract Updates", description: "Notifications about contract changes", enabled: true },
  { id: "reports", title: "Weekly Reports", description: "Receive weekly performance reports", enabled: false },
  { id: "marketing", title: "Marketing Updates", description: "Updates about new features and products", enabled: false },
];

export function NotificationsTab() {
  // UI-only for now; wire to a notification-preferences endpoint when one exists.
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  function toggle(id: string, enabled: boolean) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, enabled } : n)));
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-medium text-[#0d2138]" style={mont}>Notification Preferences</p>
      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div key={n.id} className="border border-[#d1d5dc] rounded-[10px] h-[73px] flex items-center justify-between px-4">
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{n.title}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>{n.description}</p>
            </div>
            <Toggle checked={n.enabled} onChange={(v) => toggle(n.id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
