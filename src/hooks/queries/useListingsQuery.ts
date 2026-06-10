import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { queryKeys } from "@/lib/query-keys";
import { useListingFilterStore } from "@/stores/useListingFilterStore";

async function fetchListings(filters: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }

    params.set(key, String(value));
  });

  const response = await fetch(`/api/listings?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch listings");
  }

  return response.json();
}

export function useListingsQuery() {
  // useShallow keeps this selector from returning a new object every render
  // (required with Zustand v5 to avoid infinite re-render loops).
  const filters = useListingFilterStore(
    useShallow((state) => ({
      location: state.location,
      propertyType: state.propertyType,
      transactionType: state.transactionType,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      minArea: state.minArea,
      maxArea: state.maxArea,
      amenities: state.amenities,
    }))
  );

  return useQuery({
    queryKey: queryKeys.listings(filters),
    queryFn: () => fetchListings(filters),
  });
}
