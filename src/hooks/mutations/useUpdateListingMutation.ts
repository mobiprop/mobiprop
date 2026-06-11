import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { PropertyStatus } from "@/generated/prisma/enums";
import type { UpdateListingInput } from "@/schemas/listing.schema";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";

type ListingResponse = { listing: DashboardListingDto };

async function requestJson(url: string, method: string, body: unknown): Promise<ListingResponse> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

function useListingInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardListings() });
    queryClient.invalidateQueries({ queryKey: queryKeys.listings() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
  };
}

/** Edit listing fields/amenities (PATCH /api/listings/[id]). */
export function useUpdateListingMutation() {
  const invalidate = useListingInvalidation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingInput }) =>
      requestJson(`/api/listings/${id}`, "PATCH", data),
    onSuccess: invalidate,
  });
}

/** Pause/activate or mark rented/sold (PATCH /api/listings/[id]/status). */
export function useListingStatusMutation() {
  const invalidate = useListingInvalidation();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      requestJson(`/api/listings/${id}/status`, "PATCH", { status }),
    onSuccess: invalidate,
  });
}

/** Toggle featured flag (PATCH /api/listings/[id]/featured). */
export function useListingFeaturedMutation() {
  const invalidate = useListingInvalidation();
  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      requestJson(`/api/listings/${id}/featured`, "PATCH", { isFeatured }),
    onSuccess: invalidate,
  });
}

/** Add images to an existing listing (POST /api/listings/[id]/images). */
export function useAddListingImagesMutation() {
  const invalidate = useListingInvalidation();
  return useMutation({
    mutationFn: async ({ id, images }: { id: string; images: File[] }) => {
      const formData = new FormData();
      images.forEach((file) => formData.append("images", file));
      const response = await fetch(`/api/listings/${id}/images`, { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "Failed to upload images");
      }
      return data as ListingResponse;
    },
    onSuccess: invalidate,
  });
}

/** Remove one image from a listing (DELETE /api/listings/[id]/images). */
export function useRemoveListingImageMutation() {
  const invalidate = useListingInvalidation();
  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      requestJson(`/api/listings/${id}/images`, "DELETE", { imageId }),
    onSuccess: invalidate,
  });
}
