"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";

/** Keep the featured collection separate from the map's complete inventory. */
export function useHomeListings(featuredOnly = false) {
  return useQuery<{ listings: PublicListingDto[]; total: number }>({
    queryKey: ["listings", "home", { featuredOnly }],
    queryFn: async ({ signal }) => {
      const response = await fetch(featuredOnly ? "/api/listings?featured=true" : "/api/listings", { signal });
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    staleTime: 60_000,
  });
}
