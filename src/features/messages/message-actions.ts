import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { isStaffRole } from "@/lib/permissions";
import { notifyMessageReceived } from "@/features/notifications/server/notify-events";
import {
  mintChatAttachmentUploadTickets,
  verifyUploadedChatAttachments,
  removeChatAttachmentObjects,
} from "@/lib/supabase/storage";
import { sendMessageSchema } from "@/schemas/message.schema";
import type {
  ChatAttachmentUploadTicketDto,
  ConversationSummaryDto,
  MessageDto,
} from "./types/message-dto";

export type MessageActionError = { ok: false; error: string; status: number };
export type MessageActionResult<T> = ({ ok: true } & T) | MessageActionError;

const messageInclude = { attachments: true } as const;

function toMessageDto(m: {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  attachments: {
    id: string;
    fileName: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  }[];
}): MessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    recipientId: m.recipientId,
    body: m.body,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    attachments: m.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      url: a.url,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
    })),
  };
}

/** Truncated preview text used for Conversation.lastMessagePreview / push snippets. */
function previewFor(body: string, attachmentCount: number): string {
  const trimmed = body.trim();
  if (trimmed.length > 0) return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
  return attachmentCount > 0 ? "📎 Attachment" : "";
}

/**
 * A conversation the caller has soft-deleted (deletedAt set on THEIR OWN
 * participant row) is treated as not-found for them — same as archiving is
 * invisible to a list query, but stronger: it also blocks direct access via
 * listMessages/sendMessage/etc. The only way back in is getOrCreateConversation
 * (starting a new conversation with that person), which clears it.
 */
async function assertParticipant(
  conversationId: string,
  profileId: string,
): Promise<MessageActionError | null> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId } },
  });
  if (!participant || participant.deletedAt) return { ok: false, error: "Conversation not found.", status: 404 };
  return null;
}

/**
 * Every other active staff member, for the "start a new conversation" picker.
 * Deliberately company-wide and gated only by messages:view — NOT the
 * team-scoped `listAgents` (agents:view, which AGENT doesn't even have, and
 * which narrows MANAGER to their own reports). Chat is "any staff to any
 * staff" by design, so this list must not inherit team/role scoping.
 */
export async function listMessageableStaff(): Promise<
  MessageActionResult<{ staff: { id: string; fullName: string | null; avatarUrl: string | null; role: string }[] }>
> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const staff = await prisma.profile.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER", "AGENT"] },
      status: "ACTIVE",
      NOT: { id: gate.profile.id },
    },
    select: { id: true, fullName: true, avatarUrl: true, role: true },
    orderBy: { fullName: "asc" },
  });

  return { ok: true, staff };
}

/** Finds or creates the single 1:1 conversation between the caller and another staff member. */
export async function getOrCreateConversation(
  otherProfileId: string,
): Promise<MessageActionResult<{ conversationId: string }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (otherProfileId === gate.profile.id) {
    return { ok: false, error: "You can't start a conversation with yourself.", status: 422 };
  }

  const other = await prisma.profile.findUnique({
    where: { id: otherProfileId },
    select: { id: true, role: true, status: true },
  });
  if (!other || !isStaffRole(other.role) || other.status !== "ACTIVE") {
    return { ok: false, error: "That staff member is not available to message.", status: 422 };
  }

  const [participantOneId, participantTwoId] = [gate.profile.id, otherProfileId].sort();

  const conversation = await prisma.conversation.upsert({
    where: { participantOneId_participantTwoId: { participantOneId, participantTwoId } },
    create: {
      participantOneId,
      participantTwoId,
      participants: {
        createMany: { data: [{ profileId: participantOneId }, { profileId: participantTwoId }] },
      },
    },
    update: {},
    select: { id: true },
  });

  // Explicitly starting/reopening a conversation with this person is the
  // "undelete for me" action — clears it whether or not it was actually set.
  await prisma.conversationParticipant.update({
    where: { conversationId_profileId: { conversationId: conversation.id, profileId: gate.profile.id } },
    data: { deletedAt: null },
  });

  return { ok: true, conversationId: conversation.id };
}

/**
 * Conversations the caller participates in, newest activity first.
 * `archivedOnly` switches between the two mutually-exclusive views ("active"
 * vs "archived") — it does NOT union them, so a conversation only ever shows
 * up in exactly one of the two lists.
 */
