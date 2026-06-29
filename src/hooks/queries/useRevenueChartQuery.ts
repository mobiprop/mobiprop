import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { queryKeys } from "@/lib/query-keys";
import { useDashboardStore } from "@/stores/useDashboardStore";
import type { ChartGranularity, ChartPoint } from "@/features/dashboard/types/dashboard-dto";

async function fetchRevenueChart(params: {
  dateRange: string;
  from?: string | null;
  to?: string | null;
  granularity: ChartGranularity;
}): Promise<{ success: boolean; chart: ChartPoint[] }> {
  const searchParams = new URLSearchParams();

  searchParams.set("dateRange", params.dateRange);
  searchParams.set("granularity", params.granularity);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const response = await fetch(`/api/dashboard/revenue-chart?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch revenue chart");
  }

  return response.json();
}

export function useRevenueChartQuery(granularity: ChartGranularity) {
  const { dateRange, customDateRange } = useDashboardStore(
    useShallow((state) => ({
      dateRange: state.dateRange,
      customDateRange: state.customDateRange,
    })),
  );

  return useQuery({
    queryKey: queryKeys.revenueChart({ dateRange, customDateRange, granularity }),
    queryFn: () =>
      fetchRevenueChart({
        dateRange,
        from: customDateRange.from,
        to: customDateRange.to,
        granularity,
      }),
  });
}
