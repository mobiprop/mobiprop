import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { queryKeys } from "@/lib/query-keys";
import { useDashboardStore } from "@/stores/useDashboardStore";
import type { SaleRow } from "@/features/dashboard/types/dashboard-dto";

async function fetchSalesByAgent(params: {
  dateRange: string;
  from?: string | null;
  to?: string | null;
}): Promise<{ success: boolean; sales: SaleRow[] }> {
  const searchParams = new URLSearchParams();

  searchParams.set("dateRange", params.dateRange);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const response = await fetch(`/api/dashboard/sales-by-agent?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch sales by agent");
  }

  return response.json();
}

export function useSalesByAgentQuery() {
  const { dateRange, customDateRange } = useDashboardStore(
    useShallow((state) => ({
      dateRange: state.dateRange,
      customDateRange: state.customDateRange,
    })),
  );

  return useQuery({
    queryKey: queryKeys.salesByAgent({ dateRange, customDateRange }),
    queryFn: () =>
      fetchSalesByAgent({
        dateRange,
        from: customDateRange.from,
        to: customDateRange.to,
      }),
  });
}
