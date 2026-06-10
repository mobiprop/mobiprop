"use client";

import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";

import { updateLocalePreferences } from "@/features/profile/actions";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English" },
  { value: "es-AR", label: "Español" },
  { value: "pt-BR", label: "Português" },
];

const TIMEZONE_OPTIONS = [
  "America/Argentina/Buenos_Aires",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/Madrid",
];

const DATE_FORMAT_OPTIONS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

const selectClass =
  "w-full h-9 pl-3 pr-9 bg-white border border-[#d1d5dc] rounded-[10px] text-[12px] text-[#0a0a0a] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer";

const labelClass = "text-[12px] font-medium text-[#2b3038]";

type PreferencesTabProps = {
  profile: Profile;
};

export function PreferencesTab({ profile }: PreferencesTabProps) {
  const initial = resolvePreferences(profile).locale;
  const [language, setLanguage] = useState(initial.language);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [dateFormat, setDateFormat] = useState(initial.dateFormat);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateLocalePreferences({ ...initial, language, timezone, dateFormat });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong while saving your preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>General Preferences</p>

      <div className="flex flex-col gap-4 max-w-[480px]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={mont}>Language</label>
          <div className="relative">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass} style={mont}>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={mont}>Timezone</label>
          <div className="relative">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass} style={mont}>
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={mont}>Date Format</label>
          <div className="relative">
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className={selectClass} style={mont}>
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}
      {success && <p className="text-[12px] text-[#10b981]" style={mont}>Preferences saved.</p>}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-9 px-4 inline-flex items-center gap-2 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
          style={mont}
        >
          <Save size={14} />
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
