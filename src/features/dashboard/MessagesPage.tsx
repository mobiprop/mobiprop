"use client";

import { useState } from "react";
import { Search, Star, Archive, Trash2, MoreVertical, Paperclip, Smile, Send } from "lucide-react";

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
  sent: boolean; // true = our message (right, blue), false = theirs (left, gray)
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
    { id: 1, text: "Hello! I saw the listing for the property at La Plata. Is it still available?", time: "10:25 AM", sent: false },
    { id: 2, text: "Yes, it's still available! Would you like to schedule a viewing?", time: "10:25 AM", sent: true },
    { id: 3, text: "That would be great! I'm interested in seeing it this weekend if possible.", time: "10:25 AM", sent: false },
  ],
  2: [
    { id: 1, text: "Hi! I'd love to see the apartment in Palermo. Are there any slots available this week?", time: "9:10 AM", sent: false },
    { id: 2, text: "Of course! We have availability on Thursday at 3 PM or Friday at 11 AM.", time: "9:12 AM", sent: true },
    { id: 3, text: "When can we schedule a viewing?", time: "9:15 AM", sent: false },
  ],
  3: [
    { id: 1, text: "I just reviewed the contract you sent over. Everything looks good.", time: "Yesterday 2:00 PM", sent: false },
    { id: 2, text: "Great! Let me know if you have any questions before signing.", time: "Yesterday 2:05 PM", sent: true },
    { id: 3, text: "Thank you for the contract details", time: "Yesterday 2:10 PM", sent: false },
  ],
  4: [
    { id: 1, text: "Is the property still available?", time: "Yesterday 11:00 AM", sent: false },
    { id: 2, text: "Yes it is! It's been listed for 2 weeks and has attracted a lot of interest.", time: "Yesterday 11:30 AM", sent: true },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ initials, bg, size = 48 }: { initials: string; bg: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.3, ...mont }}
    >
      {initials}
    </div>
  );
}

function OnlineDot({ size = 12, borderSize = 2 }: { size?: number; borderSize?: number }) {
  return (
    <div
      className="absolute bg-[#00c950] border-white rounded-full shrink-0"
      style={{ width: size, height: size, borderWidth: borderSize, borderStyle: "solid", bottom: 0, right: 0 }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const [activeId, setActiveId] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const activeContact = CONTACTS.find((c) => c.id === activeId)!;
  const messages = MESSAGES_BY_CONTACT[activeId] ?? [];

  const filtered = CONTACTS.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-medium text-[#0d2138] leading-8 tracking-[-0.2px]" style={poppins}>
          Messages
        </h1>
        <p className="text-[14px] font-medium text-[#6a7282] tracking-[-0.14px]" style={mont}>
          Communicate with your clients and prospects
        </p>
      </div>

      {/* Chat container */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden flex" style={{ height: "calc(100vh - 230px)", minHeight: 600 }}>

        {/* ── Left: contact list ── */}
        <div className="w-[320px] shrink-0 border-r border-[#e5e7eb] flex flex-col">
          {/* Search */}
          <div className="px-4 py-[15px] border-b border-[#e5e7eb]">
            <div className="relative h-9">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99a1af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full h-9 pl-9 pr-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#0d2138] placeholder:text-[#99a1af] outline-none"
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
                  onClick={() => setActiveId(contact.id)}
                  className={`w-full h-[81px] px-4 flex items-center gap-3 border-b border-[#e5e7eb] last:border-b-0 text-left transition-colors hover:bg-[#f8fafc] ${
                    isActive ? "bg-[rgba(185,200,217,0.16)]" : ""
                  }`}
                >
                  {/* Avatar with online dot */}
                  <div className="relative shrink-0">
                    <Avatar initials={contact.initials} bg={contact.avatarBg} size={48} />
                    {contact.online && <OnlineDot />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[14px] leading-5 tracking-[-0.14px] ${contact.unread > 0 ? "font-semibold text-[#0d2138]" : "font-semibold text-[#1f2937]"}`}
                        style={mont}
                      >
                        {contact.name}
                      </span>
                      <span className="text-[12px] font-normal text-[#99a1af] tracking-[-0.12px] shrink-0" style={mont}>
                        {contact.time}
                      </span>
                    </div>
                    <p
                      className={`text-[12px] leading-4 tracking-[-0.12px] truncate ${contact.unread > 0 ? "font-semibold text-[#2b3038]" : "font-normal text-[#99a1af]"}`}
                      style={mont}
                    >
                      {contact.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {contact.unread > 0 && (
                    <div className="size-5 rounded-full bg-[#1e4f86] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-white" style={mont}>{contact.unread}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: chat area ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Chat header */}
          <div className="h-[66px] shrink-0 px-6 flex items-center justify-between border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar initials={activeContact.initials} bg={activeContact.avatarBg} size={40} />
                {activeContact.online && <OnlineDot size={10} />}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0d2138] leading-5 tracking-[-0.14px]" style={mont}>
                  {activeContact.name}
                </p>
                <p className="text-[12px] font-medium text-[#00c950] leading-4 tracking-[-0.12px]" style={mont}>
                  {activeContact.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-5">
              <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
                <Star size={20} />
              </button>
              <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
                <Archive size={20} />
              </button>
              <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
                <Trash2 size={20} />
              </button>
              <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-end gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[55%] ${msg.sent ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className="px-3 py-3 rounded-[12px]"
                  style={{
                    backgroundColor: msg.sent ? "#1e4f86" : "#f3f4f6",
                  }}
                >
                  <p
                    className="text-[12px] font-medium leading-4 tracking-[-0.12px] whitespace-pre-wrap"
                    style={{ color: msg.sent ? "#ffffff" : "#6a7282", ...mont }}
                  >
                    {msg.text}
                  </p>
                </div>
                <span className="text-[12px] font-normal text-[#99a1af] tracking-[-0.12px]" style={mont}>
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="shrink-0 border-t border-[#e5e7eb] p-6">
            <div className="flex items-center gap-2">
              {/* Input container */}
              <div className="flex-1 h-11 flex items-center gap-2 px-2 border border-[#e5e7eb] rounded-[12px]">
                <button type="button" className="size-[30px] flex items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors shrink-0">
                  <Paperclip size={16} />
                </button>
                <button type="button" className="size-[30px] flex items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors shrink-0">
                  <Smile size={16} />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 text-[12px] text-[#0d2138] placeholder:text-[#99a1af] bg-transparent outline-none"
                  style={poppins}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      setDraft("");
                    }
                  }}
                />
              </div>

              {/* Send button */}
              <button
                type="button"
                className="h-11 px-6 bg-[#1e4f86] text-white rounded-[12px] flex items-center gap-2 text-[14px] font-medium hover:bg-[#1b487a] transition-colors shrink-0"
                style={mont}
                onClick={() => setDraft("")}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
