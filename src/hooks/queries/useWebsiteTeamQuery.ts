import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { WebsiteTeamMemberDto } from "@/features/agents/agent-actions";

async function fetchWebsiteTeam(): Promise<{ members: WebsiteTeamMemberDto[] }> {
  const res = await fetch("/api/dashboard/agents/website-team");
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed to fetch website team");
  return json;
}

export function useWebsiteTeamQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.websiteTeam(),
    queryFn: fetchWebsiteTeam,
    enabled,
    staleTime: 30_000,
  });
}
