"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginPromptModal({ open, onClose }: LoginPromptModalProps) {
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white px-8 py-8 shadow-xl"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6a7282] hover:bg-[#f3f4f6]"
          aria-label={t("loginPrompt.close")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Heart icon */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f0]">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M27.2 5.87a7.6 7.6 0 0 0-10.74 0L16 6.33l-.46-.46A7.6 7.6 0 0 0 4.8 16.61l.46.46L16 27.8l10.74-10.73.46-.46a7.6 7.6 0 0 0 0-10.74Z"
                fill="#e74c3c"
              />
            </svg>
          </div>
        </div>

        <h2
          className="mb-2 text-center text-[20px] font-semibold text-[#0d2138]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t("loginPrompt.title")}
        </h2>
        <p className="mb-7 text-center text-[14px] leading-[22px] text-[#6a7282]">
          {t("loginPrompt.description")}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-[#1a4878] py-3 text-center text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            onClick={onClose}
          >
            {t("loginPrompt.logIn")}
          </Link>
          <Link
            href="/register"
            className="block w-full rounded-xl border border-[#e5e7eb] py-3 text-center text-[15px] font-medium text-[#0d2138] transition-colors hover:bg-[#f9fafb]"
            onClick={onClose}
          >
            {t("loginPrompt.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
