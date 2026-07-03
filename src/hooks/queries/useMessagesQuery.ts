import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ConversationSummaryDto, MessageDto } from "@/features/messages/types/message-dto";

// ── Conversation list ────────────────────────────────────────────────────────

async function fetchConversations(archivedOnly: boolean): Promise<ConversationSummaryDto[]> {
  const res = await fetch(`/api/dashboard/messages?archivedOnly=${archivedOnly}`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  const json = await res.json();
  return json.conversations;
}

export function useMessageThreadsQuery(archivedOnly = false) {
  return useQuery({
    queryKey: queryKeys.messageThreads(archivedOnly),
    queryFn: () => fetchConversations(archivedOnly),
    staleTime: 15_000,
  });
}

// ── Single conversation's messages ───────────────────────────────────────────

async function fetchMessages(conversationId: string): Promise<{ messages: MessageDto[]; nextCursor: string | null }> {
  const res = await fetch(`/api/dashboard/messages/${conversationId}`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  const json = await res.json();
  return { messages: json.messages, nextCursor: json.nextCursor };
}

export function useMessageThreadQuery(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.messageThread(conversationId ?? ""),
    queryFn: () => fetchMessages(conversationId as string),
    enabled: !!conversationId,
    staleTime: 15_000,
  });
}

// ── Unread badge ──────────────────────────────────────────────────────────────

async function fetchUnreadMessageCount(): Promise<number> {
  const res = await fetch("/api/dashboard/messages/unread-count");
  if (!res.ok) throw new Error("Failed to fetch unread message count");
  const json = await res.json();
  return json.count;
}

export function useUnreadMessageCountQuery() {
  return useQuery({
    queryKey: queryKeys.unreadMessageCount(),
    queryFn: fetchUnreadMessageCount,
    staleTime: 15_000,
  });
}

// ── Staff directory (for the "start a new conversation" picker) ─────────────

export type MessageableStaff = { id: string; fullName: string | null; avatarUrl: string | null; role: string };

async function fetchMessageableStaff(): Promise<MessageableStaff[]> {
  const res = await fetch("/api/dashboard/messages/staff");
  if (!res.ok) throw new Error("Failed to fetch staff directory");
  const json = await res.json();
  return json.staff;
}

export function useMessageableStaffQuery() {
  return useQuery({
    queryKey: queryKeys.messageableStaff(),
    queryFn: fetchMessageableStaff,
    staleTime: 60_000,
  });
}
