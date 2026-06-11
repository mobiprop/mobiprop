"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type GetNotificationsResult =
  | { ok: true; notifications: NotificationItem[] }
  | { ok: false; error: string };

/** Latest notifications for the signed-in user (own rows only). */
export async function getMyNotifications(): Promise<GetNotificationsResult> {
  const result = await requireUser();
  if (!result.ok) return { ok: false, error: result.error };

  const rows = await prisma.notification.findMany({
    where: { recipientId: result.profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    ok: true,
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
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
