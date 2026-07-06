import { MessageCircle, MessagesSquare } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

export function EmptyChatState({ variant }: { variant: "no-conversation" | "no-messages" }) {
  const isNoConversation = variant === "no-conversation";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#fbfcfe] px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#eaf0f8]">
        {isNoConversation ? (
          <MessagesSquare size={28} className="text-[#1e4f86]" />
        ) : (
          <MessageCircle size={28} className="text-[#1e4f86]" />
        )}
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-[#0d2138] sm:text-[15px]" style={poppins}>
          {isNoConversation ? "Select a conversation" : "Say hello"}
        </p>
        <p className="max-w-[280px] text-[12px] leading-5 text-[#6a7282] sm:text-[13px]" style={mont}>
          {isNoConversation
            ? "Pick someone from your inbox on the left, or start a new conversation."
            : "No messages yet — send the first one to get things started."}
        </p>
      </div>
    </div>
  );
}
