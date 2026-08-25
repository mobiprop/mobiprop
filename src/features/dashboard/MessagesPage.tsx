"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { AttachmentPreviewModal } from "@/features/messages/components/AttachmentPreviewModal";
import { ConversationSidebar } from "@/features/messages/components/ConversationSidebar";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { MessageBubble } from "@/features/messages/components/MessageBubble";
import { MessageComposer } from "@/features/messages/components/MessageComposer";
import { DateSeparator } from "@/features/messages/components/DateSeparator";
import { EmptyChatState } from "@/features/messages/components/EmptyChatState";
import { DeleteConversationConfirmModal } from "@/features/messages/components/DeleteConversationConfirmModal";
import { buildMessageListItems } from "@/features/messages/lib/grouping";
import { uploadChatAttachments } from "@/lib/client-upload";
import type { MessageAttachmentDto } from "@/features/messages/types/message-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function isPreviewable(attachment: MessageAttachmentDto): boolean {
  return attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";
}

function ThreadLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 bg-[#fbfcfe] px-3 py-4 sm:px-5 lg:px-6" aria-hidden="true">
      {[40, 70, 55].map((width, i) => (
        <div
          key={i}
          className={`h-10 max-w-[280px] animate-pulse rounded-[14px] bg-[#eef1f4] ${i === 1 ? "self-end" : "self-start"}`}
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

export function MessagesPage({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation("messages");
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const markedReadRef = useRef<string | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useMessageThreadsQuery(showArchived);
  const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;
  const { data: threadData, isLoading: threadLoading } = useMessageThreadQuery(activeConversationId);
  const { data: staffDirectory = [] } = useMessageableStaffQuery();

  const createConversation = useCreateConversationMutation();
  const sendMessage = useSendMessageMutation(activeConversationId ?? "");
  const markRead = useMarkConversationReadMutation(activeConversationId ?? "");
  const deleteMessage = useDeleteMessageMutation(activeConversationId ?? "");
  const toggleStar = useToggleStarMutation();
  const toggleArchive = useToggleArchiveMutation();
  const deleteConversation = useDeleteConversationMutation();

  const messages = threadData?.messages ?? [];
  const listItems = useMemo(() => buildMessageListItems(messages), [messages]);

  // Flat, chronological list of every previewable attachment in the open
  // thread (not just the clicked message) so the modal's ← → can step across
  // the whole conversation, mirroring listings' gallery lightbox.
  const previewableAttachments = useMemo(
    () => messages.flatMap((message) => message.attachments.filter(isPreviewable)),
    [messages],
  );

  const handlePreviewAttachment = (attachmentId: string) => {
    const index = previewableAttachments.findIndex((attachment) => attachment.id === attachmentId);
    if (index !== -1) setPreviewIndex(index);
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const isActiveOnline = useIsStaffOnline(activeConversation?.otherUser.id);

  const filtered = conversations.filter(
    (c) => !search || (c.otherUser.fullName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Mark the open conversation read once per unread arrival — ref-guarded so
  // this doesn't refire every render while the mutation is in flight. The ref
  // is cleared once unreadCount actually reaches 0 so a *later* message
  // arriving in the same already-open conversation is marked read again too,
  // instead of being permanently blocked by the first mark-read.
  useEffect(() => {
    if (!activeConversation) return;
    if (activeConversation.unreadCount === 0) {
      if (markedReadRef.current === activeConversation.id) markedReadRef.current = null;
      return;
    }
    if (markedReadRef.current === activeConversation.id) return;
    markedReadRef.current = activeConversation.id;
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, activeConversation?.unreadCount]);

  // Belt-and-suspenders auto-scroll: the message list's flex-col-reverse-style
  // bottom anchoring handles the common case with zero JS, but a fresh
  // conversation switch or a burst of new messages benefits from an explicit
  // scroll so the latest message is never left off-screen.
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeConversationId, messages.length]);

  const handleSelectContact = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setMobileChatOpen(true);
    setPickerOpen(false);
    setSendError(null);
  };

  const handleStartConversation = async (otherProfileId: string) => {
    const conversationId = await createConversation.mutateAsync(otherProfileId);
    handleSelectContact(conversationId);
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Snapshot to a plain array now — `files` is the input's live FileList,
    // and the caller resets `event.target.value` right after this returns,
    // which mutates that same FileList to empty before React's setState
    // updater below actually runs.
    const snapshot = Array.from(files);
    setPendingFiles((prev) => [...prev, ...snapshot].slice(0, 6));
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || sending) return;
    if (!draft.trim() && pendingFiles.length === 0) return;

    setSending(true);
    setSendError(null);
    try {
      const attachments = await uploadChatAttachments(activeConversationId, pendingFiles);
      await sendMessage.mutateAsync({ body: draft.trim(), attachments });
      setDraft("");
      setPendingFiles([]);
    } catch {
      setSendError(t("page.sendFailed"));
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
          {t("page.title")}
        </h1>

        <p className="text-[12px] font-medium leading-5 tracking-[-0.12px] text-[#6a7282] sm:text-[14px] sm:tracking-[-0.14px]" style={mont}>
          {t("page.subtitle")}
        </p>
      </div>

      {/* Chat container */}
      <div
        className="
          flex h-[calc(100dvh-160px)]
          overflow-hidden rounded-[16px]
          border border-[#e5e7eb] bg-white
          shadow-[0_1px_3px_rgba(13,33,56,0.05)]
          md:h-[calc(100dvh-180px)]
          lg:h-[calc(100vh-230px)]
        "
      >
        <ConversationSidebar
          conversations={conversations}
          isLoading={conversationsLoading}
          filtered={filtered}
          activeConversationId={activeConversationId}
          search={search}
          onSearchChange={setSearch}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived((v) => !v)}
          pickerOpen={pickerOpen}
          onTogglePicker={() => setPickerOpen((open) => !open)}
          staffDirectory={staffDirectory}
          onStartConversation={handleStartConversation}
          onSelectConversation={handleSelectContact}
          hidden={mobileChatOpen}
        />

        {/* Right: chat area */}
        <div className={`min-h-0 min-w-0 flex-1 flex-col md:flex ${mobileChatOpen ? "flex" : "hidden"}`}>
          {!activeConversation ? (
            <EmptyChatState variant="no-conversation" />
          ) : (
            <>
              <ChatHeader
                conversation={activeConversation}
                isOnline={isActiveOnline}
                onBack={() => setMobileChatOpen(false)}
                onToggleStar={() => toggleStar.mutate(activeConversation.id)}
                onToggleArchive={handleToggleArchive}
                onRequestDelete={() => setConfirmingDelete(true)}
              />

              {/* Messages area */}
              {threadLoading && !threadData ? (
                <ThreadLoadingSkeleton />
              ) : messages.length === 0 ? (
                <EmptyChatState variant="no-messages" />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#fbfcfe] px-3 py-4 sm:px-5 lg:px-6">
                  {/* `mt-auto` (not `justify-end` on the scrollable parent) pushes a
                      short thread down to the bottom — `justify-content: flex-end`
                      on an `overflow-y-auto` flex column is a known Chromium quirk
                      that makes `scrollHeight` ignore the overflow, breaking scroll
                      entirely once messages exceed the viewport. */}
                  <div className="mt-auto flex flex-col gap-0.5 sm:gap-1">
                    {listItems.map((item) =>
                      item.type === "date" ? (
                        <DateSeparator key={item.key} label={item.label} />
                      ) : (
                        <MessageBubble
                          key={item.key}
                          message={item.message}
                          isOwn={item.message.senderId === currentUserId}
                          isGroupStart={item.isGroupStart}
                          isGroupEnd={item.isGroupEnd}
                          otherFullName={activeConversation.otherUser.fullName}
                          otherAvatarUrl={activeConversation.otherUser.avatarUrl}
                          onDelete={(messageId) => deleteMessage.mutate(messageId)}
                          onPreviewAttachment={handlePreviewAttachment}
                        />
                      ),
                    )}
                    <div ref={scrollBottomRef} />
                  </div>
                </div>
              )}

              <MessageComposer
                draft={draft}
                onDraftChange={setDraft}
                pendingFiles={pendingFiles}
                onAddFiles={handleAddFiles}
                onRemoveFile={(index) => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                onSend={handleSendMessage}
                sending={sending}
                sendError={sendError}
              />
            </>
          )}
        </div>
      </div>

      {confirmingDelete && activeConversation && (
        <DeleteConversationConfirmModal
          otherName={activeConversation.otherUser.fullName ?? t("page.otherStaffFallback")}
          isDeleting={deleteConversation.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <AttachmentPreviewModal
        attachments={previewableAttachments}
        startIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  );
}
