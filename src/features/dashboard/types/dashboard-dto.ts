export type TrendDirection = "up" | "down";

export type MetricCard = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  /** Net revenue (gross minus the agent's cut) — only set on the "revenue" card. */
  netValue?: string;
  trendValue: string;
  trendText: string;
  trendDirection: TrendDirection;
  iconBg: string;
  iconColor: string;
  sparkline: number[];
};

export type ChartGranularity = "monthly" | "weekly" | "daily";

export type ChartPoint = {
  label: string;
  /** Gross company commission for CLOSED_WON deals in this bucket. */
  revenue: number;
  /** revenue minus the agent's cut — what the company actually keeps. */
  revenueNet: number;
  openOpportunities: number;
};

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
