import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from "./config";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enFooter from "./locales/en/footer.json";
import enHome from "./locales/en/home.json";
import enFaq from "./locales/en/faq.json";

import esCommon from "./locales/es/common.json";
import esNavigation from "./locales/es/navigation.json";
import esFooter from "./locales/es/footer.json";
import esHome from "./locales/es/home.json";
import esFaq from "./locales/es/faq.json";

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    footer: enFooter,
    home: enHome,
    faq: enFaq,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    footer: esFooter,
    home: esHome,
    faq: esFaq,
  },
};

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: "es",
    ns: ["common", "navigation", "footer", "home", "faq"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    saveMissing: process.env.NODE_ENV === "development",
    missingKeyHandler:
      process.env.NODE_ENV === "development"
        ? (langs, ns, key) => {
            console.warn(`[i18n] Missing translation: ${langs.join(",")}:${ns}:${key}`);
          }
        : undefined,
  });
}

/**
 * Maps an account locale preference (e.g. "es-AR", "en-US", "pt-BR") to one of
 * the site's supported languages and applies it immediately — used so saving
 * a language preference in Settings/Edit Profile is reflected on the public
 * site right away, matching the header LanguageSwitcher's own behavior.
 */
export function syncSiteLanguageFromPreference(preference: string): void {
  const base = preference.split("-")[0];
  const match = SUPPORTED_LANGUAGES.find((lang) => lang === base);
  const lang: SupportedLanguage = match ?? DEFAULT_LANGUAGE;
  i18next.changeLanguage(lang);
  if (typeof window !== "undefined") window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18next;
