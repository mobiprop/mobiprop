"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import i18next from "./client";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, isSupportedLanguage } from "./config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const lang = isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
    if (lang !== i18next.language) i18next.changeLanguage(lang);
    document.documentElement.lang = lang;

    const onLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18next.on("languageChanged", onLanguageChanged);
    return () => i18next.off("languageChanged", onLanguageChanged);
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
