"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search, Check } from "lucide-react";

import { OpportunityStage, OpportunityStatus } from "@/generated/prisma/enums";
import type { OpportunityDto } from "@/features/crm/types/crm-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type OpportunityFilterValues = {
  stages: OpportunityStage[];
  statuses: OpportunityStatus[];
  minCommission: string;
  maxCommission: string;
  minProbability: number;
  expectedClose: string;
  agentId: string;
};

export const EMPTY_OPPORTUNITY_FILTERS: OpportunityFilterValues = {
  stages: [],
  statuses: [],
  minCommission: "",
  maxCommission: "",
  minProbability: 0,
  expectedClose: "",
  agentId: "",
};

export function hasActiveOpportunityFilters(f: OpportunityFilterValues): boolean {
  return (
    f.stages.length > 0 ||
    f.statuses.length > 0 ||
    f.minCommission.trim() !== "" ||
    f.maxCommission.trim() !== "" ||
    f.minProbability > 0 ||
    f.expectedClose !== "" ||
    f.agentId !== ""
  );
}

function matchesExpectedCloseBucket(dateIso: string | null, bucket: string): boolean {
  if (!dateIso) return false;
  const date = new Date(dateIso);
  const now = new Date();
  if (bucket === "Overdue") return date.getTime() < now.getTime();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() < today.getTime()) return false;

  if (bucket === "This week") {
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - today.getDay()));
    return date.getTime() <= end.getTime();
  }
  if (bucket === "This month") {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return date.getTime() <= end.getTime();
  }
  if (bucket === "This quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    return date.getTime() <= end.getTime();
  }
  if (bucket === "This year") {
    const end = new Date(now.getFullYear(), 11, 31);
    return date.getTime() <= end.getTime();
  }
  return false;
}

/** Single source of truth for filter matching — used both for the live
 * in-modal preview count and the actual table filtering in OpportunitiesPage. */
export function matchesOpportunityFilters(o: OpportunityDto, f: OpportunityFilterValues): boolean {
  if (f.stages.length > 0 && !f.stages.includes(o.stage)) return false;
  if (f.statuses.length > 0 && !f.statuses.includes(o.status)) return false;

  const min = f.minCommission.trim() ? Number(f.minCommission) : null;
  const max = f.maxCommission.trim() ? Number(f.maxCommission) : null;
  const commission = o.commissionAmount ?? 0;
  if (min !== null && commission < min) return false;
  if (max !== null && commission > max) return false;

  if (f.minProbability > 0 && o.probability < f.minProbability) return false;
  if (f.expectedClose && !matchesExpectedCloseBucket(o.expectedCloseAt, f.expectedClose)) return false;
  if (f.agentId && o.assignedAgentId !== f.agentId) return false;

  return true;
}

const STAGES: { value: OpportunityStage; label: string; dot: string }[] = [
  { value: OpportunityStage.QUALIFICATION, label: "Qualification", dot: "#a855f7" },
  { value: OpportunityStage.VISITATION, label: "Visitation", dot: "#3b82f6" },
  { value: OpportunityStage.OFFER, label: "Offer", dot: "#22c55e" },
  { value: OpportunityStage.NEGOTIATION, label: "Negotiation", dot: "#f59e0b" },
  { value: OpportunityStage.CLOSING, label: "Closing", dot: "#3b82f6" },
];

const STATUSES: { value: OpportunityStatus; label: string; dot: string }[] = [
  { value: OpportunityStatus.OPEN, label: "Open", dot: "#22c55e" },
  { value: OpportunityStatus.CLOSED_WON, label: "Closed Won", dot: "#16a34a" },
  { value: OpportunityStatus.CLOSED_LOST, label: "Closed Lost", dot: "#ef4444" },
];

const EXPECTED_CLOSE = ["This week", "This month", "This quarter", "This year", "Overdue"];

type Agent = { id: string; name: string; status: string };

