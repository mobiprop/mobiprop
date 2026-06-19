"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Bell, AlertTriangle, UserCheck, X } from "lucide-react";

import {
  useDismissNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/queries/use-notifications";
import type { NotificationItem } from "@/features/dashboard/notification-actions";

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
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const dismiss = useDismissNotificationMutation();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleOpen = (notification: NotificationItem) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    onClose();
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  const handleDismiss = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    dismiss.mutate(id);
  };

  return (
    <div
      className="
        fixed left-3 right-3 top-[72px] z-50
        max-h-[calc(100dvh-84px)]
        overflow-hidden rounded-[12px]
        border border-[#dfe1e7]
        bg-white
        shadow-[0px_16px_32px_-1px_rgba(128,136,151,0.2)]

        sm:absolute sm:left-auto sm:right-0
        sm:top-[calc(100%+8px)]
        sm:w-[380px]
        sm:max-h-none

        lg:w-[400px]
      "
      onClick={(event) => event.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#dfe1e7] px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
            style={mont}
          >
            Notifications
          </span>

          {unreadCount > 0 && (
            <span
              className="
                inline-flex h-[18px] min-w-[20px]
                shrink-0 items-center justify-center
                rounded-full bg-[#1e4f86]
                px-1.5 text-[10px] font-medium text-white
                sm:h-[20px] sm:min-w-[22px] sm:text-[12px]
              "
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
            className="
              shrink-0 text-[11px] text-[#1b487a]
              transition-colors hover:text-[#1e4f86]
              sm:text-[13px]
              lg:text-[14px]
            "
            style={mont}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div
        className="
          flex max-h-[calc(100dvh-190px)]
          flex-col divide-y divide-[#dfe1e7]
          overflow-y-auto
          sm:max-h-[420px]
        "
      >
        {isLoading ? (
          <p
            className="px-4 py-8 text-center text-[12px] text-[#666d80] sm:px-6 sm:text-[14px]"
            style={mont}
          >
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p
            className="px-4 py-8 text-center text-[12px] leading-5 text-[#666d80] sm:px-6 sm:text-[14px]"
            style={mont}
          >
            You&apos;re all caught up — no notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <div
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
              className={`
                group flex items-start gap-3
                px-4 py-3
                sm:px-5 sm:py-4
                lg:px-6
                ${notification.actionUrl ? "cursor-pointer" : ""}
                ${!notification.readAt ? "bg-[#f8fafc]" : "bg-white"}
                hover:bg-[#f1f5f9]
              `}
            >
              {/* Icon box */}
              <div
                className="
                  flex size-8 shrink-0 items-center justify-center
                  rounded-[8px]
                  border border-[#e5e7eb]
                "
              >
                {typeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span
                    className="
                      min-w-0 truncate
                      text-[12px] font-semibold
                      leading-5 text-[#0d2138]
                      sm:text-[14px]
                    "
                    style={mont}
                  >
                    {notification.title}
                  </span>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {!notification.readAt && (
                      <span className="mt-1.5 size-2 rounded-full bg-[#1e4f86]" />
                    )}
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={(event) => handleDismiss(event, notification.id)}
                      className="rounded p-0.5 text-[#9aa1ad] opacity-0 transition-opacity hover:text-[#4a5565] group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <p
                  className="
                    break-words text-[12px]
                    leading-[18px] text-[#4a5565]
                    sm:text-[14px] sm:leading-5
                  "
                  style={mont}
                >
                  {notification.body}
                </p>

                <p
                  className="
                    text-[10px] leading-relaxed
                    text-[#666d80]
                    sm:text-[12px]
                  "
                  style={poppins}
                >
                  {relativeTime(notification.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#dfe1e7] px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="text-[12px] font-medium text-[#1b487a] transition-colors hover:text-[#1e4f86] sm:text-[14px]"
          style={mont}
        >
          View all notifications
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-[#666d80] transition-colors hover:text-[#0d2138] sm:text-[14px]"
          style={mont}
        >
          Close
        </button>
      </div>
    </div>
  );
}
