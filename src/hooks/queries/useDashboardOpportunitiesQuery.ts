import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { OpportunityDto, OpportunityMetrics } from "@/features/crm/types/crm-dto";

async function fetchOpportunities(): Promise<{ opportunities: OpportunityDto[]; metrics: OpportunityMetrics }> {
  const res = await fetch("/api/dashboard/opportunities");
  if (!res.ok) throw new Error("Failed to fetch opportunities");
  return res.json();
}

export function useDashboardOpportunitiesQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardOpportunities(),
    queryFn: fetchOpportunities,
    staleTime: 60_000,
  });
}
