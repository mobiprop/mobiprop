"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type LeadFilterValues = {
  statuses: string[];
  sources: string[];
  minBudget: string;
  maxBudget: string;
  scoreQuality: string;
};

const STATUSES = ["Cold", "Won", "In Progress", "Lost"];
const SOURCES = ["Zonaprop", "Website", "Whatsapp", "Campaign"];
const SCORE_QUALITY = ["All", ">75%", ">50%", "<25%"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <p className="text-[16px] font-semibold text-[#1a1a1a]" style={mont}>Filter Leads</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={clearAll} className="text-[12px] font-medium text-[#185fa5] hover:underline" style={mont}>
              Clear all
            </button>
            <button type="button" onClick={onClose} className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Lead status */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Lead Status</p>
            <div className="grid grid-cols-4 gap-2">
              {STATUSES.map((s) => (
                <CheckboxRow key={s} label={s} checked={statuses.includes(s)} onToggle={() => toggle(statuses, s, setStatuses)} />
              ))}
            </div>
          </div>

          {/* Lead source */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Lead Source</p>
            <div className="grid grid-cols-3 gap-y-3 gap-x-2">
              {SOURCES.map((s) => (
                <CheckboxRow key={s} label={s} checked={sources.includes(s)} onToggle={() => toggle(sources, s, setSources)} />
              ))}
            </div>
          </div>

          {/* Budget limit */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Budget Limit</p>
            <div className="flex items-center gap-3">
              <input
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="Min $"
                inputMode="numeric"
                className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
              <span className="text-[#9a9a9a]">—</span>
              <input
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Max $"
                inputMode="numeric"
                className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
          </div>

          {/* Lead score quality */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Lead Score Quality</p>
            <div className="flex flex-wrap gap-2.5">
              {SCORE_QUALITY.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setScoreQuality(q)}
                  className={`h-9 min-w-[72px] px-4 rounded-full border text-[12px] transition-colors ${
                    scoreQuality === q
                      ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86] font-medium"
                      : "bg-white border-[#d0d0d0] text-[#2a2a2a] hover:bg-[#f8fafc]"
                  }`}
                  style={mont}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0f0f0]">
          <span className="text-[12px] text-[#6b6b6b]" style={mont}>{resultCount} results</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={clearAll}
              className="h-9 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#5a5a5a] bg-white hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply({ statuses, sources, minBudget, maxBudget, scoreQuality })}
              className="h-9 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
