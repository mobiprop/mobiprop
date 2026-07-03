"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useMessageThreadsQuery, useMessageThreadQuery, useMessageableStaffQuery } from "@/hooks/queries/useMessagesQuery";
import {
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
  useSendMessageMutation,
  useToggleArchiveMutation,
  useToggleStarMutation,
} from "@/hooks/mutations/useMessageMutations";
import { useIsStaffOnline } from "@/features/messages/online-staff-store";
import { uploadChatAttachments } from "@/lib/client-upload";
import type { ConversationSummaryDto, MessageDto } from "@/features/messages/types/message-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#3b82f6", "#ef4444", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#0ea5e9", "#84cc16"];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function formatListTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function formatBubbleTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({
  fullName,
  id,
  avatarUrl,
  size = 48,
}: {
  fullName: string | null;
  id: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fullName ?? "Avatar"}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: colorForId(id),
        fontSize: size * 0.3,
        ...mont,
      }}
    >
      {initialsFor(fullName)}
    </div>
  );
}

function OnlineDot({ size = 12, borderSize = 2 }: { size?: number; borderSize?: number }) {
  return (
    <div
      className="absolute shrink-0 rounded-full border-white bg-[#00c950]"
      style={{ width: size, height: size, borderWidth: borderSize, borderStyle: "solid", bottom: 0, right: 0 }}
    />
  );
}

