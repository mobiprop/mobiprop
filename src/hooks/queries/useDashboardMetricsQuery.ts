import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { queryKeys } from "@/lib/query-keys";
import { useDashboardStore } from "@/stores/useDashboardStore";

async function fetchDashboardMetrics(params: {
  dateRange: string;
  from?: string | null;
  to?: string | null;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("dateRange", params.dateRange);

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const response = await fetch(`/api/dashboard/metrics?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  return response.json();
}

export function useDashboardMetricsQuery() {
  const { dateRange, customDateRange } = useDashboardStore(
    useShallow((state) => ({
      dateRange: state.dateRange,
      customDateRange: state.customDateRange,
    }))
  );

  return useQuery({
    queryKey: queryKeys.dashboardMetrics({ dateRange, customDateRange }),
    queryFn: () =>
      fetchDashboardMetrics({
        dateRange,
        from: customDateRange.from,
        to: customDateRange.to,
      }),
  });
}
