import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ListingInput } from "@/schemas/listing.schema";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";

export type CreateListingVariables = {
  data: ListingInput;
  images: File[];
  coverIndex: number;
};

async function createListing({
  data,
  images,
  coverIndex,
}: CreateListingVariables): Promise<{ listing: DashboardListingDto }> {
  const formData = new FormData();
  formData.set("data", JSON.stringify(data));
  formData.set("coverIndex", String(coverIndex));
  images.forEach((file) => formData.append("images", file));

  const response = await fetch("/api/listings", { method: "POST", body: formData });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(body?.error ?? "Failed to create listing");
  }
  return body;
}

export function useCreateListingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardListings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
