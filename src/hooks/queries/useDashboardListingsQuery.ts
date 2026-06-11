import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type {
  DashboardListingDto,
  DashboardListingMetrics,
} from "@/features/listings/types/listing-dto";

type DashboardListingsResponse = {
  success: boolean;
  listings: DashboardListingDto[];
  metrics: DashboardListingMetrics;
};

async function fetchDashboardListings(): Promise<DashboardListingsResponse> {
  const response = await fetch("/api/dashboard/listings");
  if (!response.ok) {
    throw new Error("Failed to fetch listings");
  }
  return response.json();
}

/** Dashboard listings table/grid + metric cards (staff only). */
export function useDashboardListingsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardListings(),
    queryFn: fetchDashboardListings,
  });
}
