import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "./config";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enFooter from "./locales/en/footer.json";
import enHome from "./locales/en/home.json";
import enFaq from "./locales/en/faq.json";
import enListings from "./locales/en/listings.json";
import enListingDetail from "./locales/en/listingDetail.json";
import enBlog from "./locales/en/blog.json";
import enAbout from "./locales/en/about.json";
import enContact from "./locales/en/contact.json";

import esCommon from "./locales/es/common.json";
import esNavigation from "./locales/es/navigation.json";
import esFooter from "./locales/es/footer.json";
import esHome from "./locales/es/home.json";
import esFaq from "./locales/es/faq.json";
import esListings from "./locales/es/listings.json";
import esListingDetail from "./locales/es/listingDetail.json";
import esBlog from "./locales/es/blog.json";
import esAbout from "./locales/es/about.json";
import esContact from "./locales/es/contact.json";

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    footer: enFooter,
    home: enHome,
    faq: enFaq,
    listings: enListings,
    listingDetail: enListingDetail,
    blog: enBlog,
    about: enAbout,
    contact: enContact,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    footer: esFooter,
    home: esHome,
    faq: esFaq,
    listings: esListings,
    listingDetail: esListingDetail,
    blog: esBlog,
    about: esAbout,
    contact: esContact,
  },
};

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: "es",
    ns: ["common", "navigation", "footer", "home", "faq", "listings", "listingDetail", "blog", "about", "contact"],
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
 * Each page mount renders through its own cloned i18next instance (see
 * `I18nProvider`), not this shared singleton directly, so language changes
 * need to be applied to whichever clone is actually driving the current
 * page's React tree. `I18nProvider` registers itself here on mount.
 */
let activeInstance: typeof i18next = i18next;

export function setActiveI18nInstance(instance: typeof i18next): void {
  activeInstance = instance;
}

/**
 * Maps an account locale preference (e.g. "es-AR", "en-US", "pt-BR") to one of
 * the site's supported languages and applies it immediately — used so saving
 * a language preference in Settings/Edit Profile is reflected on the public
 * site right away, matching the header LanguageSwitcher's own behavior.
 * Persisting to localStorage + the language cookie happens centrally in
 * I18nProvider's `languageChanged` listener.
 */
export function syncSiteLanguageFromPreference(preference: string): void {
  const base = preference.split("-")[0];
  const match = SUPPORTED_LANGUAGES.find((lang) => lang === base);
  const lang: SupportedLanguage = match ?? DEFAULT_LANGUAGE;
  activeInstance.changeLanguage(lang);
}

export default i18next;
