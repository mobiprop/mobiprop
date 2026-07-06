import { AlertTriangle } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

// Soft "delete for me" only — the other participant keeps their full copy of
// the conversation, nothing is permanently destroyed. Mirrors ContactsPage's
// DeleteConfirmModal styling/structure.
export function DeleteConversationConfirmModal({
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
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-conversation-title"
        className="relative w-full max-w-[420px] rounded-[16px] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#fff1f2]">
            <AlertTriangle size={22} className="text-[#fb2c36]" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p id="delete-conversation-title" className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
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
