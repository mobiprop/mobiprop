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
};

/**
 * Searchable Assigned Agent field backed by /api/dashboard/agents, scoped to
 * ACTIVE staff. Extracted from the fetch-then-filter-ACTIVE pattern already
 * proven in UploadListingModal's "Assigned Agent" field so Opportunities and
 * Contracts use the same real picker instead of a free-text name input.
 */
export function AgentSelect({ value, onChange, placeholder = "Select agent…", disabled, className, size = "sm" }: AgentSelectProps) {
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => setAgents((json.agents ?? []).filter((a: AssignableAgent) => a.status === "ACTIVE")))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

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
