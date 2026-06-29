import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { LocationRow } from "@/features/dashboard/types/dashboard-dto";

async function fetchLocationSummary(): Promise<{ success: boolean; locations: LocationRow[] }> {
  const response = await fetch("/api/dashboard/location-summary");

  if (!response.ok) {
    throw new Error("Failed to fetch location summary");
  }

  return response.json();
}

export function useLocationSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.locationSummary(undefined),
    queryFn: fetchLocationSummary,
    staleTime: 60_000,
  });
}
