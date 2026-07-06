"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

import { formatBubbleTimestamp } from "@/features/messages/lib/format";
import type { MessageDto } from "@/features/messages/types/message-dto";
import { AttachmentCard } from "./AttachmentCard";
import { Avatar } from "./PresenceAvatar";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export function MessageBubble({
  message,
  isOwn,
  isGroupStart,
  isGroupEnd,
  otherFullName,
  otherAvatarUrl,
  onDelete,
  onPreviewAttachment,
}: {
  message: MessageDto;
  isOwn: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  otherFullName: string | null;
  otherAvatarUrl: string | null;
  onDelete: (messageId: string) => void;
  onPreviewAttachment: (attachmentId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or unavailable — no-op, button just won't confirm.
    }
  };

  return (
    <div
      className={`animate-message-in group flex max-w-[85%] items-end gap-2 sm:max-w-[70%] lg:max-w-[55%] ${
        isOwn ? "self-end" : "self-start"
      } ${isGroupStart ? "mt-2" : "mt-0.5"}`}
    >
      {/* Small avatar on incoming messages, only at the start of a group; a
          fixed-width spacer keeps continuation bubbles aligned underneath. */}
      {!isOwn && (
        <div className="w-6 shrink-0 self-end">
          {isGroupEnd && <Avatar fullName={otherFullName} id={message.senderId} avatarUrl={otherAvatarUrl} size={24} />}
        </div>
      )}

      {/* Hover actions */}
      <div className={`flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? "order-1" : "order-2"}`}>
        {message.body.length > 0 && (
          <button
            type="button"
            aria-label={copied ? "Copied" : "Copy message text"}
            title={copied ? "Copied" : "Copy message text"}
            onClick={handleCopy}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#99a1af] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            {copied ? <Check size={13} className="text-[#00c950]" /> : <Copy size={13} />}
          </button>
        )}
        {isOwn && (
          <button
            type="button"
            aria-label="Delete this message"
            title="Delete this message"
            onClick={() => onDelete(message.id)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#99a1af] transition-colors hover:bg-red-50 hover:text-[#e7000b]"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className={`order-1 flex min-w-0 flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {/* One bubble per message — attachments and text share the same
            background/rounding instead of stacking as separate cards. */}
        <div
          className="flex min-w-0 flex-col gap-2 px-3 py-2.5 shadow-[0_1px_2px_rgba(13,33,56,0.06)] sm:py-3"
          style={{
            backgroundColor: isOwn ? "#1e4f86" : "#ffffff",
            border: isOwn ? "none" : "1px solid #eef0f3",
            borderRadius: 14,
            borderBottomRightRadius: isOwn && !isGroupEnd ? 6 : 14,
            borderTopRightRadius: isOwn && !isGroupStart ? 6 : 14,
            borderBottomLeftRadius: !isOwn && !isGroupEnd ? 6 : 14,
            borderTopLeftRadius: !isOwn && !isGroupStart ? 6 : 14,
          }}
        >
          {message.attachments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {message.attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  isOwn={isOwn}
                  onPreview={() => onPreviewAttachment(attachment.id)}
                />
              ))}
            </div>
          )}

          {message.body.length > 0 && (
            <p
              className="whitespace-pre-wrap break-words text-[12px] font-medium leading-5 tracking-[-0.12px] sm:text-[13px]"
              style={{ color: isOwn ? "#ffffff" : "#374151", ...mont }}
            >
              {message.body}
            </p>
          )}
        </div>

        {isGroupEnd && (
          <span className="text-[10px] font-normal tracking-[-0.1px] text-[#99a1af] sm:text-[11px]" style={mont}>
            {formatBubbleTimestamp(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