export async function listConversations(
  archivedOnly = false,
): Promise<MessageActionResult<{ conversations: ConversationSummaryDto[] }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const participantRows = await prisma.conversationParticipant.findMany({
    where: { profileId: gate.profile.id, isArchived: archivedOnly, deletedAt: null },
    include: {
      conversation: {
        include: { participants: true },
      },
    },
    // Postgres sorts NULLs first on DESC by default, which would put brand-new,
    // still-empty conversations (lastMessageAt: null) ahead of ones with real
    // recent activity — and since the client auto-selects the first row, an
    // empty conversation would silently become the default-opened thread.
    orderBy: { conversation: { lastMessageAt: { sort: "desc", nulls: "last" } } },
  });

  if (participantRows.length === 0) return { ok: true, conversations: [] };

  const otherIds = participantRows.map((row) => {
    const other = row.conversation.participants.find((p) => p.profileId !== gate.profile.id);
    return other?.profileId ?? row.conversation.participantOneId;
  });

  const [otherProfiles, unreadGroups] = await Promise.all([
    prisma.profile.findMany({
      where: { id: { in: [...new Set(otherIds)] } },
      select: { id: true, fullName: true, avatarUrl: true, role: true },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        recipientId: gate.profile.id,
        readAt: null,
        deletedAt: null,
        conversationId: { in: participantRows.map((row) => row.conversationId) },
      },
      _count: { _all: true },
    }),
  ]);

  const profileMap = new Map(otherProfiles.map((p) => [p.id, p]));
  const unreadMap = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));

  const conversations: ConversationSummaryDto[] = participantRows.map((row, index) => {
    const otherId = otherIds[index];
    const other = profileMap.get(otherId);

    return {
      id: row.conversationId,
      otherUser: {
        id: otherId,
        fullName: other?.fullName ?? null,
        avatarUrl: other?.avatarUrl ?? null,
        role: other?.role ?? "AGENT",
      },
      lastMessagePreview: row.conversation.lastMessagePreview,
      lastMessageAt: row.conversation.lastMessageAt?.toISOString() ?? null,
      unreadCount: unreadMap.get(row.conversationId) ?? 0,
      isStarred: row.isStarred,
      isArchived: row.isArchived,
    };
  });

  return { ok: true, conversations };
}

/** Total unread message count for the caller across every conversation — powers the Sidebar badge. */
export async function getUnreadMessageCount(): Promise<MessageActionResult<{ count: number }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const count = await prisma.message.count({
    where: { recipientId: gate.profile.id, readAt: null, deletedAt: null },
  });
  return { ok: true, count };
}

/** Cursor-paginated message history for a conversation, oldest-to-newest within each page. */
export async function listMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<MessageActionResult<{ messages: MessageDto[]; nextCursor: string | null }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertParticipant(conversationId, gate.profile.id);
  if (accessError) return accessError;

  const rows = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { ok: true, messages: page.reverse().map(toMessageDto), nextCursor };
}

/** Mints signed upload tickets for attachments about to be sent in `conversationId`. */
export async function mintMessageAttachmentTickets(
  conversationId: string,
  files: { name: string; type: string }[],
): Promise<MessageActionResult<{ tickets: ChatAttachmentUploadTicketDto[] }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertParticipant(conversationId, gate.profile.id);
  if (accessError) return accessError;

  try {
    const tickets = await mintChatAttachmentUploadTickets(conversationId, files);
    return { ok: true, tickets };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create upload ticket.", status: 400 };
  }
}

