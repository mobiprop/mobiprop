"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Check } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type LeadFilterValues = {
  statuses: string[];
  sources: string[];
  minBudget: string;
  maxBudget: string;
  scoreQuality: string;
};

// Displayed labels are translated via the *_I18N_KEY maps below; these
// values stay in stable English because they're compared against directly
// in component state.
const STATUSES = ["Cold", "Won", "In Progress", "Lost"];
const STATUS_I18N_KEY: Record<string, string> = {
  Cold: "statusBadge.cold",
  Won: "statusBadge.won",
  "In Progress": "statusBadge.inProgress",
  Lost: "statusBadge.lost",
};

const SOURCES = ["Zonaprop", "Website", "Whatsapp", "Campaign"];
const SOURCE_I18N_KEY: Record<string, string> = {
  Zonaprop: "filterModal.sourceOptions.zonaprop",
  Website: "filterModal.sourceOptions.website",
  Whatsapp: "filterModal.sourceOptions.whatsapp",
  Campaign: "filterModal.sourceOptions.campaign",
};

const SCORE_QUALITY = ["All", ">75%", ">50%", "<25%"];
const SCORE_QUALITY_I18N_KEY: Record<string, string> = {
  All: "filterModal.scoreQualityOptions.all",
};

type LeadFilterModalProps = {
  resultCount: number;
  onApply: (filters: LeadFilterValues) => void;
  onClose: () => void;
};

function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2.5" style={mont}>
      <span
        className={`size-[18px] rounded-[5px] border flex items-center justify-center transition-colors ${
          checked ? "bg-[#1e4f86] border-[#1e4f86]" : "bg-white border-[#d0d0d0]"
        }`}
      >
        {checked && <Check size={12} className="text-white" />}
      </span>
      <span className="text-[14px] text-[#2a2a2a] whitespace-nowrap">{label}</span>
    </button>
  );
}

export function LeadFilterModal({ resultCount, onApply, onClose }: LeadFilterModalProps) {
  const { t } = useTranslation("leads");
  const [statuses, setStatuses] = useState<string[]>(["Cold"]);
  const [sources, setSources] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [scoreQuality, setScoreQuality] = useState("All");

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAll() {
    setStatuses([]);
    setSources([]);
    setMinBudget("");
    setMaxBudget("");
    setScoreQuality("All");
  }

  return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    onClick={onClose}
  >
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/40" />

    {/* Modal */}
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-filter-title"
      className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-[460px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:max-h-[90vh]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#f0f0f0] bg-white px-4 py-4 sm:px-6 sm:py-5">
        <p
          id="lead-filter-title"
          className="text-[16px] font-semibold text-[#1a1a1a]"
          style={mont}
        >
          {t("filterModal.title")}
        </p>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-medium text-[#185fa5] hover:underline"
            style={mont}
          >
            {t("filterModal.clearAll")}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("filterModal.closeAria")}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 sm:px-6">
        {/* Lead status */}
        <section className="flex flex-col gap-3">
          <p
            className="text-[12px] text-[#7a7a7a]"
            style={mont}
          >
            {t("filterModal.leadStatus")}
          </p>

          <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:items-center sm:justify-between sm:gap-3">
            {STATUSES.map((status) => (
              <CheckboxRow
                key={status}
                label={t(STATUS_I18N_KEY[status])}
                checked={statuses.includes(status)}
                onToggle={() =>
                  toggle(statuses, status, setStatuses)
                }
              />
            ))}
          </div>
        </section>

        {/* Lead source */}
        <section className="flex flex-col gap-3">
          <p
            className="text-[12px] text-[#7a7a7a]"
            style={mont}
          >
            {t("filterModal.leadSource")}
          </p>

          <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 sm:gap-x-6">
            {SOURCES.map((source) => (
              <CheckboxRow
                key={source}
                label={t(SOURCE_I18N_KEY[source])}
                checked={sources.includes(source)}
                onToggle={() =>
                  toggle(sources, source, setSources)
                }
              />
            ))}
          </div>
        </section>

        {/* Budget limit */}
        <section className="flex flex-col gap-3">
          <p
            className="text-[12px] text-[#7a7a7a]"
            style={mont}
          >
            {t("filterModal.budgetLimit")}
          </p>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              placeholder={t("filterModal.minBudgetPlaceholder")}
              inputMode="numeric"
              className="h-10 min-w-0 w-full rounded-[10px] border border-[#d0d0d0] px-3 text-[12px] text-[#2a2a2a] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#1e4f86]"
              style={mont}
            />

            <span className="text-[#9a9a9a]">—</span>

            <input
              type="text"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder={t("filterModal.maxBudgetPlaceholder")}
              inputMode="numeric"
              className="h-10 min-w-0 w-full rounded-[10px] border border-[#d0d0d0] px-3 text-[12px] text-[#2a2a2a] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#1e4f86]"
              style={mont}
            />
          </div>
        </section>

        {/* Lead score quality */}
        <section className="flex flex-col gap-3">
          <p
            className="text-[12px] text-[#7a7a7a]"
            style={mont}
          >
            {t("filterModal.leadScoreQuality")}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            {SCORE_QUALITY.map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => setScoreQuality(quality)}
                className={`h-9 min-w-0 rounded-full border px-3 text-[12px] transition-colors sm:min-w-[72px] sm:px-4 ${
                  scoreQuality === quality
                    ? "border-[#1e4f86] bg-[#eff6ff] font-medium text-[#1e4f86]"
                    : "border-[#d0d0d0] bg-white text-[#2a2a2a] hover:bg-[#f8fafc]"
                }`}
                style={mont}
              >
                {SCORE_QUALITY_I18N_KEY[quality] ? t(SCORE_QUALITY_I18N_KEY[quality]) : quality}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#f0f0f0] bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span
            className="text-center text-[12px] text-[#6b6b6b] sm:text-left"
            style={mont}
          >
            {t("filterModal.resultsCount", { count: resultCount })}
          </span>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
            <button
              type="button"
              onClick={clearAll}
              className="h-10 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[12px] font-medium text-[#5a5a5a] transition-colors hover:bg-[#f3f4f6] sm:h-9"
              style={mont}
            >
              {t("filterModal.reset")}
            </button>

            <button
              type="button"
              onClick={() =>
                onApply({
                  statuses,
                  sources,
                  minBudget,
                  maxBudget,
                  scoreQuality,
                })
              }
              className="h-10 rounded-[10px] bg-[#1e4f86] px-5 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:h-9"
              style={mont}
            >
              {t("filterModal.applyFilters")}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
