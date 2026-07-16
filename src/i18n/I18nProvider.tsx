"use client";

import { useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";

import i18nextSingleton, { setActiveI18nInstance } from "./client";
import { LANGUAGE_STORAGE_KEY, setLanguageCookie, type SupportedLanguage } from "./config";

/**
 * `initialLanguage` is resolved server-side (from the language cookie, see
 * `src/app/layout.tsx`) and passed in as a prop. Rather than mutating the
 * shared `i18next` singleton's language during render (impure — disallowed
 * by React Compiler, and unsafe under SSR since the singleton module is
 * reused across concurrent requests on the server), each mount gets its own
 * `cloneInstance` seeded with `initialLanguage`. That keeps the server's
 * first render and the client's first render requesting the SAME language,
 * eliminating the hydration mismatches that occurred when the server always
 * rendered `DEFAULT_LANGUAGE` while a returning visitor's browser had
 * already switched languages (previously tracked only in localStorage,
 * which the server has no access to).
 */
export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: SupportedLanguage;
}) {
  const i18n = useMemo(
    () => i18nextSingleton.cloneInstance({ lng: initialLanguage }),
    [initialLanguage],
  );

  useEffect(() => {
    setActiveI18nInstance(i18n);
    document.documentElement.lang = i18n.language;

    const onLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      setLanguageCookie(lng as SupportedLanguage);
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => i18n.off("languageChanged", onLanguageChanged);
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
