import "server-only";

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "INVITATION_CREATED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REVOKED"
  | "INVITATION_RESENT"
  | "LISTING_CREATED"
  | "LISTING_STATUS_CHANGED"
  | "LISTING_FEATURED_CHANGED"
  | "LISTING_DELETED";

type NotificationContent = {
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
};

/**
 * Fan a notification out to every ACTIVE admin (minus `excludeId`, typically
 * the actor — no point notifying an admin about their own click). Best-effort:
 * failures are logged, never thrown.
 */
export async function notifyAdmins(
  content: NotificationContent,
  excludeId?: string,
): Promise<void> {
  try {
    const admins = await prisma.profile.findMany({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        recipientId: admin.id,
        type: content.type,
        title: content.title,
        body: content.body,
        entityType: content.entityType,
        entityId: content.entityId,
      })),
    });
  } catch (error) {
    console.error("[notifications] failed to notify admins", content.type, error);
  }
}
