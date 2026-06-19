"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";

import {
  useDismissNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/queries/use-notifications";
import type { NotificationItem } from "@/features/dashboard/notification-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };

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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const dismiss = useDismissNotificationMutation();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleOpen = (notification: NotificationItem) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[#1e4f86]" />
          <h1 className="text-[18px] font-semibold text-[#0d2138]" style={mont}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span
              className="inline-flex h-[20px] min-w-[22px] items-center justify-center rounded-full bg-[#1e4f86] px-1.5 text-[12px] font-medium text-white"
              style={mont}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1b487a] transition-colors hover:text-[#1e4f86]"
            style={mont}
          >
            <Check size={15} /> Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#dfe1e7] bg-white">
        {isLoading ? (
          <p className="px-6 py-10 text-center text-[14px] text-[#666d80]" style={mont}>
            Loading notifications…
          </p>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[14px] text-[#666d80]" style={mont}>
              You&apos;re all caught up — no notifications yet.
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block text-[13px] font-medium text-[#1b487a] hover:text-[#1e4f86]"
              style={mont}
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#dfe1e7]">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                role={notification.actionUrl ? "button" : undefined}
                tabIndex={notification.actionUrl ? 0 : undefined}
                onClick={() => handleOpen(notification)}
                onKeyDown={(event) => {
                  if (notification.actionUrl && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    handleOpen(notification);
                  }
                }}
                className={`group flex items-start gap-3 px-5 py-4 ${
                  notification.actionUrl ? "cursor-pointer" : ""
                } ${!notification.readAt ? "bg-[#f8fafc]" : "bg-white"} hover:bg-[#f1f5f9]`}
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[#e5e7eb]">
                  <Bell size={16} className="text-[#4a5565]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
                      {notification.title}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {!notification.readAt && <span className="mt-1.5 size-2 rounded-full bg-[#1e4f86]" />}
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={(event) => {
                          event.stopPropagation();
                          dismiss.mutate(notification.id);
                        }}
                        className="rounded p-0.5 text-[#9aa1ad] opacity-0 transition-opacity hover:text-[#4a5565] group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] leading-5 text-[#4a5565]" style={mont}>
                    {notification.body}
                  </p>
                  <p className="text-[11px] text-[#666d80]" style={mont}>
                    {relativeTime(notification.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
