"use client";

import { useState } from "react";
import {
  Archive,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  Star,
  Trash2,
  ImageIcon,
} from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type Contact = {
  id: number;
  name: string;
  initials: string;
  avatarBg: string;
  online: boolean;
  time: string;
  lastMessage: string;
  unread: number;
};

type Message = {
  id: number;
  text: string;
  time: string;
  sent: boolean;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  {
    id: 1,
    name: "Thomas Fletcher",
    initials: "TF",
    avatarBg: "#3b82f6",
    online: true,
    time: "10:30 AM",
    lastMessage: "I'm interested in the property at La Plata",
    unread: 2,
  },
  {
    id: 2,
    name: "Sarah Williams",
    initials: "SW",
    avatarBg: "#ef4444",
    online: true,
    time: "9:15 AM",
    lastMessage: "When can we schedule a viewing?",
    unread: 0,
  },
  {
    id: 3,
    name: "David Martinez",
    initials: "DM",
    avatarBg: "#8b5cf6",
    online: false,
    time: "Yesterday",
    lastMessage: "Thank you for the contract details",
    unread: 0,
  },
  {
    id: 4,
    name: "Emma Johnson",
    initials: "EJ",
    avatarBg: "#f59e0b",
    online: true,
    time: "Yesterday",
    lastMessage: "Is the property still available?",
    unread: 1,
  },
];

const MESSAGES_BY_CONTACT: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      text: "Hello! I saw the listing for the property at La Plata. Is it still available?",
      time: "10:25 AM",
      sent: false,
    },
    {
      id: 2,
      text: "Yes, it's still available! Would you like to schedule a viewing?",
      time: "10:25 AM",
      sent: true,
    },
    {
      id: 3,
      text: "That would be great! I'm interested in seeing it this weekend if possible.",
      time: "10:25 AM",
      sent: false,
    },
  ],
  2: [
    {
      id: 1,
      text: "Hi! I'd love to see the apartment in Palermo. Are there any slots available this week?",
      time: "9:10 AM",
      sent: false,
    },
    {
      id: 2,
      text: "Of course! We have availability on Thursday at 3 PM or Friday at 11 AM.",
      time: "9:12 AM",
      sent: true,
    },
    {
      id: 3,
      text: "When can we schedule a viewing?",
      time: "9:15 AM",
      sent: false,
    },
  ],
  3: [
    {
      id: 1,
      text: "I just reviewed the contract you sent over. Everything looks good.",
      time: "Yesterday 2:00 PM",
      sent: false,
    },
    {
      id: 2,
      text: "Great! Let me know if you have any questions before signing.",
      time: "Yesterday 2:05 PM",
      sent: true,
    },
    {
      id: 3,
      text: "Thank you for the contract details",
      time: "Yesterday 2:10 PM",
      sent: false,
    },
  ],
  4: [
    {
      id: 1,
      text: "Is the property still available?",
      time: "Yesterday 11:00 AM",
      sent: false,
    },
    {
      id: 2,
      text: "Yes it is! It's been listed for 2 weeks and has attracted a lot of interest.",
      time: "Yesterday 11:30 AM",
      sent: true,
    },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({
  initials,
  bg,
  size = 48,
}: {
  initials: string;
  bg: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: size * 0.3,
        ...mont,
      }}
    >
      {initials}
    </div>
  );
}

