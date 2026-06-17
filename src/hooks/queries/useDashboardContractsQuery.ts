import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ContractDto, ContractMetrics } from "@/features/crm/types/crm-dto";

async function fetchContracts(): Promise<{ contracts: ContractDto[]; metrics: ContractMetrics }> {
  const res = await fetch("/api/dashboard/contracts");
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json();
}

export function useDashboardContractsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardContracts(),
    queryFn: fetchContracts,
    staleTime: 60_000,
  });
}
