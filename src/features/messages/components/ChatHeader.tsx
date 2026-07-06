import { Archive, ArchiveRestore, ArrowLeft, Star, Trash2 } from "lucide-react";

import type { ConversationSummaryDto } from "@/features/messages/types/message-dto";
import { Avatar, OnlineDot } from "./PresenceAvatar";
import { IconButton } from "./IconButton";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export function ChatHeader({
  conversation,
  isOnline,
  onBack,
  onToggleStar,
  onToggleArchive,
  onRequestDelete,
}: {
  conversation: ConversationSummaryDto;
  isOnline: boolean;
  onBack: () => void;
  onToggleStar: () => void;
  onToggleArchive: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div
      className="
        flex min-h-[68px] shrink-0
        items-center justify-between gap-2
        border-b border-[#e5e7eb]
        bg-white px-3 py-2
        sm:px-4
        lg:h-[72px] lg:px-6 lg:py-0
      "
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile back button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversation list"
          className="
            flex size-9 shrink-0
            items-center justify-center
            rounded-[9px]
            text-[#6a7282]
            outline-none
            transition-colors
            hover:bg-[#f3f4f6]
            hover:text-[#0d2138]
            focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30
            md:hidden
          "
        >
          <ArrowLeft size={19} />
        </button>

        <div className="relative shrink-0">
          <Avatar
            fullName={conversation.otherUser.fullName}
            id={conversation.otherUser.id}
            avatarUrl={conversation.otherUser.avatarUrl}
            size={44}
          />
          {isOnline && <OnlineDot size={11} />}
        </div>

        <div className="min-w-0">
          <p
            className="truncate text-[13px] font-semibold leading-5 tracking-[-0.13px] text-[#0d2138] sm:text-[14.5px] sm:tracking-[-0.14px]"
            style={mont}
          >
            {conversation.otherUser.fullName ?? "Unnamed"}
          </p>

          <p
            className={`flex items-center gap-1.5 text-[11px] font-medium leading-4 tracking-[-0.11px] sm:text-[12px] sm:tracking-[-0.12px] ${
              isOnline ? "text-[#00a63e]" : "text-[#99a1af]"
            }`}
            style={mont}
          >
            <span className={`size-1.5 shrink-0 rounded-full ${isOnline ? "bg-[#00c950]" : "bg-[#d1d5dc]"}`} aria-hidden="true" />
            <span role="status">{isOnline ? "Online" : "Offline"}</span>
          </p>
        </div>
      </div>

      {/* Action icons */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <IconButton
          icon={<Star size={19} fill={conversation.isStarred ? "#f59e0b" : "none"} />}
          label={conversation.isStarred ? "Unstar conversation" : "Star conversation"}
          onClick={onToggleStar}
          tone="star"
          active={conversation.isStarred}
        />
        <IconButton
          icon={conversation.isArchived ? <ArchiveRestore size={19} /> : <Archive size={19} />}
          label={conversation.isArchived ? "Restore to inbox" : "Archive conversation"}
          onClick={onToggleArchive}
        />
        <IconButton icon={<Trash2 size={19} />} label="Delete conversation" onClick={onRequestDelete} tone="danger" />
      </div>
    </div>
  );
}
