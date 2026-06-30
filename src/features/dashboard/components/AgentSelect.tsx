"use client";

import { useEffect, useState } from "react";

import { SearchableSelect } from "./SearchableSelect";

export type AssignableAgent = { id: string; name: string; status: string };

type AgentSelectProps = {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm";
  /**
   * When set, the field is locked to this single agent (no fetch, no picker).
   * Used when an AGENT is logged in: they can't list other agents (the
   * /api/dashboard/agents endpoint 403s for them) and their records are always
   * assigned to themselves, so the parent passes their own profile here.
   */
  lockedAgent?: { id: string; name: string } | null;
};

/**
 * Searchable Assigned Agent field backed by /api/dashboard/agents, scoped to
 * ACTIVE staff. Extracted from the fetch-then-filter-ACTIVE pattern already
 * proven in UploadListingModal's "Assigned Agent" field so Opportunities and
 * Contracts use the same real picker instead of a free-text name input.
 */
export function AgentSelect({ value, onChange, placeholder = "Select agent…", disabled, className, size = "sm", lockedAgent }: AgentSelectProps) {
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  // No fetch when locked to self — start un-loading so the locked field renders
  // immediately. (The parent seeds `value` with the agent's own id, and the
  // server forces self-assignment regardless, so no effect-driven sync needed.)
  const [loading, setLoading] = useState(!lockedAgent);

  useEffect(() => {
    if (lockedAgent) return; // AGENT — can't list other agents, nothing to fetch
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => setAgents((json.agents ?? []).filter((a: AssignableAgent) => a.status === "ACTIVE")))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedAgent?.id]);

  if (lockedAgent) {
    return (
      <div
        className={`flex h-10 items-center rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[12px] text-[#6a7282] ${className ?? ""}`}
        style={{ fontFamily: "'Montserrat', sans-serif" }}
        title="Assigned to you"
        aria-label={`Assigned agent: ${lockedAgent.name} (you)`}
      >
        {lockedAgent.name} (you)
      </div>
    );
  }

  return (
    <SearchableSelect
      className={className}
      size={size}
      value={value}
      onChange={onChange}
      options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
      placeholder={placeholder}
      searchPlaceholder="Search agents..."
      emptyLabel="No agents found."
      loading={loading}
      disabled={disabled}
    />
  );
}
