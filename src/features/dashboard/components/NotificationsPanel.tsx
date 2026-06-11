"use client";

import { useEffect, useState } from "react";
import { Users, Bell, AlertTriangle, UserCheck } from "lucide-react";

import {
  getMyNotifications,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/features/dashboard/notification-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function typeIcon(type: string) {
  switch (type) {
    case "INVITATION_CREATED":
      return <Users size={16} className="text-[#4a5565]" />;
    case "INVITATION_ACCEPTED":
      return <UserCheck size={16} className="text-[#4a5565]" />;
    case "INVITATION_REVOKED":
      return <AlertTriangle size={16} className="text-[#4a5565]" />;
    default:
      return <Bell size={16} className="text-[#4a5565]" />;
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type NotificationsPanelProps = {
  onClose: () => void;
};

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyNotifications()
      .then((result) => {
        if (!cancelled && result.ok) setNotifications(result.notifications);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    // Optimistic: flip locally, then persist.
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    await markAllNotificationsRead();
  };

  return (
    <div
      className="absolute right-0 top-[calc(100%+8px)] w-[400px] bg-white border border-[#dfe1e7] rounded-[12px] shadow-[0px_16px_32px_-1px_rgba(128,136,151,0.2)] z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#dfe1e7]">
        <div className="flex items-center gap-2.5">
          <span className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 bg-[#1e4f86] text-white text-[12px] font-medium rounded-full"
              style={mont}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[14px] text-[#1b487a] hover:text-[#1e4f86] transition-colors"
            style={mont}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex flex-col divide-y divide-[#dfe1e7] max-h-[420px] overflow-y-auto">
        {loading ? (
          <p className="px-6 py-8 text-center text-[14px] text-[#666d80]" style={mont}>
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-6 py-8 text-center text-[14px] text-[#666d80]" style={mont}>
            You&apos;re all caught up — no notifications yet.
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-6 py-4 ${!n.readAt ? "bg-[#f8fafc]" : "bg-white"}`}
            >
              {/* Icon box */}
              <div className="size-8 shrink-0 border border-[#e5e7eb] rounded-[8px] flex items-center justify-center">
                {typeIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
                    {n.title}
                  </span>
                  {!n.readAt && (
                    <span className="size-2 shrink-0 rounded-full bg-[#1e4f86]" />
                  )}
                </div>
                <p className="text-[14px] text-[#4a5565] leading-5" style={mont}>
                  {n.body}
                </p>
                <p className="text-[12px] text-[#666d80] leading-relaxed" style={poppins}>
                  {relativeTime(n.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t border-[#dfe1e7]">
        <button
          type="button"
          onClick={onClose}
          className="text-[14px] text-[#1b487a] hover:text-[#1e4f86] transition-colors"
          style={mont}
        >
          Close
        </button>
      </div>
    </div>
  );
}
