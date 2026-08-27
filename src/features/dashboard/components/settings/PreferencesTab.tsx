"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";

import { updateLocalePreferences } from "@/features/profile/actions";
import { translateProfileError } from "@/features/profile/error-codes";
import { resolvePreferences } from "@/features/profile/preferences";
import { syncSiteLanguageFromPreference } from "@/i18n/client";
import { isSupportedLanguage } from "@/i18n/config";
import type { Profile } from "@/generated/prisma/client";
import { SearchableSelect } from "../SearchableSelect";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const TIMEZONE_OPTIONS = [
  "America/Argentina/Buenos_Aires",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/Madrid",
].map((value) => ({ value, label: value }));

const DATE_FORMAT_OPTIONS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
].map((value) => ({ value, label: value }));

const labelClass =
  "text-[14px] font-medium leading-5 text-[#2b3038]";

type PreferencesTabProps = {
  profile: Profile;
};

export function PreferencesTab({
  profile,
}: PreferencesTabProps) {
  const { t, i18n } = useTranslation("dashboardSettings");
  const initialPreferences =
    resolvePreferences(profile).locale;

  // The dashboard's actual displayed language is driven by the cookie-backed
  // i18n instance (see I18nProvider), not the saved DB preference — those two
  // can drift apart (e.g. a never-saved default, or a switch via the navbar
  // toggle that doesn't persist to the profile). Seed the dropdown from what
  // is actually on screen so it never contradicts the UI around it.
  const [language, setLanguage] = useState(
    isSupportedLanguage(i18n.language) ? i18n.language : initialPreferences.language,
  );

  const [timezone, setTimezone] = useState(
    initialPreferences.timezone,
  );

  const [dateFormat, setDateFormat] = useState(
    initialPreferences.dateFormat,
  );

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateLocalePreferences({
        ...initialPreferences,
        language,
        timezone,
        dateFormat,
      });

      if ("error" in result) {
        setError(translateProfileError(result.error, t));
        return;
      }

      syncSiteLanguageFromPreference(language);
      setSuccess(true);
    } catch {
      setError(t("preferences.error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* Heading */}
      <div>
        <h2
          className="text-[14px] font-semibold leading-7 text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          {t("preferences.heading")}
        </h2>

      </div>

      {/* Preferences form */}
      <div className="mt-6 flex w-full max-w-[560px] min-w-0 flex-col gap-5">
        {/* Language */}
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="preference-language"
            className={labelClass}
            style={mont}
          >
            {t("preferences.languageLabel")}
          </label>

          <SearchableSelect
            id="preference-language"
            searchable={false}
            value={language}
            onChange={(next) => {
              setLanguage(next);
              setSuccess(false);
            }}
            disabled={isSaving}
            options={LANGUAGE_OPTIONS}
            placeholder={t("preferences.languagePlaceholder")}
          />
        </div>

        {/* Timezone */}
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="preference-timezone"
            className={labelClass}
            style={mont}
          >
            {t("preferences.timezoneLabel")}
          </label>

          <SearchableSelect
            id="preference-timezone"
            searchable={false}
            value={timezone}
            onChange={(next) => {
              setTimezone(next);
              setSuccess(false);
            }}
            disabled={isSaving}
            options={TIMEZONE_OPTIONS}
            placeholder={t("preferences.timezonePlaceholder")}
          />
        </div>

        {/* Date format */}
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="preference-date-format"
            className={labelClass}
            style={mont}
          >
            {t("preferences.dateFormatLabel")}
          </label>

          <SearchableSelect
            id="preference-date-format"
            searchable={false}
            value={dateFormat}
            onChange={(next) => {
              setDateFormat(next);
              setSuccess(false);
            }}
            disabled={isSaving}
            options={DATE_FORMAT_OPTIONS}
            placeholder={t("preferences.dateFormatPlaceholder")}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 max-w-[560px] rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] leading-5 text-[#dc2626]"
          style={mont}
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 max-w-[560px] rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] leading-5 text-[#008236]"
          style={mont}
        >
          {t("preferences.success")}
        </div>
      )}

      {/* Save button */}
      <div className="mt-6 flex max-w-[560px] border-t border-[#e5e7eb] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={mont}
        >
          <Save size={16} className="shrink-0" />

          {isSaving
            ? t("preferences.saving")
            : t("preferences.savePreferences")}
        </button>
      </div>
    </div>
  );
}