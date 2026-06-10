import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";

async function createLead(input: unknown) {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create lead");
  }

  return response.json();
}

/**
 * Reference mutation pattern (see project guide §15).
 *
 * Every create/update/delete mutation should invalidate the queries whose
 * data it affects so the UI refetches without a full-page refresh.
 */
export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}
