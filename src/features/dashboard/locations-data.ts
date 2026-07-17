// Shared display config for the dashboard Locations page. Data itself comes
// from useDashboardLocationsQuery() (src/features/locations/location-actions.ts) —
// this file only holds pure UI config (icons/colors), no mock records.

import { Home, Building2, Layers, Store, PackagePlus, CircleDollarSign, RefreshCw, type LucideIcon } from "lucide-react";

import type { LocationDistribution, LocationActivityKind } from "@/features/locations/types/location-dto";

export const DISTRIBUTION_CONFIG: {
  key: keyof LocationDistribution;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  barColor: string;
}[] = [
  { key: "houses", icon: Home, iconBg: "rgba(105,169,195,0.12)", iconColor: "#69a9c3", barColor: "#69a9c3" },
  { key: "apartments", icon: Building2, iconBg: "rgba(16,185,129,0.08)", iconColor: "#10b981", barColor: "#10b981" },
  { key: "lots", icon: Layers, iconBg: "rgba(245,158,11,0.08)", iconColor: "#f59e0b", barColor: "#f59e0b" },
  { key: "commercial", icon: Store, iconBg: "rgba(239,68,68,0.08)", iconColor: "#ef4444", barColor: "#ef4444" },
];

export const ACTIVITY_KIND_CONFIG: Record<
  LocationActivityKind,
  { icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  created: { icon: PackagePlus, iconBg: "rgba(16,185,129,0.08)", iconColor: "#10b981" },
  sold: { icon: CircleDollarSign, iconBg: "rgba(16,185,129,0.08)", iconColor: "#10b981" },
  updated: { icon: RefreshCw, iconBg: "rgba(245,158,11,0.08)", iconColor: "#f59e0b" },
};
