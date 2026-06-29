import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { AgentDto, AgentMetrics } from "@/features/agents/agent-actions";

async function fetchAgents(): Promise<{ agents: AgentDto[]; metrics: AgentMetrics }> {
  const res = await fetch("/api/dashboard/agents");
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed to fetch agents");
  return json;
}

export function useDashboardAgentsQuery() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: fetchAgents,
    staleTime: 30_000,
  });
}
