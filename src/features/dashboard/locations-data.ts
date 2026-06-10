// Shared types + mock data for the dashboard Locations page.

import { Home, Building2, Layers, Store, PackagePlus, UserPlus, type LucideIcon } from "lucide-react";

export type PropertyDistribution = {
  houses: number;
  apartments: number;
  lots: number;
  commercial: number;
};

export type LocationActivity = {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export type PropertyLocation = {
  id: string;
  name: string;
  region: string;
  address: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
  growthPercent: number;
  properties: number;
  active: number;
  sold: number;
  revenue: number;
  agents: number;
  avgPricePerM2: number;
  distribution: PropertyDistribution;
  activity: LocationActivity[];
};

export const DISTRIBUTION_CONFIG: {
  key: keyof PropertyDistribution;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  barColor: string;
}[] = [
  { key: "houses", label: "Houses", icon: Home, iconBg: "rgba(105,169,195,0.12)", iconColor: "#69a9c3", barColor: "#69a9c3" },
  { key: "apartments", label: "Apartments", icon: Building2, iconBg: "rgba(16,185,129,0.08)", iconColor: "#10b981", barColor: "#10b981" },
  { key: "lots", label: "Lots", icon: Layers, iconBg: "rgba(245,158,11,0.08)", iconColor: "#f59e0b", barColor: "#f59e0b" },
  { key: "commercial", label: "Commercial", icon: Store, iconBg: "rgba(239,68,68,0.08)", iconColor: "#ef4444", barColor: "#ef4444" },
];

export const MOCK_LOCATIONS: PropertyLocation[] = [
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    region: "Buenos Aires",
    address: "Av. Corrientes 1234, C1043 CABA",
    postalCode: "C1043",
    coordinates: { lat: -34.6037, lng: -58.3816 },
    growthPercent: 22,
    properties: 89,
    active: 67,
    sold: 12,
    revenue: 3.5,
    agents: 15,
    avgPricePerM2: 425000,
    distribution: { houses: 34, apartments: 42, lots: 8, commercial: 5 },
    activity: [
      {
        id: "ba-1",
        title: "New property listed",
        description: "Modern Apartment in Downtown",
        timeAgo: "2 hours ago",
        icon: PackagePlus,
        iconBg: "rgba(16,185,129,0.08)",
        iconColor: "#10b981",
      },
      {
        id: "ba-2",
        title: "New agent assigned",
        description: "Maria López joined the Buenos Aires team",
        timeAgo: "1 day ago",
        icon: UserPlus,
        iconBg: "rgba(30,79,134,0.08)",
        iconColor: "#1e4f86",
      },
    ],
  },
  {
    id: "la-plata",
    name: "La Plata",
    region: "Buenos Aires",
    address: "Calle 7 N° 850, B1900 La Plata",
    postalCode: "B1900",
    coordinates: { lat: -34.9215, lng: -57.9545 },
    growthPercent: 15,
    properties: 52,
    active: 38,
    sold: 8,
    revenue: 1.2,
    agents: 8,
    avgPricePerM2: 312000,
    distribution: { houses: 24, apartments: 18, lots: 7, commercial: 3 },
    activity: [
      {
        id: "lp-1",
        title: "Property sold",
        description: "3-Bedroom House near Plaza Moreno",
        timeAgo: "5 hours ago",
        icon: PackagePlus,
        iconBg: "rgba(16,185,129,0.08)",
        iconColor: "#10b981",
      },
    ],
  },
  {
    id: "cordoba",
    name: "Córdoba",
    region: "Córdoba",
    address: "Av. Colón 540, X5000 Córdoba",
    postalCode: "X5000",
    coordinates: { lat: -31.4201, lng: -64.1888 },
    growthPercent: 8,
    properties: 34,
    active: 28,
    sold: 5,
    revenue: 0.89,
    agents: 6,
    avgPricePerM2: 198000,
    distribution: { houses: 16, apartments: 12, lots: 4, commercial: 2 },
    activity: [
      {
        id: "co-1",
        title: "Listing updated",
        description: "Price adjusted for Loft in Nueva Córdoba",
        timeAgo: "3 days ago",
        icon: PackagePlus,
        iconBg: "rgba(245,158,11,0.08)",
        iconColor: "#f59e0b",
      },
    ],
  },
  {
    id: "rosario",
    name: "Rosario",
    region: "Santa Fe",
    address: "Bv. Oroño 1100, S2000 Rosario",
    postalCode: "S2000",
    coordinates: { lat: -32.9468, lng: -60.6393 },
    growthPercent: 12,
    properties: 41,
    active: 32,
    sold: 7,
    revenue: 1.05,
    agents: 5,
    avgPricePerM2: 245000,
    distribution: { houses: 19, apartments: 15, lots: 5, commercial: 2 },
    activity: [
      {
        id: "ro-1",
        title: "New property listed",
        description: "Riverside Apartment with City View",
        timeAgo: "6 hours ago",
        icon: PackagePlus,
        iconBg: "rgba(16,185,129,0.08)",
        iconColor: "#10b981",
      },
    ],
  },
  {
    id: "mar-del-plata",
    name: "Mar del Plata",
    region: "Buenos Aires",
    address: "Av. Constitución 4500, B7600 Mar del Plata",
    postalCode: "B7600",
    coordinates: { lat: -38.0055, lng: -57.5426 },
    growthPercent: 45,
    properties: 0,
    active: 0,
    sold: 0,
    revenue: 0.06,
    agents: 2,
    avgPricePerM2: 175000,
    distribution: { houses: 0, apartments: 0, lots: 0, commercial: 0 },
    activity: [
      {
        id: "mdp-1",
        title: "New office opened",
        description: "Mar del Plata branch is now active",
        timeAgo: "1 week ago",
        icon: PackagePlus,
        iconBg: "rgba(30,79,134,0.08)",
        iconColor: "#1e4f86",
      },
    ],
  },
];