function OnlineDot({
  size = 12,
  borderSize = 2,
}: {
  size?: number;
  borderSize?: number;
}) {
  return (
    <div
      className="absolute shrink-0 rounded-full border-white bg-[#00c950]"
      style={{
        width: size,
        height: size,
        borderWidth: borderSize,
        borderStyle: "solid",
        bottom: 0,
        right: 0,
      }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const [activeId, setActiveId] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const activeContact = CONTACTS.find(
    (contact) => contact.id === activeId,
  )!;

  const messages = MESSAGES_BY_CONTACT[activeId] ?? [];

  const filtered = CONTACTS.filter(
    (contact) =>
      !search ||
      contact.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectContact = (contactId: number) => {
    setActiveId(contactId);
    setMobileChatOpen(true);
  };

  const handleSendMessage = () => {
    if (!draft.trim()) return;

    setDraft("");
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

        <p
          className="text-[12px] font-medium leading-5 tracking-[-0.12px] text-[#6a7282] sm:text-[14px] sm:tracking-[-0.14px]"
          style={mont}
        >
          Communicate with your clients and prospects
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
          {/* Search */}
          <div className="shrink-0 border-b border-[#e5e7eb] px-3 py-3 sm:px-4 sm:py-[15px]">
            <div className="relative h-10 sm:h-9">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
              />

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
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((contact) => {
              const isActive = contact.id === activeId;

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact.id)}
                  className={`
                    flex min-h-[76px] w-full
                    items-center gap-3
                    border-b border-[#e5e7eb]
                    px-3 py-3 text-left
                    transition-colors
                    last:border-b-0
                    hover:bg-[#f8fafc]

                    sm:min-h-[81px] sm:px-4

                    ${
                      isActive
                        ? "bg-[rgba(185,200,217,0.16)]"
                        : ""
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="sm:hidden">
                      <Avatar
                        initials={contact.initials}
                        bg={contact.avatarBg}
                        size={44}
                      />
                    </div>

                    <div className="hidden sm:block">
                      <Avatar
                        initials={contact.initials}
                        bg={contact.avatarBg}
                        size={48}
                      />
                    </div>

                    {contact.online && <OnlineDot />}
                  </div>

                  {/* Contact text */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span
                        className={`
                          min-w-0 truncate
                          text-[13px] font-semibold
                          leading-5 tracking-[-0.13px]
                          sm:text-[14px] sm:tracking-[-0.14px]

                          ${
                            contact.unread > 0
                              ? "text-[#0d2138]"
                              : "text-[#1f2937]"
                          }
                        `}
                        style={mont}
                      >
                        {contact.name}
                      </span>

                      <span
                        className="
                          shrink-0
                          text-[11px] font-normal
                          tracking-[-0.11px]
                          text-[#99a1af]
                          sm:text-[12px]
                          sm:tracking-[-0.12px]
                        "
                        style={mont}
                      >
                        {contact.time}
                      </span>
                    </div>

                    <p
                      className={`
                        truncate
                        text-[11px] leading-4
                        tracking-[-0.11px]
                        sm:text-[12px]
                        sm:tracking-[-0.12px]

                        ${
                          contact.unread > 0
                            ? "font-semibold text-[#2b3038]"
                            : "font-normal text-[#99a1af]"
                        }
                      `}
                      style={mont}
                    >
                      {contact.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {contact.unread > 0 && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86]">
                      <span
                        className="text-[10px] font-semibold text-white"
                        style={mont}
                      >
                        {contact.unread}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex h-40 items-center justify-center px-4">
                <p
                  className="text-center text-[12px] text-[#99a1af]"
                  style={mont}
                >
                  No messages found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: chat area */}
        <div
          className={`
            min-w-0 flex-1 flex-col
            md:flex

            ${mobileChatOpen ? "flex" : "hidden"}
          `}
        >
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
                  initials={activeContact.initials}
                  bg={activeContact.avatarBg}
                  size={40}
                />

                {activeContact.online && <OnlineDot size={10} />}
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-[13px] font-semibold
                    leading-5 tracking-[-0.13px]
                    text-[#0d2138]
                    sm:text-[14px]
                    sm:tracking-[-0.14px]
                  "
                  style={mont}
                >
                  {activeContact.name}
                </p>

                <p
                  className={`
                    text-[11px] font-medium
                    leading-4 tracking-[-0.11px]
                    sm:text-[12px]
                    sm:tracking-[-0.12px]

                    ${
                      activeContact.online
                        ? "text-[#00c950]"
                        : "text-[#99a1af]"
                    }
                  `}
                  style={mont}
                >
                  {activeContact.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Action icons */}
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-5">
              <button
                type="button"
                aria-label="Star conversation"
                className="
                  hidden size-9 items-center justify-center
                  rounded-[9px]
                  text-[#6a7282]
                  transition-colors
                  hover:bg-[#f3f4f6]
                  hover:text-[#0d2138]
                  sm:flex
                  lg:size-auto
                "
              >
                <Star size={20} />
              </button>

              <button
                type="button"
                aria-label="Archive conversation"
                className="
                  hidden size-9 items-center justify-center
                  rounded-[9px]
                  text-[#6a7282]
                  transition-colors
                  hover:bg-[#f3f4f6]
                  hover:text-[#0d2138]
                  sm:flex
                  lg:size-auto
                "
              >
                <Archive size={20} />
              </button>

              <button
                type="button"
                aria-label="Delete conversation"
                className="
                  hidden size-9 items-center justify-center
                  rounded-[9px]
                  text-[#6a7282]
                  transition-colors
                  hover:bg-red-50
                  hover:text-[#e7000b]
                  lg:flex lg:size-auto
                "
              >
                <Trash2 size={20} />
              </button>

              <button
                type="button"
                aria-label="More conversation options"
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
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="
              flex flex-1 flex-col justify-end
              gap-3 overflow-y-auto
              px-3 py-4
              sm:gap-4 sm:px-5
              lg:px-6
            "
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`
                  flex max-w-[85%] flex-col gap-1
                  sm:max-w-[70%]
                  lg:max-w-[55%]

                  ${
                    message.sent
                      ? "self-end items-end"
                      : "self-start items-start"
                  }
                `}
              >
                <div
                  className="rounded-[12px] px-3 py-2.5 sm:py-3"
                  style={{
                    backgroundColor: message.sent
                      ? "#1e4f86"
                      : "#f3f4f6",
                  }}
                >
                  <p
                    className="
                      whitespace-pre-wrap break-words
                      text-[12px] font-medium
                      leading-4 tracking-[-0.12px]
                    "
                    style={{
                      color: message.sent ? "#ffffff" : "#6a7282",
                      ...mont,
                    }}
                  >
                    {message.text}
                  </p>
                </div>

                <span
                  className="
                    text-[10px] font-normal
                    tracking-[-0.1px]
                    text-[#99a1af]
                    sm:text-[12px]
                    sm:tracking-[-0.12px]
                  "
                  style={mont}
                >
                  {message.time}
                </span>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="shrink-0 border-t border-[#e5e7eb] p-3 sm:p-4 lg:p-6">
  <div className="flex items-center gap-2">
    {/* Message input */}
    <div
      className="
        flex h-11 min-w-0 flex-1
        items-center
        rounded-[12px]
        border border-[#dfe3e8]
        bg-white
        px-2
        sm:px-3
      "
    >
      <button
        type="button"
        aria-label="Attach file"
        className="
          flex size-8 shrink-0
          items-center justify-center
          rounded-[8px]
          text-[#6a7282]
          transition-colors
          hover:bg-[#f3f4f6]
        "
      >
        <Paperclip size={17} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        aria-label="Attach image"
        className="
          flex size-8 shrink-0
          items-center justify-center
          rounded-[8px]
          text-[#6a7282]
          transition-colors
          hover:bg-[#f3f4f6]
        "
      >
        <ImageIcon size={17} strokeWidth={1.8} />
      </button>

      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Type your message..."
        className="
          min-w-0 flex-1
          bg-transparent
          px-2
          text-[12px] text-[#0d2138]
          outline-none
          placeholder:text-[#99a1af]
          sm:text-[13px]
        "
        style={poppins}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
          }
        }}
      />

      <button
        type="button"
        aria-label="Add emoji"
        className="
          flex size-8 shrink-0
          items-center justify-center
          rounded-[8px]
          text-[#6a7282]
          transition-colors
          hover:bg-[#f3f4f6]
        "
      >
        <Smile size={17} strokeWidth={1.8} />
      </button>
    </div>

    {/* Send button */}
    <button
      type="button"
      disabled={!draft.trim()}
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

      <span className="hidden text-[14px] font-semibold sm:inline">
        Send
      </span>
    </button>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}