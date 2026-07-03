import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { SendMessageInput } from "@/schemas/message.schema";
import type { ChatAttachmentUploadTicketDto } from "@/features/messages/types/message-dto";

function invalidateThread(qc: ReturnType<typeof useQueryClient>, conversationId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.messageThreads() });
  qc.invalidateQueries({ queryKey: queryKeys.messageThread(conversationId) });
  qc.invalidateQueries({ queryKey: queryKeys.unreadMessageCount() });
}

// ── Start / open a conversation ──────────────────────────────────────────────

export function useCreateConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (otherProfileId: string) => {
      const res = await fetch("/api/dashboard/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherProfileId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start conversation");
      return json.conversationId as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messageThreads() });
    },
  });
}

// ── Send message ──────────────────────────────────────────────────────────────

export function useSendMessageMutation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send message");
      return json.message;
    },
    onSuccess: () => invalidateThread(qc, conversationId),
  });
}

// ── Mark conversation read ───────────────────────────────────────────────────

export function useMarkConversationReadMutation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/read`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to mark conversation read");
      return json.updated as number;
    },
    onSuccess: () => {
      invalidateThread(qc, conversationId);
      qc.invalidateQueries({ queryKey: queryKeys.notifications() });
      qc.invalidateQueries({ queryKey: queryKeys.unreadNotificationsCount() });
    },
  });
}

// ── Delete message ────────────────────────────────────────────────────────────

export function useDeleteMessageMutation(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/messages/${messageId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete message");
      return json.id as string;
    },
    onSuccess: () => invalidateThread(qc, conversationId),
  });
}

// ── Star / archive conversation ──────────────────────────────────────────────

export function useToggleStarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/star`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update star");
      return json.isStarred as boolean;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messageThreads() }),
  });
}

export function useToggleArchiveMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/archive`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update archive state");
      return json.isArchived as boolean;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messageThreads() }),
  });
}

// ── Delete conversation (soft, per-user) ─────────────────────────────────────

export function useDeleteConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete conversation");
      return json.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messageThreads() });
      qc.invalidateQueries({ queryKey: queryKeys.unreadMessageCount() });
    },
  });
}

// ── Attachment upload tickets ─────────────────────────────────────────────────

export function useMintMessageAttachmentTicketsMutation(conversationId: string) {
  return useMutation({
    mutationFn: async (files: { name: string; type: string }[]) => {
      const res = await fetch(`/api/dashboard/messages/${conversationId}/attachments/upload-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create upload ticket");
      return json.tickets as ChatAttachmentUploadTicketDto[];
    },
  });
}
