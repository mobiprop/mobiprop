"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, CheckCircle2, Loader2 } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type GoogleCalendarManageModalProps = {
  email: string | null;
  onClose: () => void;
  onDisconnect: () => Promise<void>;
};

export function GoogleCalendarManageModal({ email, onClose, onDisconnect }: GoogleCalendarManageModalProps) {
  const { t } = useTranslation("integrations");
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      onClose();
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-calendar-modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p id="google-calendar-modal-title" className="text-[15px] font-semibold text-[#1f2937] sm:text-[16px]" style={mont}>
              {t("googleCalendarModal.title")}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("googleCalendarModal.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-[14px] border border-[#d1fae5] bg-[#ecfdf5] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#10b981] sm:size-10">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#047857] sm:text-[14px]" style={mont}>
                  {t("googleCalendarModal.connected")}
                </p>
                <p className="truncate text-[12px] text-[#059669]" style={mont}>
                  {email ?? t("googleCalendarModal.connectedAccountFallback")}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[12px] leading-5 text-[#6a7282]" style={mont}>
            {t("googleCalendarModal.description")}
          </p>
        </div>

        <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-4 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#fca5a5] px-5 text-[12px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={mont}
          >
            {isDisconnecting && <Loader2 size={14} className="animate-spin" />}
            {t("googleCalendarModal.disconnect")}
          </button>
        </div>
      </div>
    </div>
  );
}
