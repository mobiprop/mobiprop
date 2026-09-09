"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";

/** The featured grid and map explorer share the same public inventory request. */
export function useHomeListings() {
  return useQuery<{ listings: PublicListingDto[]; total: number }>({
    queryKey: ["listings", "home-featured"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/listings", { signal });
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    staleTime: 60_000,
  });
}
