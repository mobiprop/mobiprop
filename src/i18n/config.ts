export const SUPPORTED_LANGUAGES = ["es", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "es";
export const LANGUAGE_STORAGE_KEY = "ulrich-lang";
/** Same name as the localStorage key, but this one is also sent with every
 * request, so the server can render in the visitor's saved language on the
 * very first paint instead of always defaulting to `DEFAULT_LANGUAGE` and
 * correcting client-side after hydration (which is what caused the
 * hydration-mismatch warnings on pages loaded after switching languages). */
export const LANGUAGE_COOKIE_NAME = "ulrich-lang";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Sets the language cookie from client code (browser only). 1-year expiry, site-wide. */
export function setLanguageCookie(lang: SupportedLanguage): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}
