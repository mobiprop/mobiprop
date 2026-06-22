"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ChevronRight, X } from "lucide-react";

import {
  useDismissNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/queries/use-notifications";
import type { NotificationItem } from "@/features/dashboard/notification-actions";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) return "";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function NotificationsLoading() {
  return (
    <div className="divide-y divide-[#e5e7eb]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5"
        >
          <div className="size-10 shrink-0 rounded-xl bg-[#e9edf2]" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-[#e9edf2]" />
            <div className="h-3 w-full rounded bg-[#edf0f4]" />
            <div className="h-3 w-24 rounded bg-[#edf0f4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const router = useRouter();

  const { data: notifications = [], isLoading } =
    useNotificationsQuery();

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const dismiss = useDismissNotificationMutation();

  const unreadCount = notifications.reduce(
    (count, notification) => count + (notification.readAt ? 0 : 1),
    0,
  );

  const handleOpen = (notification: NotificationItem) => {
    if (!notification.readAt) {
      markRead.mutate(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <main
      className="mx-auto min-h-full w-full max-w-4xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8"
      style={mont}
    >
      {/* Page header */}
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4fb] text-[#1e4f86] sm:size-11">
            <Bell size={20} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-[#0d2138] sm:text-xl">
                Notifications
              </h1>

              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} unread notifications`}
                  className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] px-1.5 text-[11px] font-semibold leading-none text-white"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-[#667085] sm:text-[13px]">
              Stay updated with your latest activity.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#cfd8e3] bg-white px-3.5 text-xs font-semibold text-[#1b487a] shadow-sm transition hover:border-[#1e4f86] hover:bg-[#f5f9fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 sm:w-auto sm:text-[13px]"
          >
            <Check size={16} aria-hidden="true" />
            Mark all as read
          </button>
        )}
      </header>

      {/* Notification card */}
      <section
        aria-label="Notification list"
        className="overflow-hidden rounded-xl border border-[#dfe4ea] bg-white shadow-[0_4px_18px_rgba(15,35,55,0.05)] sm:rounded-2xl"
      >
        {isLoading ? (
          <NotificationsLoading />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#607083]">
              <Bell size={24} aria-hidden="true" />
            </div>

            <h2 className="text-sm font-semibold text-[#0d2138] sm:text-base">
              You&apos;re all caught up
            </h2>

            <p className="mt-1 max-w-sm text-xs leading-5 text-[#667085] sm:text-sm">
              There are no notifications to show right now.
            </p>

            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#1e4f86] px-4 text-xs font-semibold text-white transition hover:bg-[#183f6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 focus-visible:ring-offset-2 sm:text-[13px]"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e7eb]">
            {notifications.map((notification) => {
              const isUnread = !notification.readAt;

              return (
                <li
                  key={notification.id}
                  className={`group relative transition-colors ${
                    isUnread
                      ? "bg-[#f7faff] hover:bg-[#f1f6fc]"
                      : "bg-white hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-start gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
                    <button
                      type="button"
                      onClick={() => handleOpen(notification)}
                      aria-label={`Open notification: ${notification.title}`}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 sm:gap-4"
                    >
                      <span
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border sm:size-11 ${
                          isUnread
                            ? "border-[#cfe0f1] bg-[#edf4fb] text-[#1e4f86]"
                            : "border-[#e5e7eb] bg-[#f8fafc] text-[#667085]"  
                        }`}
                      >
                        <Bell size={17} aria-hidden="true" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span
                            className={`min-w-0 flex-1 break-words text-[13px] leading-5 text-[#0d2138] sm:text-sm ${
                              isUnread ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {notification.title}
                          </span>

                          {isUnread && (
                            <span
                              aria-label="Unread"
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-[#1e4f86]"
                            />
                          )}
                        </span>

                        <span className="mt-1 block break-words text-xs leading-5 text-[#526071] sm:text-[13px]">
                          {notification.body}
                        </span>

                        <span className="mt-1.5 flex items-center gap-1 text-[11px] text-[#7b8492] sm:text-xs">
                          <time dateTime={notification.createdAt}>
                            {relativeTime(notification.createdAt)}
                          </time>

                          {notification.actionUrl && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="font-medium text-[#1b487a]">
                                View details
                              </span>
                              <ChevronRight
                                size={13}
                                aria-hidden="true"
                              />
                            </>
                          )}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Dismiss notification: ${notification.title}`}
                      onClick={() => dismiss.mutate(notification.id)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#87909e] transition hover:bg-[#e9eef4] hover:text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}