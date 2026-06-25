import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { LocationDto } from "@/features/locations/types/location-dto";

async function fetchLocations(): Promise<{ locations: LocationDto[] }> {
  const res = await fetch("/api/dashboard/locations");
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export function useDashboardLocationsQuery() {
  return useQuery({
    queryKey: queryKeys.locations(),
    queryFn: fetchLocations,
    staleTime: 60_000,
  });
}
