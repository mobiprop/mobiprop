"use client";

import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";

import { updateLocalePreferences } from "@/features/profile/actions";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const LANGUAGE_OPTIONS = [
  {
    value: "en-US",
    label: "English",
  },
  {
    value: "es-AR",
    label: "Español",
  },
  {
    value: "pt-BR",
    label: "Português",
  },
];

const TIMEZONE_OPTIONS = [
  "America/Argentina/Buenos_Aires",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/Madrid",
];

const DATE_FORMAT_OPTIONS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
];

const selectClass =
  "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-[10px] border border-[#d1d5dc] bg-white pl-3.5 pr-10 text-[14px] text-[#0d2138] outline-none transition-all focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#6a7282]";

const labelClass =
  "text-[14px] font-medium leading-5 text-[#2b3038]";

type PreferencesTabProps = {
  profile: Profile;
};

export function PreferencesTab({
  profile,
}: PreferencesTabProps) {
  const initialPreferences =
    resolvePreferences(profile).locale;

  const [language, setLanguage] = useState(
    initialPreferences.language,
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
        setError(result.error);
        return;
      }

      setSuccess(true);
    } catch {
      setError(
        "Something went wrong while saving your preferences.",
      );
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
          General Preferences
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
            Language
          </label>

          <div className="relative min-w-0">
            <select
              id="preference-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                setSuccess(false);
              }}
              disabled={isSaving}
              className={selectClass}
              style={mont}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="preference-timezone"
            className={labelClass}
            style={mont}
          >
            Timezone
          </label>

          <div className="relative min-w-0">
            <select
              id="preference-timezone"
              value={timezone}
              onChange={(event) => {
                setTimezone(event.target.value);
                setSuccess(false);
              }}
              disabled={isSaving}
              className={selectClass}
              style={mont}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
            />
          </div>
        </div>

        {/* Date format */}
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="preference-date-format"
            className={labelClass}
            style={mont}
          >
            Date Format
          </label>

          <div className="relative min-w-0">
            <select
              id="preference-date-format"
              value={dateFormat}
              onChange={(event) => {
                setDateFormat(event.target.value);
                setSuccess(false);
              }}
              disabled={isSaving}
              className={selectClass}
              style={mont}
            >
              {DATE_FORMAT_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
            />
          </div>
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
          Preferences saved successfully.
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
            ? "Saving..."
            : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}