/** Sends a message (text and/or already-uploaded attachments) into a conversation. */
export async function sendMessage(
  conversationId: string,
  body: unknown,
): Promise<MessageActionResult<{ message: MessageDto }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertParticipant(conversationId, gate.profile.id);
  if (accessError) return accessError;

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message.", status: 422 };
  }
  const { body: text, attachments } = parsed.data;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conversation) return { ok: false, error: "Conversation not found.", status: 404 };
  const other = conversation.participants.find((p) => p.profileId !== gate.profile.id);
  if (!other) return { ok: false, error: "Conversation not found.", status: 404 };
  const recipientId = other.profileId;

  let verified: { storagePath: string; url: string; sizeBytes: number; mimeType: string }[] = [];
  if (attachments.length > 0) {
    try {
      verified = await verifyUploadedChatAttachments(conversationId, attachments.map((a) => a.storagePath));
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to verify attachments.", status: 400 };
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: gate.profile.id,
      recipientId,
      body: text,
      attachments: {
        createMany: {
          data: verified.map((v, index) => ({
            fileName: attachments[index].fileName,
            storagePath: v.storagePath,
            url: v.url,
            mimeType: v.mimeType,
            sizeBytes: v.sizeBytes,
          })),
        },
      },
    },
    include: messageInclude,
  });

  const preview = previewFor(text, attachments.length);
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt, lastMessagePreview: preview },
  });

  // A new message is new content the recipient hasn't seen — if they'd
  // soft-deleted the conversation, this brings it back into their inbox
  // (mirrors how most chat apps revive a chat you deleted when the other
  // person messages you again).
  if (other.deletedAt) {
    await prisma.conversationParticipant.update({
      where: { conversationId_profileId: { conversationId, profileId: recipientId } },
      data: { deletedAt: null },
    });
  }

  await notifyMessageReceived({
    conversationId,
    senderId: gate.profile.id,
    senderName: gate.profile.fullName ?? "A colleague",
    recipientId,
    bodySnippet: preview,
  });

  return { ok: true, message: toMessageDto(message) };
}

/** Marks every unread inbound message in a conversation read, and syncs the matching Notification rows / read cursor. */
export async function markConversationRead(
  conversationId: string,
): Promise<MessageActionResult<{ updated: number }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertParticipant(conversationId, gate.profile.id);
  if (accessError) return accessError;

  const now = new Date();
  const [{ count }] = await Promise.all([
    prisma.message.updateMany({
      where: { conversationId, recipientId: gate.profile.id, readAt: null },
      data: { readAt: now },
    }),
    prisma.notification.updateMany({
      where: {
        recipientId: gate.profile.id,
        type: "MESSAGE_RECEIVED",
        entityType: "CONVERSATION",
        entityId: conversationId,
        readAt: null,
      },
      data: { readAt: now },
    }),
    prisma.conversationParticipant.update({
      where: { conversationId_profileId: { conversationId, profileId: gate.profile.id } },
      data: { lastReadAt: now },
    }),
  ]);

  return { ok: true, updated: count };
}

/** Soft-deletes a message the caller sent. Record-level check — no separate permission needed. */
export async function deleteMessage(messageId: string): Promise<MessageActionResult<{ id: string }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { attachments: true },
  });
  if (!message || message.deletedAt) return { ok: false, error: "Message not found.", status: 404 };
  if (message.senderId !== gate.profile.id) {
    return { ok: false, error: "You can only delete your own messages.", status: 403 };
  }

  await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });

  if (message.attachments.length > 0) {
    await removeChatAttachmentObjects(message.attachments.map((a) => a.storagePath));
  }

  return { ok: true, id: messageId };
}

async function toggleParticipantFlag(
  conversationId: string,
  flag: "isStarred" | "isArchived",
): Promise<MessageActionResult<{ value: boolean }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId, profileId: gate.profile.id } },
  });
  if (!participant) return { ok: false, error: "Conversation not found.", status: 404 };

  const updated = await prisma.conversationParticipant.update({
    where: { conversationId_profileId: { conversationId, profileId: gate.profile.id } },
    data: { [flag]: !participant[flag] },
  });

  return { ok: true, value: updated[flag] };
}

export function toggleConversationStar(conversationId: string) {
  return toggleParticipantFlag(conversationId, "isStarred");
}

export function toggleConversationArchive(conversationId: string) {
  return toggleParticipantFlag(conversationId, "isArchived");
}

/**
 * "Delete conversation" — soft, per-user. Sets deletedAt on the CALLER's own
 * participant row only: no Message rows are touched, and the other
 * participant's row/view is completely unaffected (matches normal chat-app
 * "delete for me" semantics, not a real/permanent delete). Reversed by
 * starting a new conversation with the same person (getOrCreateConversation)
 * or by them sending a new message (sendMessage).
 */
export async function deleteConversation(conversationId: string): Promise<MessageActionResult<{ id: string }>> {
  const gate = await requirePermission("messages:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertParticipant(conversationId, gate.profile.id);
  if (accessError) return accessError;

  await prisma.conversationParticipant.update({
    where: { conversationId_profileId: { conversationId, profileId: gate.profile.id } },
    data: { deletedAt: new Date() },
  });

  return { ok: true, id: conversationId };
}