function MessageBubble({
  message,
  isOwn,
  onDelete,
}: {
  message: MessageDto;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
}) {
  return (
    <div
      className={`group flex max-w-[85%] items-start gap-1 sm:max-w-[70%] lg:max-w-[55%] ${
        isOwn ? "self-end" : "self-start"
      }`}
    >
      {isOwn && (
        <button
          type="button"
          aria-label="Delete this message"
          title="Delete this message"
          onClick={() => onDelete(message.id)}
          className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-[#99a1af] opacity-0 transition-opacity hover:bg-red-50 hover:text-[#e7000b] group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className={`flex min-w-0 flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {message.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.attachments.map((attachment) =>
              attachment.mimeType.startsWith("image/") ? (
                <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="max-h-[240px] max-w-[260px] rounded-[10px] object-cover"
                  />
                </a>
              ) : (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2 hover:bg-[#f8fafc]"
                >
                  <FileText size={18} className="shrink-0 text-[#6a7282]" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[11px] font-medium text-[#0d2138]" style={mont}>
                      {attachment.fileName}
                    </span>
                    <span className="text-[10px] text-[#99a1af]" style={mont}>
                      {formatFileSize(attachment.sizeBytes)}
                    </span>
                  </div>
                </a>
              ),
            )}
          </div>
        )}

        {message.body.length > 0 && (
          <div className="rounded-[12px] px-3 py-2.5 sm:py-3" style={{ backgroundColor: isOwn ? "#1e4f86" : "#f3f4f6" }}>
            <p
              className="whitespace-pre-wrap break-words text-[12px] font-medium leading-4 tracking-[-0.12px]"
              style={{ color: isOwn ? "#ffffff" : "#6a7282", ...mont }}
            >
              {message.body}
            </p>
          </div>
        )}

        <span className="text-[10px] font-normal tracking-[-0.1px] text-[#99a1af] sm:text-[12px] sm:tracking-[-0.12px]" style={mont}>
          {formatBubbleTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// A file staged in the composer before send — shows a thumbnail (images) or
// file icon, and switches to a spinner + "Uploading..." while the send is in
// flight (mirrors Slack's staged-attachment treatment).
function PendingAttachmentCard({
  file,
  uploading,
  onRemove,
}: {
  file: File;
  uploading: boolean;
  onRemove: () => void;
}) {
  const previewUrl = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-dashed border-[#c2dcff] bg-[#f5f9ff] px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.name} className="size-8 shrink-0 rounded-[6px] object-cover" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#dbeafe]">
            <FileText size={16} className="text-[#1e4f86]" />
          </div>
        )}

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0d2138]" style={mont}>
          {file.name}
        </span>

        {uploading ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-medium text-[#1e4f86]"
            style={mont}
          >
            <Loader2 size={10} className="animate-spin" />
            Uploading…
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-[#99a1af]" style={mont}>
            {formatFileSize(file.size)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={uploading}
        title="Remove attachment"
        className="flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#e7000b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Soft "delete for me" only — the other participant keeps their full copy of
// the conversation, nothing is permanently destroyed. Mirrors ContactsPage's
// DeleteConfirmModal styling/structure.
function DeleteConversationConfirmModal({
  otherName,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  otherName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[420px] rounded-[16px] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#fff1f2]">
            <AlertTriangle size={22} className="text-[#fb2c36]" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
              Delete conversation
            </p>
            <p className="text-[13px] leading-5 text-[#6a7282]" style={mont}>
              Your conversation with <span className="font-semibold text-[#0d2138]">{otherName}</span> will be
              removed from your inbox. <span className="font-semibold text-[#0d2138]">{otherName}</span> will still
              see the full conversation on their side — this only deletes it for you, and it isn&apos;t permanent:
              messaging them again brings the history back.
            </p>
          </div>
          <div className="flex w-full gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 flex-1 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] text-[13px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="h-10 flex-1 rounded-[10px] bg-[#fb2c36] text-[13px] font-medium text-white transition-colors hover:bg-[#e0262f] disabled:cursor-not-allowed disabled:opacity-60"
              style={mont}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MessagesPage({ currentUserId }: { currentUserId: string }) {
  // The user's explicit selection. When null, the first conversation in the
  // list is used instead (derived below) — no "auto-select on load" effect
  // needed, which would otherwise cause a setState-during-effect render.
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const markedReadRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useMessageThreadsQuery(showArchived);
  const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;
  const { data: threadData } = useMessageThreadQuery(activeConversationId);
  const { data: staffDirectory = [] } = useMessageableStaffQuery();

  const createConversation = useCreateConversationMutation();
  const sendMessage = useSendMessageMutation(activeConversationId ?? "");
  const markRead = useMarkConversationReadMutation(activeConversationId ?? "");
  const deleteMessage = useDeleteMessageMutation(activeConversationId ?? "");
  const toggleStar = useToggleStarMutation();
  const toggleArchive = useToggleArchiveMutation();
  const deleteConversation = useDeleteConversationMutation();

  const messages = threadData?.messages ?? [];

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const isActiveOnline = useIsStaffOnline(activeConversation?.otherUser.id);

  const filtered = conversations.filter(
    (c) => !search || (c.otherUser.fullName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Mark the open conversation read once per unread arrival — ref-guarded so
  // this doesn't refire every render while the mutation is in flight.
  useEffect(() => {
    if (!activeConversation || activeConversation.unreadCount === 0) return;
    if (markedReadRef.current === activeConversation.id) return;
    markedReadRef.current = activeConversation.id;
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeConversation?.unreadCount]);

  const handleSelectContact = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMobileChatOpen(true);
    setPickerOpen(false);
  };

  const handleStartConversation = async (otherProfileId: string) => {
    const conversationId = await createConversation.mutateAsync(otherProfileId);
    handleSelectContact(conversationId);
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)].slice(0, 6));
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || sending) return;
    if (!draft.trim() && pendingFiles.length === 0) return;

    setSending(true);
    try {
      const attachments = await uploadChatAttachments(activeConversationId, pendingFiles);
      await sendMessage.mutateAsync({ body: draft.trim(), attachments });
      setDraft("");
      setPendingFiles([]);
    } catch (error) {
      console.error("[messages] failed to send", error);
    } finally {
      setSending(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!activeConversationId) return;
    await toggleArchive.mutateAsync(activeConversationId);
    if (!showArchived) {
      setSelectedConversationId(null);
      setMobileChatOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeConversationId) return;
    await deleteConversation.mutateAsync(activeConversationId);
    setConfirmingDelete(false);
    setSelectedConversationId(null);
    setMobileChatOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div>
        <h1
          className="text-[18px] font-medium leading-7 tracking-[-0.18px] text-[#0d2138] sm:text-[20px] sm:leading-8 sm:tracking-[-0.2px]"
          style={poppins}
        >
          Messages
        </h1>

        <p className="text-[12px] font-medium leading-5 tracking-[-0.12px] text-[#6a7282] sm:text-[14px] sm:tracking-[-0.14px]" style={mont}>
          Communicate with your team
        </p>
      </div>

      {/* Chat container */}
      <div
        className="
          flex min-h-[calc(100dvh-160px)]
          overflow-hidden rounded-[14px]
          border border-[#f3f4f6] bg-white
          md:min-h-[600px]
          lg:h-[calc(100vh-230px)]
        "
      >
        {/* Left: contact list */}
        <div
          className={`
            w-full shrink-0 flex-col
            border-[#e5e7eb]
            md:flex md:w-[280px] md:border-r
            lg:w-[320px]

            ${mobileChatOpen ? "hidden" : "flex"}
          `}
        >
          {/* Search + new conversation */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] px-3 py-3 sm:px-4 sm:py-[15px]">
            <div className="relative h-10 flex-1 sm:h-9">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99a1af]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search messages..."
                className="
                  h-full w-full rounded-[10px]
                  border border-[#e5e7eb]
                  bg-[#f8fafc]
                  pl-9 pr-3
                  text-[12px] font-medium
                  text-[#0d2138]
                  outline-none
                  placeholder:text-[#99a1af]
                "
                style={mont}
              />
            </div>

            <button
              type="button"
              aria-label="Start new conversation"
              title="Start new conversation"
              onClick={() => setPickerOpen((open) => !open)}
              className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                pickerOpen ? "bg-[#1e4f86] text-white" : "bg-[#f8fafc] text-[#6a7282] hover:bg-[#f3f4f6]"
              }`}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Archived filter toggle */}
          <div className="shrink-0 border-b border-[#e5e7eb] px-3 py-2 sm:px-4">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="text-[11px] font-medium text-[#6a7282] hover:text-[#0d2138] sm:text-[12px]"
              style={mont}
            >
              {showArchived ? "← Back to active" : "View archived"}
            </button>
          </div>

          {/* New conversation picker */}
          {pickerOpen && (
            <div className="flex-1 overflow-y-auto">
              {staffDirectory.length === 0 && (
                <div className="flex h-40 items-center justify-center px-4">
                  <p className="text-center text-[12px] text-[#99a1af]" style={mont}>
                    No other staff members found
                  </p>
                </div>
              )}
              {staffDirectory.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleStartConversation(staff.id)}
                  className="flex w-full items-center gap-3 border-b border-[#e5e7eb] px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f8fafc] sm:px-4"
                >
                  <Avatar fullName={staff.fullName} id={staff.id} avatarUrl={staff.avatarUrl} size={40} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>
                      {staff.fullName ?? "Unnamed"}
                    </span>
                    <span className="text-[11px] capitalize text-[#99a1af]" style={mont}>
                      {staff.role.toLowerCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contact list */}
          {!pickerOpen && (
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  onSelect={() => handleSelectContact(conversation.id)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="flex h-40 items-center justify-center px-4">
                  <p className="text-center text-[12px] text-[#99a1af]" style={mont}>
                    No messages found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: chat area */}
        <div className={`min-w-0 flex-1 flex-col md:flex ${mobileChatOpen ? "flex" : "hidden"}`}>
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center px-4">
              <p className="text-center text-[13px] text-[#99a1af]" style={mont}>
                Select a conversation to start chatting
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="
                  flex min-h-[64px] shrink-0
                  items-center justify-between gap-2
                  border-b border-[#e5e7eb]
                  px-3 py-2
                  sm:px-4
                  lg:h-[66px] lg:px-6 lg:py-0
                "
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {/* Mobile back button */}
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="Back to contacts"
                    className="
                      flex size-9 shrink-0
                      items-center justify-center
                      rounded-[9px]
                      text-[#6a7282]
                      transition-colors
                      hover:bg-[#f3f4f6]
                      hover:text-[#0d2138]
                      md:hidden
                    "
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar
                      fullName={activeConversation.otherUser.fullName}
                      id={activeConversation.otherUser.id}
                      avatarUrl={activeConversation.otherUser.avatarUrl}
                      size={40}
                    />
                    {isActiveOnline && <OnlineDot size={10} />}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold leading-5 tracking-[-0.13px] text-[#0d2138] sm:text-[14px] sm:tracking-[-0.14px]"
                      style={mont}
                    >
                      {activeConversation.otherUser.fullName ?? "Unnamed"}
                    </p>

                    <p
                      className={`text-[11px] font-medium leading-4 tracking-[-0.11px] sm:text-[12px] sm:tracking-[-0.12px] ${
                        isActiveOnline ? "text-[#00c950]" : "text-[#99a1af]"
                      }`}
                      style={mont}
                    >
                      {isActiveOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Action icons */}
                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-5">
                  <button
                    type="button"
                    aria-label={activeConversation.isStarred ? "Unstar conversation" : "Star conversation"}
                    title={activeConversation.isStarred ? "Unstar conversation" : "Star conversation"}
                    onClick={() => toggleStar.mutate(activeConversation.id)}
                    className="flex size-9 items-center justify-center rounded-[9px] transition-colors hover:bg-[#f3f4f6] lg:size-auto"
                    style={{ color: activeConversation.isStarred ? "#f59e0b" : "#6a7282" }}
                  >
                    <Star size={20} fill={activeConversation.isStarred ? "#f59e0b" : "none"} />
                  </button>

                  <button
                    type="button"
                    aria-label={
                      activeConversation.isArchived
                        ? "Restore conversation to your inbox"
                        : "Archive conversation — hides it from your inbox, doesn't delete it"
                    }
                    title={
                      activeConversation.isArchived
                        ? "Restore conversation to your inbox"
                        : "Archive conversation — hides it from your inbox, doesn't delete it"
                    }
                    onClick={handleToggleArchive}
                    className="
                      flex size-9 items-center justify-center
                      rounded-[9px]
                      text-[#6a7282]
                      transition-colors
                      hover:bg-[#f3f4f6]
                      hover:text-[#0d2138]
                      lg:size-auto
                    "
                  >
                    {activeConversation.isArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
                  </button>

                  <button
                    type="button"
                    aria-label="Delete conversation — only removes it from your side"
                    title="Delete conversation — only removes it from your side"
                    onClick={() => setConfirmingDelete(true)}
                    className="
                      flex size-9 items-center justify-center
                      rounded-[9px]
                      text-[#6a7282]
                      transition-colors
                      hover:bg-red-50
                      hover:text-[#e7000b]
                      lg:size-auto
                    "
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-3 py-4 sm:gap-4 sm:px-5 lg:px-6">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    onDelete={(messageId) => deleteMessage.mutate(messageId)}
                  />
                ))}
              </div>

              {/* Pending attachment previews */}
              {pendingFiles.length > 0 && (
                <div className="flex shrink-0 flex-col gap-2 border-t border-[#e5e7eb] px-3 pt-3 sm:px-4">
                  {pendingFiles.map((file, index) => (
                    <PendingAttachmentCard
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      uploading={sending}
                      onRemove={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                    />
                  ))}
                </div>
              )}

              {/* Message input */}
              <div className="shrink-0 border-t border-[#e5e7eb] p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handleAddFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      handleAddFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />

                  <div className="flex h-11 min-w-0 flex-1 items-center rounded-[12px] border border-[#dfe3e8] bg-white px-2 sm:px-3">
                    <button
                      type="button"
                      aria-label="Attach a file"
                      title="Attach a file"
                      disabled={sending}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Paperclip size={17} strokeWidth={1.8} />
                    </button>

                    <button
                      type="button"
                      aria-label="Attach an image"
                      title="Attach an image"
                      disabled={sending}
                      onClick={() => imageInputRef.current?.click()}
                      className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ImageIcon size={17} strokeWidth={1.8} />
                    </button>

                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Type your message..."
                      className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#0d2138] outline-none placeholder:text-[#99a1af] sm:text-[13px]"
                      style={poppins}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={(!draft.trim() && pendingFiles.length === 0) || sending}
                    aria-label="Send message"
                    onClick={handleSendMessage}
                    className="
                      flex h-11 shrink-0
                      items-center justify-center
                      gap-2
                      rounded-[12px]
                      bg-[#22558e]
                      px-4
                      text-white
                      transition-colors
                      hover:bg-[#1b487a]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      sm:px-6
                    "
                    style={mont}
                  >
                    <Send size={17} strokeWidth={1.8} />
                    <span className="hidden text-[14px] font-semibold sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {confirmingDelete && activeConversation && (
        <DeleteConversationConfirmModal
          otherName={activeConversation.otherUser.fullName ?? "this staff member"}
          isDeleting={deleteConversation.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

// ── Conversation row (isolated so useIsStaffOnline only re-renders its own row) ──

function ConversationRow({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: ConversationSummaryDto;
  isActive: boolean;
  onSelect: () => void;
}) {
  const online = useIsStaffOnline(conversation.otherUser.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        flex min-h-[76px] w-full
        items-center gap-3
        border-b border-[#e5e7eb]
        px-3 py-3 text-left
        transition-colors
        last:border-b-0
        hover:bg-[#f8fafc]

        sm:min-h-[81px] sm:px-4

        ${isActive ? "bg-[rgba(185,200,217,0.16)]" : ""}
      `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="sm:hidden">
          <Avatar fullName={conversation.otherUser.fullName} id={conversation.otherUser.id} avatarUrl={conversation.otherUser.avatarUrl} size={44} />
        </div>
        <div className="hidden sm:block">
          <Avatar fullName={conversation.otherUser.fullName} id={conversation.otherUser.id} avatarUrl={conversation.otherUser.avatarUrl} size={48} />
        </div>
        {online && <OnlineDot />}
      </div>

      {/* Contact text */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={`min-w-0 truncate text-[13px] font-semibold leading-5 tracking-[-0.13px] sm:text-[14px] sm:tracking-[-0.14px] ${
              conversation.unreadCount > 0 ? "text-[#0d2138]" : "text-[#1f2937]"
            }`}
            style={mont}
          >
            {conversation.otherUser.fullName ?? "Unnamed"}
          </span>

          <span className="shrink-0 text-[11px] font-normal tracking-[-0.11px] text-[#99a1af] sm:text-[12px] sm:tracking-[-0.12px]" style={mont}>
            {formatListTimestamp(conversation.lastMessageAt)}
          </span>
        </div>

        <p
          className={`truncate text-[11px] leading-4 tracking-[-0.11px] sm:text-[12px] sm:tracking-[-0.12px] ${
            conversation.unreadCount > 0 ? "font-semibold text-[#2b3038]" : "font-normal text-[#99a1af]"
          }`}
          style={mont}
        >
          {conversation.lastMessagePreview || "No messages yet"}
        </p>
      </div>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86]">
          <span className="text-[10px] font-semibold text-white" style={mont}>
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        </div>
      )}
    </button>
  );
}
