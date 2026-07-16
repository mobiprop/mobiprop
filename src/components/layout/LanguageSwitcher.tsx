"use client";

import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = (i18n.language as SupportedLanguage) ?? "es";

  function switchTo(lang: SupportedLanguage) {
    if (lang === current) return;
    // Persisting to localStorage + the language cookie happens centrally in
    // I18nProvider's `languageChanged` listener, covering every trigger
    // (this switcher, Settings, Edit Profile) from one place.
    i18n.changeLanguage(lang);
  }

  return (
    <div
      className={`flex items-center rounded-full border border-[#e5e7eb] bg-white p-0.5 text-[13px] font-medium ${className}`}
      style={{ fontFamily: "Poppins, sans-serif" }}
      role="group"
      aria-label="Language selector"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => switchTo(lang)}
          aria-pressed={current === lang}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            current === lang
              ? "bg-[#1f5b97] text-white"
              : "text-[#5e5e5e] hover:text-[#232323]"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
