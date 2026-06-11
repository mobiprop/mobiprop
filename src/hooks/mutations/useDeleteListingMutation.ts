import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";

async function deleteListing(id: string) {
  const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error ?? "Failed to delete listing");
  }
  return data;
}

/** ADMIN only: hard delete a listing and its stored images. */
export function useDeleteListingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardListings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
