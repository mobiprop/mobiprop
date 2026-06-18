import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { AgentDetailDto } from "@/features/agents/agent-actions";

async function fetchAgentDetail(id: string): Promise<AgentDetailDto> {
  const res = await fetch(`/api/dashboard/agents/${id}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed to fetch agent");
  return json.agent;
}

export function useAgentDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.agentDetail(id),
    queryFn: () => fetchAgentDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
