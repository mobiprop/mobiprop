import { useTranslation } from "react-i18next";
import { ArchiveRestore, Inbox, MessagesSquare, Plus, Search, SearchX } from "lucide-react";

import type { ConversationSummaryDto } from "@/features/messages/types/message-dto";
import type { MessageableStaff } from "@/hooks/queries/useMessagesQuery";
import { Avatar } from "./PresenceAvatar";
import { ConversationItem } from "./ConversationItem";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function ConversationListSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <div className="size-[46px] shrink-0 animate-pulse rounded-full bg-[#f1f3f6]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#f1f3f6]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-[#f1f3f6]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationSidebar({
  conversations,
  isLoading,
  filtered,
  activeConversationId,
  search,
  onSearchChange,
  showArchived,
  onToggleArchived,
  pickerOpen,
  onTogglePicker,
  staffDirectory,
  onStartConversation,
  onSelectConversation,
  hidden,
}: {
  conversations: ConversationSummaryDto[];
  isLoading: boolean;
  filtered: ConversationSummaryDto[];
  activeConversationId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  staffDirectory: MessageableStaff[];
  onStartConversation: (profileId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  hidden: boolean;
}) {
  const { t } = useTranslation("messages");
  return (
    <div
      className={`
        min-h-0 w-full shrink-0 flex-col
        border-[#e5e7eb] bg-white
        md:flex md:w-[300px] md:border-r
        lg:w-[340px]
        ${hidden ? "hidden" : "flex"}
      `}
    >
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-4 sm:px-5">
        <h2 className="text-[14px] font-semibold text-[#0d2138] sm:text-[15px]" style={poppins}>
          {showArchived ? t("sidebar.archived") : t("sidebar.inbox")}
        </h2>
        {!showArchived && conversations.length > 0 && (
          <span className="text-[11px] font-medium text-[#99a1af]" style={mont}>
            {t("sidebar.chatsCount", { count: conversations.length })}
          </span>
        )}
      </div>

      {/* Search + new conversation */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-3 sm:px-4">
        <div className="relative h-10 flex-1 sm:h-9">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99a1af]" />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("sidebar.searchPlaceholder")}
            aria-label={t("sidebar.searchAria")}
            className="
              h-full w-full rounded-[10px]
              border border-[#e5e7eb]
              bg-[#f8fafc]
              pl-9 pr-3
              text-[12px] font-medium
              text-[#0d2138]
              outline-none
              transition-colors
              placeholder:text-[#99a1af]
              focus:border-[#1e4f86]/40 focus:bg-white focus:ring-2 focus:ring-[#1e4f86]/15
            "
            style={mont}
          />
        </div>

        <button
          type="button"
          aria-label={pickerOpen ? t("sidebar.closePickerAria") : t("sidebar.startNewAria")}
          title={t("sidebar.startNewTitle")}
          onClick={onTogglePicker}
          className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 ${
            pickerOpen ? "bg-[#1e4f86] text-white" : "bg-[#f8fafc] text-[#6a7282] hover:bg-[#eef2f6]"
          }`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Archived filter toggle */}
      <div className="shrink-0 border-b border-[#e5e7eb] px-3 pb-3 sm:px-4">
        <button
          type="button"
          onClick={onToggleArchived}
          className="flex items-center gap-1.5 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#6a7282] transition-colors hover:bg-[#eef2f6] hover:text-[#0d2138] sm:text-[12px]"
          style={mont}
        >
          <ArchiveRestore size={13} />
          {showArchived ? t("sidebar.backToInbox") : t("sidebar.viewArchived")}
        </button>
      </div>

      {/* New conversation picker */}
      {pickerOpen ? (
        <div className="flex-1 overflow-y-auto">
          {staffDirectory.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-[12px] text-[#99a1af]" style={mont}>
                {t("sidebar.noStaffFound")}
              </p>
            </div>
          ) : (
            staffDirectory.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => onStartConversation(staff.id)}
                className="flex w-full items-center gap-3 border-b border-[#f3f4f6] px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f8fafc] sm:px-4"
              >
                <Avatar fullName={staff.fullName} id={staff.id} avatarUrl={staff.avatarUrl} size={40} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>
                    {staff.fullName ?? t("sidebar.unnamed")}
                  </span>
                  <span className="text-[11px] text-[#99a1af]" style={mont}>
                    {t(`dashboard:roles.${staff.role}`, { defaultValue: staff.role })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationListSkeleton />
          ) : (
            <>
              {filtered.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  onSelect={() => onSelectConversation(conversation.id)}
                />
              ))}

              {filtered.length === 0 && conversations.length > 0 && (
                <div className="flex h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#f8fafc]">
                    <SearchX size={20} className="text-[#99a1af]" />
                  </span>
                  <p className="text-[12px] font-medium text-[#0d2138]" style={mont}>
                    {t("sidebar.noMatches")}
                  </p>
                  <p className="text-[11px] text-[#99a1af]" style={mont}>
                    {t("sidebar.noMatchesHint")}
                  </p>
                </div>
              )}

              {conversations.length === 0 && (
                <div className="flex h-48 flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#f8fafc]">
                    {showArchived ? (
                      <Inbox size={20} className="text-[#99a1af]" />
                    ) : (
                      <MessagesSquare size={20} className="text-[#99a1af]" />
                    )}
                  </span>
                  <p className="text-[12px] font-medium text-[#0d2138]" style={mont}>
                    {showArchived ? t("sidebar.noArchivedChats") : t("sidebar.noConversations")}
                  </p>
                  <p className="text-[11px] text-[#99a1af]" style={mont}>
                    {showArchived ? t("sidebar.archivedHint") : t("sidebar.noConversationsHint")}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
