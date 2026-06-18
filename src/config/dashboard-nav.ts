import {
  House,
  Mail,
  UsersRound,
  ContactRound,
  FileText,
  Building2,
  TrendingUp,
  Target,
  Plug,
  MapPin,
  Settings,
  CircleHelp,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;

  // Permission required to see this item.
  // Items without permission are always shown.
  permission?: Permission;
};

export type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

export const DASHBOARD_NAV: DashboardNavSection[] = [
  {
    title: "Main Menu",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: House,
        permission: "dashboard:view",
      },
      {
        label: "Messages",
        href: "/dashboard/messages",
        icon: Mail,
        permission: "messages:view",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Agents",
        href: "/dashboard/agents",
        icon: UsersRound,
        permission: "agents:view",
      },
      {
        label: "Contacts",
        href: "/dashboard/contacts",
        icon: ContactRound,
        permission: "contacts:view",
      },
      {
        label: "Contracts",
        href: "/dashboard/contracts",
        icon: FileText,
        permission: "contracts:view",
      },
      {
        label: "Listings",
        href: "/dashboard/listings",
        icon: Building2,
        permission: "listings:view",
      },
      {
        label: "Leads",
        href: "/dashboard/leads",
        icon: TrendingUp,
        permission: "leads:view",
      },
      {
        label: "Tours",
        href: "/dashboard/tours",
        icon: CalendarCheck,
        permission: "tours:view",
      },
      {
        label: "Opportunities",
        href: "/dashboard/opportunities",
        icon: Target,
        permission: "opportunities:view",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        label: "Integrations",
        href: "/dashboard/integrations",
        icon: Plug,
        permission: "integrations:view",
      },
      {
        label: "Locations",
        href: "/dashboard/locations",
        icon: MapPin,
        permission: "locations:view",
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        permission: "settings:view",
      },
      {
        label: "Help Center",
        href: "/dashboard/help",
        icon: CircleHelp,
      },
    ],
  },
];