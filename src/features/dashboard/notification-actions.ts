"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { isInternalUrl } from "@/features/notifications/utils/is-internal-url";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  /** Same-origin internal path to open; null when none/unsafe. */
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type GetNotificationsResult =
  | { ok: true; notifications: NotificationItem[] }
  | { ok: false; error: string };

const LIST_LIMIT = 30;

/** Latest non-dismissed notifications for the signed-in user (own rows only). */
export async function getMyNotifications(): Promise<GetNotificationsResult> {
  const result = await requireUser();
  if (!result.ok) return { ok: false, error: result.error };

  const rows = await prisma.notification.findMany({
    where: { recipientId: result.profile.id, dismissedAt: null },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  return {
    ok: true,
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      // Re-validate at the boundary so only safe internal links reach the client.
      actionUrl: n.actionUrl && isInternalUrl(n.actionUrl) ? n.actionUrl : null,
      entityType: n.entityType,
      entityId: n.entityId,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** Count of the signed-in user's unread, non-dismissed notifications. */
export async function getUnreadNotificationCount(): Promise<{ ok: boolean; count: number }> {
  const result = await requireUser();
  if (!result.ok) return { ok: false, count: 0 };

  const count = await prisma.notification.count({
    where: { recipientId: result.profile.id, readAt: null, dismissedAt: null },
  });
  return { ok: true, count };
}

/** Mark a single notification as read (only if it belongs to the caller). */
export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const result = await requireUser();
  if (!result.ok) return { ok: false };

  // Scope by recipientId so a user can never mutate another user's row.
  await prisma.notification.updateMany({
    where: { id, recipientId: result.profile.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

/** Dismiss a single notification (recipient-scoped; row retained for audit). */
export async function dismissNotification(id: string): Promise<{ ok: boolean }> {
  const result = await requireUser();
  if (!result.ok) return { ok: false };

  await prisma.notification.updateMany({
    where: { id, recipientId: result.profile.id, dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  return { ok: true };
}

/** Mark all of the signed-in user's unread notifications as read. */
export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const result = await requireUser();
  if (!result.ok) return { ok: false };

  await prisma.notification.updateMany({
    where: { recipientId: result.profile.id, readAt: null },
    data: { readAt: new Date() },
  });

  return { ok: true };
}
