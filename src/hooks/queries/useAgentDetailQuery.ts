import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { AgentDetailDto, AgentDetailPeriod } from "@/features/agents/agent-actions";

async function fetchAgentDetail(id: string, period: AgentDetailPeriod): Promise<AgentDetailDto> {
  const res = await fetch(`/api/dashboard/agents/${id}?period=${period}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed to fetch agent");
  return json.agent;
}

export function useAgentDetailQuery(id: string, period: AgentDetailPeriod = "current_month") {
  return useQuery({
    queryKey: queryKeys.agentDetail(id, period),
    queryFn: () => fetchAgentDetail(id, period),
    enabled: !!id,
    staleTime: 30_000,
    // Switching periods shouldn't blank the whole page back to the loading
    // spinner — keep the previous period's stats on screen until the new
    // ones arrive.
    placeholderData: keepPreviousData,
  });
}
