export type TrendDirection = "up" | "down";

export type MetricCard = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  trendLabel: string;
  trendDirection: TrendDirection;
  iconBg: string;
  iconColor: string;
  sparkline: number[];
};

export type ChartGranularity = "monthly" | "weekly" | "daily";

export type ChartPoint = { label: string; revenue: number; openOpportunities: number };

export type LocationRow = { name: string; count: number };

export type SaleOperation = "Rent" | "Sale" | "Sale & Rent";

export type SaleRow = {
  opportunityId: string;
  agentId: string | null;
  agentName: string;
  listingId: string | null;
  operation: SaleOperation;
  date: string;
  revenue: number;
};

export type DashboardDateRangeKey = "LAST_WEEK" | "60_DAYS" | "90_DAYS" | "CUSTOM";

export type DashboardDateRangeInput = {
  dateRange: DashboardDateRangeKey;
  from?: string | null;
  to?: string | null;
};
