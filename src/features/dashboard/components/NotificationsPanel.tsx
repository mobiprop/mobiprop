"use client";

import { Users, BarChart2, AlertTriangle } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type Notification = {
  id: number;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  time: string;
  unread: boolean;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: <Users size={16} className="text-[#4a5565]" />,
    title: "New Agent Registered",
    body: (
      <>
        Agent <strong>Jonathan Cruz</strong> submitted a{" "}
        <span className="text-[#155dfc]">property listing</span> with ID{" "}
        <span className="text-[#155dfc]">#1234</span>. Awaiting approval.
      </>
    ),
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    icon: <BarChart2 size={16} className="text-[#4a5565]" />,
    title: "High-Interest Property Alert",
    body: (
      <>
        <span className="text-[#155dfc] underline">Property listing</span>{" "}
        Sunset Villa Bali has received 120 views and 18 leads in the past 24 hours.
      </>
    ),
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    icon: <AlertTriangle size={16} className="text-[#4a5565]" />,
    title: "Property Listing Expired",
    body: (
      <>
        <span className="text-[#155dfc] underline">Property listing</span>{" "}
        for &apos;Maplewood Townhouse&apos; has expired. Please review or renew.
      </>
    ),
    time: "Yesterday, 4:35 PM",
    unread: false,
  },
];

type NotificationsPanelProps = {
  onClose: () => void;
};

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

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
        <button
          type="button"
          className="text-[14px] text-[#1b487a] hover:text-[#1e4f86] transition-colors"
          style={mont}
        >
          Mark all as read
        </button>
      </div>

      {/* Notification list */}
      <div className="flex flex-col divide-y divide-[#dfe1e7]">
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-6 py-4 ${n.unread ? "bg-[#f8fafc]" : "bg-white"}`}
          >
            {/* Icon box */}
            <div className="size-8 shrink-0 border border-[#e5e7eb] rounded-[8px] flex items-center justify-center">
              {n.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
                  {n.title}
                </span>
                {n.unread && (
                  <span className="size-2 shrink-0 rounded-full bg-[#1e4f86]" />
                )}
              </div>
              <p className="text-[14px] text-[#4a5565] leading-5" style={mont}>
                {n.body}
              </p>
              <p className="text-[12px] text-[#666d80] leading-relaxed" style={poppins}>
                {n.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t border-[#dfe1e7]">
        <button
          type="button"
          onClick={onClose}
          className="text-[14px] text-[#1b487a] hover:text-[#1e4f86] transition-colors"
          style={mont}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