type OpportunityFilterModalProps = {
  initial: OpportunityFilterValues;
  /** Opportunities already narrowed by search/tab — the live "N results" count
   * previews these filters against this set, before Apply commits them. */
  baseResults: OpportunityDto[];
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

export function OpportunityFilterModal({ initial, baseResults, onApply, onClose }: OpportunityFilterModalProps) {
  const [stages, setStages] = useState<OpportunityStage[]>(initial.stages);
  const [statuses, setStatuses] = useState<OpportunityStatus[]>(initial.statuses);
  const [minCommission, setMinCommission] = useState(initial.minCommission);
  const [maxCommission, setMaxCommission] = useState(initial.maxCommission);
  const [minProbability, setMinProbability] = useState(initial.minProbability);
  const [expectedClose, setExpectedClose] = useState(initial.expectedClose);
  const [agentSearch, setAgentSearch] = useState("");
  const [agentId, setAgentId] = useState(initial.agentId);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => setAgents((json.agents ?? []).filter((a: Agent) => a.status === "ACTIVE")))
      .catch(() => undefined)
      .finally(() => setAgentsLoading(false));
  }, []);

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAll() {
    setStages([]);
    setStatuses([]);
    setMinCommission("");
    setMaxCommission("");
    setMinProbability(0);
    setExpectedClose("");
    setAgentId("");
  }

  const draft: OpportunityFilterValues = { stages, statuses, minCommission, maxCommission, minProbability, expectedClose, agentId };
  const previewCount = useMemo(
    () => baseResults.filter((o) => matchesOpportunityFilters(o, draft)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseResults, stages, statuses, minCommission, maxCommission, minProbability, expectedClose, agentId],
  );

  const visibleAgents = agents.filter((a) => a.name.toLowerCase().includes(agentSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <p className="text-[16px] font-semibold text-[#1a1a1a]" style={mont}>Filter Opportunities</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={clearAll} className="text-[12px] font-medium text-[#185fa5] hover:underline" style={mont}>Clear all</button>
            <button type="button" onClick={onClose} className="text-[#6a7282] hover:text-[#0d2138] transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Stage */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Stage</p>
            <div className="flex flex-wrap gap-2.5">
              {STAGES.map((s) => (
                <DotPill key={s.value} label={s.label} dot={s.dot} active={stages.includes(s.value)} onClick={() => toggle(stages, s.value, setStages)} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Status</p>
            <div className="flex flex-wrap gap-2.5">
              {STATUSES.map((s) => (
                <DotPill key={s.value} label={s.label} dot={s.dot} active={statuses.includes(s.value)} onClick={() => toggle(statuses, s.value, setStatuses)} />
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
              {agentsLoading ? (
                <p className="px-3 py-3 text-[12px] text-[#9a9a9a]" style={mont}>Loading agents…</p>
              ) : (
                visibleAgents.map((a) => {
                  const selected = agentId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgentId(selected ? "" : a.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-[#f8fafc]" : "hover:bg-[#f9fafb]"}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="size-7 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[10px] font-semibold" style={mont}>
                          {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-[13px] text-[#2a2a2a]" style={mont}>{a.name}{selected ? " (Selected)" : ""}</span>
                      </span>
                      {selected && <Check size={16} className="text-[#1e4f86]" />}
                    </button>
                  );
                })
              )}
              {!agentsLoading && visibleAgents.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-[#9a9a9a]" style={mont}>No agents found.</p>
              )}
            </div>
            {!agentsLoading && (
              <p className="text-[12px] text-[#9a9a9a]" style={mont}>Showing {visibleAgents.length} matches out of {agents.length} total agents</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0f0f0]">
          <span className="text-[12px] text-[#6b6b6b]" style={mont}>{previewCount} results</span>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={clearAll} className="h-9 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#5a5a5a] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>Reset</button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              className="h-9 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Apply filters
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
