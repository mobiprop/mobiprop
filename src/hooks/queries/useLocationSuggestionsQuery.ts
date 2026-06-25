import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { LocationSuggestionDto } from "@/features/locations/types/location-dto";

async function fetchLocationSuggestions(): Promise<{ locations: LocationSuggestionDto[] }> {
  const res = await fetch("/api/dashboard/locations/suggestions");
  if (!res.ok) throw new Error("Failed to fetch location suggestions");
  return res.json();
}

// Backs the Upload Listing modal's Location autocomplete. Distinct from
// queryKeys.locationSuggestions (the public, Property-row-backed one used by
// the homepage search) — this is the dashboard "Locations" sector's name list.
export function useLocationSuggestionsQuery() {
  return useQuery({
    queryKey: queryKeys.locationNameSuggestions(),
    queryFn: fetchLocationSuggestions,
    staleTime: 5 * 60_000,
  });
}
