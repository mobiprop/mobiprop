import {
  House,
  Mail,
  UsersRound,
  ContactRound,
  FileSignature,
  Building2,
  TrendingUp,
  Target,
  Newspaper,
  Plug,
  MapPin,
  Settings,
  CircleHelp,
  SendHorizontal,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export type DashboardNavItem = {
  // English fallback label; the rendered text comes from the "dashboard"
  // i18n namespace at `nav.items.${key}` (see Sidebar.tsx).
  label: string;
  key: string;
  href: string;
  icon: LucideIcon;

  // Permission required to see this item.
  // Items without permission are always shown.
  permission?: Permission;
};

export type DashboardNavSection = {
  // English fallback title; the rendered text comes from the "dashboard"
  // i18n namespace at `nav.sections.${key}` (see Sidebar.tsx).
  title: string;
  key: string;
  items: DashboardNavItem[];
};

export const DASHBOARD_NAV: DashboardNavSection[] = [
  {
    title: "Main Menu",
    key: "mainMenu",
    items: [
      {
        label: "Dashboard",
        key: "dashboard",
        href: "/dashboard",
        icon: House,
        permission: "dashboard:view",
      },
      {
        label: "Messages",
        key: "messages",
        href: "/dashboard/messages",
        icon: Mail,
        permission: "messages:view",
      },
    ],
  },
  {
    title: "Management",
    key: "management",
    items: [
      {
        label: "Agents",
        key: "agents",
        href: "/dashboard/agents",
        icon: UsersRound,
        permission: "agents:view",
      },
      {
        label: "Contacts",
        key: "contacts",
        href: "/dashboard/contacts",
        icon: ContactRound,
        permission: "contacts:view",
      },
      {
        label: "Listings",
        key: "listings",
        href: "/dashboard/listings",
        icon: Building2,
        permission: "listings:view",
      },
      {
        label: "Leads",
        key: "leads",
        href: "/dashboard/leads",
        icon: TrendingUp,
        permission: "leads:view",
      },
      {
        label: "Opportunities",
        key: "opportunities",
        href: "/dashboard/opportunities",
        icon: Target,
        permission: "opportunities:view",
      },
      {
        label: "DocuSign",
        key: "docusign",
        href: "/dashboard/docusign",
        icon: FileSignature,
        permission: "docusign:view",
      },
      {
        label: "SendGrid",
        key: "sendgrid",
        href: "/dashboard/sendgrid",
        icon: SendHorizontal,
        permission: "sendgrid:view",
      },
      {
        label: "Blog",
        key: "blog",
        href: "/dashboard/blog",
        icon: Newspaper,
        permission: "blog:view",
      },
    ],
  },
  {
    title: "Preferences",
    key: "preferences",
    items: [
      {
        label: "Integrations",
        key: "integrations",
        href: "/dashboard/integrations",
        icon: Plug,
        permission: "integrations:view",
      },
      {
        label: "Locations",
        key: "locations",
        href: "/dashboard/locations",
        icon: MapPin,
        permission: "locations:view",
      },
      {
        label: "Settings",
        key: "settings",
        href: "/dashboard/settings",
        icon: Settings,
        permission: "settings:view",
      },
      {
        label: "Help Center",
        key: "help",
        href: "/dashboard/help",
        icon: CircleHelp,
      },
    ],
  },
];