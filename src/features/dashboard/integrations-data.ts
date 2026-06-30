// Shared types + mock data for the dashboard Integrations page.

import {
  Calendar,
  Mail,
  MessageCircle,
  Zap,
  PenTool,
  CreditCard,
  Building2,
  Box,
  Database,
  type LucideIcon,
} from "lucide-react";

export type IntegrationStatus = "Connected" | "Available";

export type IntegrationPermission = {
  id: string;
  label: string;
  enabled: boolean;
};

export type IntegrationSettingField =
  | { type: "text" | "password"; id: string; label: string; value: string }
  | { type: "select"; id: string; label: string; value: string; options: string[] };

export type Integration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  lastSynced?: string;
  settings?: IntegrationSettingField[];
  permissions?: IntegrationPermission[];
};

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    // Real connection — IntegrationsPage overrides this entry's status from
    // useGoogleCalendarStatusQuery() and routes its Connect/Manage actions to
    // the real OAuth flow instead of the generic mock toggle below.
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync tour appointments to your calendar",
    status: "Available",
    icon: Calendar,
    iconBg: "#e8f0fe",
    iconColor: "#1e4f86",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing automation",
    status: "Connected",
    icon: Mail,
    iconBg: "#ffedd4",
    iconColor: "#f97316",
    lastSynced: "1 hour ago",
    settings: [
      { type: "password", id: "apiKey", label: "API Key", value: "md-xxxxxxxxxxxxxxxxxxxx" },
      { type: "text", id: "webhookUrl", label: "Webhook URL", value: "https://api.ulrichpropiedades.com/webhooks/mailchimp" },
      { type: "select", id: "syncFrequency", label: "Sync Frequency", value: "Every hour", options: ["Every 15 minutes", "Every 30 minutes", "Every hour", "Every 6 hours", "Daily"] },
    ],
    permissions: [
      { id: "read-contacts", label: "Read contacts", enabled: true },
      { id: "sync-lists", label: "Sync subscriber lists", enabled: true },
      { id: "send-campaigns", label: "Send campaigns", enabled: false },
      { id: "delete-contacts", label: "Delete contacts", enabled: false },
    ],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Team communication",
    status: "Available",
    icon: MessageCircle,
    iconBg: "#f4e8ff",
    iconColor: "#a855f7",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect 5000+ apps",
    status: "Available",
    icon: Zap,
    iconBg: "#ffe8db",
    iconColor: "#fb6514",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "Electronic signature",
    status: "Connected",
    icon: PenTool,
    iconBg: "#fef3c6",
    iconColor: "#d08700",
    lastSynced: "5 hours ago",
    settings: [
      { type: "password", id: "apiKey", label: "API Key", value: "ds-xxxxxxxxxxxxxxxxxxxx" },
      { type: "text", id: "webhookUrl", label: "Webhook URL", value: "https://api.ulrichpropiedades.com/webhooks/docusign" },
      { type: "select", id: "syncFrequency", label: "Sync Frequency", value: "Every 30 minutes", options: ["Every 15 minutes", "Every 30 minutes", "Every hour", "Every 6 hours", "Daily"] },
    ],
    permissions: [
      { id: "view-documents", label: "View documents", enabled: true },
      { id: "send-for-signature", label: "Send for signature", enabled: true },
      { id: "download-signed", label: "Download signed documents", enabled: true },
      { id: "delete-documents", label: "Delete documents", enabled: false },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing",
    status: "Available",
    icon: CreditCard,
    iconBg: "#eeebff",
    iconColor: "#6d28d9",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM and sales automation",
    status: "Available",
    icon: Building2,
    iconBg: "#e0f5ff",
    iconColor: "#0ea5e9",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Cloud storage and file sharing",
    status: "Available",
    icon: Box,
    iconBg: "#e6f0ff",
    iconColor: "#2563eb",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Database integration",
    status: "Available",
    icon: Database,
    iconBg: "#e8eff5",
    iconColor: "#475569",
  },
];
