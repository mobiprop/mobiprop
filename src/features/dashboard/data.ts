// Placeholder dashboard data.
//
// TODO: replace with real queries once the Listings / Opportunities / Locations /
// Contracts modules exist. Shapes are intentionally close to the eventual schema
// so swapping in live data is a localized change.

import type { Role } from "@/lib/permissions";

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

export type ChartPoint = { month: string; revenue: number; opportunities: number };

export type LocationRow = { name: string; count: number };

export type SaleOperation = "Rent" | "Sale" | "Sale & Rent";

export type SaleRow = {
  agentName: string;
  listingId: string;
  opportunityId: string;
  operation: SaleOperation;
  date: string;
  revenue: string;
};

const SPARK_UP = [12, 18, 14, 22, 19, 27, 31];
const SPARK_DOWN = [30, 26, 28, 21, 23, 18, 15];

// Company-wide metric set (Admin / Manager).
const COMPANY_METRICS: MetricCard[] = [
  {
    key: "listings",
    label: "Amount of Listings",
    value: "237",
    trendLabel: "+23.3% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#e0e7ff",
    iconColor: "#4f46e5",
    sparkline: SPARK_UP,
  },
  {
    key: "lost",
    label: "Lost Opportunities",
    value: "8",
    sub: "$14,000",
    trendLabel: "-8.6% desde el mes pasado",
    trendDirection: "down",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    sparkline: SPARK_DOWN,
  },
  {
    key: "won",
    label: "Won Opportunities",
    value: "3",
    sub: "$23,000",
    trendLabel: "+33.5% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#d1fae5",
    iconColor: "#059669",
    sparkline: SPARK_UP,
  },
  {
    key: "revenue",
    label: "Revenue",
    value: "$24,550",
    trendLabel: "+12.5% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    sparkline: SPARK_UP,
  },
];

// Agent-scoped metric set — no company-wide revenue; figures are framed as the
// agent's own. Matches the role-visibility rules (agents never see admin revenue).
const AGENT_METRICS: MetricCard[] = [
  {
    key: "my-listings",
    label: "Mis Propiedades",
    value: "18",
    trendLabel: "+12.0% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#e0e7ff",
    iconColor: "#4f46e5",
    sparkline: SPARK_UP,
  },
  {
    key: "my-open",
    label: "Oportunidades Abiertas",
    value: "5",
    trendLabel: "+8.1% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    sparkline: SPARK_UP,
  },
  {
    key: "my-won",
    label: "Oportunidades Ganadas",
    value: "2",
    trendLabel: "+15.0% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#d1fae5",
    iconColor: "#059669",
    sparkline: SPARK_UP,
  },
  {
    key: "my-commission",
    label: "Mi Comisión",
    value: "$3,200",
    trendLabel: "+9.4% desde el mes pasado",
    trendDirection: "up",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    sparkline: SPARK_UP,
  },
];

export function getMetricsForRole(role: Role): MetricCard[] {
  return role === "AGENT" ? AGENT_METRICS : COMPANY_METRICS;
}

export const REVENUE_CHART: ChartPoint[] = [
  { month: "Jan", revenue: 40, opportunities: 28 },
  { month: "Feb", revenue: 55, opportunities: 42 },
  { month: "Mar", revenue: 48, opportunities: 60 },
  { month: "Apr", revenue: 72, opportunities: 55 },
  { month: "May", revenue: 90, opportunities: 70 },
  { month: "Jun", revenue: 78, opportunities: 88 },
  { month: "Jul", revenue: 110, opportunities: 95 },
  { month: "Aug", revenue: 125, opportunities: 80 },
  { month: "Sep", revenue: 105, opportunities: 112 },
  { month: "Oct", revenue: 130, opportunities: 98 },
  { month: "Nov", revenue: 118, opportunities: 120 },
  { month: "Dec", revenue: 140, opportunities: 105 },
];

export const LOCATIONS: LocationRow[] = [
  { name: "Las Liebres", count: 52 },
  { name: "Senderos I", count: 24 },
  { name: "Tortugas Country Club", count: 24 },
  { name: "Civis I", count: 88 },
  { name: "Tortugas 1", count: 58 },
  { name: "Tortugas 2", count: 21 },
];

export const SALES: SaleRow[] = [
  { agentName: "Thomas Fletcher", listingId: "#123546854", opportunityId: "#12345", operation: "Rent", date: "03 May, 2026", revenue: "$3200" },
  { agentName: "David Lee", listingId: "#325487955", opportunityId: "#12345", operation: "Sale", date: "03 May, 2026", revenue: "$5400" },
  { agentName: "Sophia Williams", listingId: "#254646854", opportunityId: "#12345", operation: "Sale & Rent", date: "03 May, 2026", revenue: "$1200" },
  { agentName: "James Jones", listingId: "#876546854", opportunityId: "#12345", operation: "Sale", date: "03 May, 2026", revenue: "$500" },
  { agentName: "Emily Davis", listingId: "#876546854", opportunityId: "#12345", operation: "Sale & Rent", date: "03 May, 2026", revenue: "$1300" },
];
