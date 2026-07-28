import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { uploadImagesForNewListing } from "@/lib/client-upload";
import { fallbackErrorMessage, NETWORK_ERROR_MESSAGE } from "@/lib/http-error";
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
  // Images upload straight to storage; only this small JSON hits the function.
  const { propertyId, descriptors } = await uploadImagesForNewListing(images);

  let response: Response;
  try {
    response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, propertyId, images: descriptors, coverIndex }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(body?.error ?? fallbackErrorMessage(response.status));
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
