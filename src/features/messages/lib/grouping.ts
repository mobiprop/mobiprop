import type { MessageDto } from "@/features/messages/types/message-dto";
import { formatDateSeparator } from "./format";

// Consecutive same-sender messages within this window collapse into one
// visual group (single timestamp, tighter spacing) — mirrors how most chat
// apps avoid repeating sender chrome for a rapid back-to-back burst.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageListItem =
  | { type: "date"; key: string; label: string }
  | { type: "message"; key: string; message: MessageDto; isGroupStart: boolean; isGroupEnd: boolean };

/** Inserts day separators and marks each message's position within its send-burst group. */
export function buildMessageListItems(messages: MessageDto[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let prev: MessageDto | null = null;
  let lastDateKey: string | null = null;

  messages.forEach((message, index) => {
    const createdAt = new Date(message.createdAt);
    const dateKey = createdAt.toDateString();

    if (dateKey !== lastDateKey) {
      items.push({ type: "date", key: `date-${dateKey}`, label: formatDateSeparator(message.createdAt) });
      lastDateKey = dateKey;
      prev = null; // a day boundary always breaks a group
    }

    const isGroupStart =
      !prev ||
      prev.senderId !== message.senderId ||
      createdAt.getTime() - new Date(prev.createdAt).getTime() > GROUP_WINDOW_MS;

    const next = messages[index + 1];
    const isGroupEnd =
      !next ||
      next.senderId !== message.senderId ||
      dateKey !== new Date(next.createdAt).toDateString() ||
      new Date(next.createdAt).getTime() - createdAt.getTime() > GROUP_WINDOW_MS;

    items.push({ type: "message", key: message.id, message, isGroupStart, isGroupEnd });
    prev = message;
  });

  return items;
}
