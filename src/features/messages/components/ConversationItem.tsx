import { useIsStaffOnline } from "@/features/messages/online-staff-store";
import { formatListTimestamp } from "@/features/messages/lib/format";
import type { ConversationSummaryDto } from "@/features/messages/types/message-dto";
import { Avatar, OnlineDot } from "./PresenceAvatar";

const mont = { fontFamily: "'Montserrat', sans-serif" };

// Isolated component so useIsStaffOnline only re-renders its own row.
export function ConversationItem({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: ConversationSummaryDto;
  isActive: boolean;
  onSelect: () => void;
}) {
  const online = useIsStaffOnline(conversation.otherUser.id);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive}
      aria-label={`Open conversation with ${conversation.otherUser.fullName ?? "Unnamed"}${hasUnread ? `, ${conversation.unreadCount} unread` : ""}`}
      className={`
        relative flex min-h-[72px] w-full
        items-center gap-3
        px-3 py-3 text-left
        outline-none
        transition-colors
        focus-visible:bg-[#f3f4f6]
        sm:min-h-[76px] sm:px-4

        ${isActive ? "bg-[#eaf0f8]" : "hover:bg-[#f8fafc]"}
      `}
    >
      {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#1e4f86]" aria-hidden="true" />}

      <div className="relative shrink-0">
        <Avatar fullName={conversation.otherUser.fullName} id={conversation.otherUser.id} avatarUrl={conversation.otherUser.avatarUrl} size={46} />
        {online && <OnlineDot />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span
            className={`min-w-0 truncate text-[13px] leading-5 tracking-[-0.13px] sm:text-[14px] sm:tracking-[-0.14px] ${
              hasUnread ? "font-semibold text-[#0d2138]" : "font-medium text-[#1f2937]"
            }`}
            style={mont}
          >
            {conversation.otherUser.fullName ?? "Unnamed"}
          </span>

          <span className="shrink-0 text-[10px] font-normal tracking-[-0.11px] text-[#99a1af] sm:text-[11px]" style={mont}>
            {formatListTimestamp(conversation.lastMessageAt)}
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <p
            className={`min-w-0 truncate text-[11px] leading-4 tracking-[-0.11px] sm:text-[12px] sm:tracking-[-0.12px] ${
              hasUnread ? "font-medium text-[#2b3038]" : "font-normal text-[#99a1af]"
            }`}
            style={mont}
          >
            {conversation.lastMessagePreview || "No messages yet"}
          </p>

          {hasUnread && (
            <div className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#1e4f86] px-1">
              <span className="text-[10px] font-semibold text-white" style={mont}>
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            </div>
          )}
          {conversation.isStarred && !hasUnread && (
            <span className="shrink-0 text-[#f59e0b]" aria-label="Starred">
              ★
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
