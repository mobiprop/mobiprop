"use client";

import { useState } from "react";
import { X, Search, Check } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type OpportunityFilterValues = {
  stages: string[];
  statuses: string[];
  minCommission: string;
  maxCommission: string;
  minProbability: number;
  expectedClose: string;
  agent: string;
};

const STAGES: { label: string; dot: string }[] = [
  { label: "Visitation", dot: "#3b82f6" },
  { label: "Offer", dot: "#22c55e" },
  { label: "Negotiation", dot: "#f59e0b" },
  { label: "Closing", dot: "#3b82f6" },
];

const STATUSES: { label: string; dot: string }[] = [
  { label: "Open", dot: "#22c55e" },
  { label: "Closed Won", dot: "#16a34a" },
  { label: "Closed Lost", dot: "#ef4444" },
];

const EXPECTED_CLOSE = ["This week", "This month", "This quarter", "This year", "Overdue"];

const AGENTS = ["Sarah Johnson", "Leslie Alexander", "Cameron Williamson", "Darlene Robertson"];

type OpportunityFilterModalProps = {
  resultCount: number;
  onApply: (filters: OpportunityFilterValues) => void;
  onClose: () => void;
};

function DotPill({ label, dot, active, onClick }: { label: string; dot: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 h-8 px-3.5 rounded-full border text-[12px] transition-colors ${
        active ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86] font-medium" : "bg-white border-[#d0d0d0] text-[#2a2a2a] hover:bg-[#f8fafc]"
      }`}
      style={mont}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </button>
  );
}

export function OpportunityFilterModal({ resultCount, onApply, onClose }: OpportunityFilterModalProps) {
  const [stages, setStages] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [minCommission, setMinCommission] = useState("");
  const [maxCommission, setMaxCommission] = useState("");
  const [minProbability, setMinProbability] = useState(97);
  const [expectedClose, setExpectedClose] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [agent, setAgent] = useState("Sarah Johnson");

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAll() {
    setStages([]);
    setStatuses([]);
    setMinCommission("");
    setMaxCommission("");
    setMinProbability(0);
    setExpectedClose("");
    setAgent("");
  }

  const visibleAgents = AGENTS.filter((a) => a.toLowerCase().includes(agentSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <p className="text-[16px] font-semibold text-[#1a1a1a]" style={mont}>Filter Opportunities</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={clearAll} className="text-[12px] font-medium text-[#185fa5] hover:underline" style={mont}>Clear all</button>
            <button type="button" onClick={onClose} className="text-[#6a7282] hover:text-[#0d2138] transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Stage */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Stage</p>
            <div className="flex flex-wrap gap-2.5">
              {STAGES.map((s) => (
                <DotPill key={s.label} label={s.label} dot={s.dot} active={stages.includes(s.label)} onClick={() => toggle(stages, s.label, setStages)} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Status</p>
            <div className="flex flex-wrap gap-2.5">
              {STATUSES.map((s) => (
                <DotPill key={s.label} label={s.label} dot={s.dot} active={statuses.includes(s.label)} onClick={() => toggle(statuses, s.label, setStatuses)} />
              ))}
            </div>
          </div>

          {/* Commission range */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Commission range</p>
            <div className="flex items-center gap-3">
              <input value={minCommission} onChange={(e) => setMinCommission(e.target.value)} placeholder="Min $" inputMode="numeric" className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              <span className="text-[#9a9a9a]">—</span>
              <input value={maxCommission} onChange={(e) => setMaxCommission(e.target.value)} placeholder="Max $" inputMode="numeric" className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
            </div>
          </div>

          {/* Min probability */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Min probability</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={minProbability}
                onChange={(e) => setMinProbability(Number(e.target.value))}
                className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer accent-[#1e4f86]"
                style={{ background: `linear-gradient(to right, #1e4f86 ${minProbability}%, #e5e7eb ${minProbability}%)` }}
              />
              <span className="text-[12px] font-medium text-[#2a2a2a] w-9 text-right" style={mont}>{minProbability}%</span>
            </div>
          </div>

          {/* Expected close */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Expected close</p>
            <div className="flex flex-wrap gap-2.5">
              {EXPECTED_CLOSE.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExpectedClose(expectedClose === e ? "" : e)}
                  className={`h-9 px-4 rounded-full border text-[12px] transition-colors ${
                    expectedClose === e ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86] font-medium" : "bg-white border-[#d0d0d0] text-[#2a2a2a] hover:bg-[#f8fafc]"
                  }`}
                  style={mont}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned agent */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Assigned agent</p>
            <div className="flex items-center gap-2 h-10 px-3 border border-[#d0d0d0] rounded-[10px]">
              <Search size={16} className="text-[#9a9a9a] shrink-0" />
              <input value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} placeholder="Search by agent name..." className="text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] bg-transparent outline-none w-full" style={mont} />
            </div>
            <div className="border border-[#e5e7eb] rounded-[10px] divide-y divide-[#f0f0f0] overflow-hidden">
              {visibleAgents.map((a) => {
                const selected = agent === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgent(selected ? "" : a)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-[#f8fafc]" : "hover:bg-[#f9fafb]"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="size-7 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[10px] font-semibold" style={mont}>
                        {a.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                      <span className="text-[13px] text-[#2a2a2a]" style={mont}>{a}{selected ? " (Selected)" : ""}</span>
                    </span>
                    {selected && <Check size={16} className="text-[#1e4f86]" />}
                  </button>
                );
              })}
              {visibleAgents.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-[#9a9a9a]" style={mont}>No agents found.</p>
              )}
            </div>
            <p className="text-[12px] text-[#9a9a9a]" style={mont}>Showing {visibleAgents.length} matches out of 60 total agents</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0f0f0]">
          <span className="text-[12px] text-[#6b6b6b]" style={mont}>{resultCount} results</span>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={clearAll} className="h-9 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#5a5a5a] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>Reset</button>
            <button
              type="button"
              onClick={() => onApply({ stages, statuses, minCommission, maxCommission, minProbability, expectedClose, agent })}
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
