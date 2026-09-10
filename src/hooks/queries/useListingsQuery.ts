import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { queryKeys } from "@/lib/query-keys";
import { useListingFilterStore } from "@/stores/useListingFilterStore";

/** Cards per page on the public listings grid. Server-paginated — keep in
 *  sync with the `pageSize` the grid asks for. */
export const LISTINGS_PAGE_SIZE = 9;

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

/** Paginated grid results — one server-fetched page of `LISTINGS_PAGE_SIZE`
 *  listings plus the total match count, not the whole result set. */
export function useListingsQuery(page: number, sort: "recent" | "oldest" = "recent") {
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

  const queryFilters = { ...filters, page, pageSize: LISTINGS_PAGE_SIZE, sort };

  return useQuery({
    queryKey: queryKeys.listings(queryFilters),
    queryFn: () => fetchListings(queryFilters),
  });
}

/** Unpaginated (up to the server's default cap) — for the map view, which
 *  shows every matching pin rather than one grid page at a time. */
export function useMapListingsQuery(enabled: boolean) {
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
    queryKey: queryKeys.mapListings(filters),
    queryFn: () => fetchListings(filters),
    enabled,
  });
}
