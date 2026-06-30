"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  LayoutGrid,
  Plug,
  Zap,
  Calendar,
  CheckCircle2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { queryKeys } from "@/lib/query-keys";
import { useGoogleCalendarStatusQuery } from "@/hooks/queries/useGoogleCalendarStatusQuery";
import {
  MOCK_INTEGRATIONS,
  type Integration,
  type IntegrationPermission,
  type IntegrationSettingField,
} from "./integrations-data";
import {
  RequestIntegrationModal,
  type NewIntegrationRequest,
} from "./components/RequestIntegrationModal";
import { IntegrationDetailModal } from "./components/IntegrationDetailModal";
import { GoogleCalendarManageModal } from "./components/GoogleCalendarManageModal";

const GOOGLE_CALENDAR_ID = "google-calendar";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function defaultSettings(name: string): IntegrationSettingField[] {
  return [
    {
      type: "password",
      id: "apiKey",
      label: "API Key",
      value: "",
    },
    {
      type: "text",
      id: "webhookUrl",
      label: "Webhook URL",
      value: `https://api.ulrichpropiedades.com/webhooks/${name
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    },
    {
      type: "select",
      id: "syncFrequency",
      label: "Sync Frequency",
      value: "Every hour",
      options: [
        "Every 15 minutes",
        "Every 30 minutes",
        "Every hour",
        "Every 6 hours",
        "Daily",
      ],
    },
  ];
}

function defaultPermissions(): IntegrationPermission[] {
  return [
    {
      id: "read",
      label: "Read data",
      enabled: true,
    },
    {
      id: "write",
      label: "Write data",
      enabled: false,
    },
  ];
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({
  label,
  value,
  iconBg,
  icon,
}: StatCardProps) {
  return (
    <div className="w-full min-w-0 min-h-[112px] bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between gap-3">
        <p
          className="min-w-0 text-[13px] sm:text-[14px] text-[#6a7282] break-words"
          style={mont}
        >
          {label}
        </p>

        <span
          className="size-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>

      <p
        className="text-[22px] sm:text-[24px] font-semibold text-[#1e4f86] leading-[28px]"
        style={poppins}
      >
        {value}
      </p>
    </div>
  );
}

// ── Integration card ─────────────────────────────────────────────────────────

type IntegrationCardProps = {
  integration: Integration;
  canManage: boolean;
  onConnect: (id: string) => void;
  onManage: (id: string) => void;
};

function IntegrationCard({
  integration,
  canManage,
  onConnect,
  onManage,
}: IntegrationCardProps) {
  const Icon = integration.icon;
  const isConnected = integration.status === "Connected";

  return (
    <div className="w-full min-w-0 h-full bg-white border border-[#e5e7eb] rounded-[14px] p-4 sm:p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="size-12 sm:size-14 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: integration.iconBg }}
        >
          <Icon
            size={24}
            style={{ color: integration.iconColor }}
          />
        </div>

        {isConnected ? (
          <span
            className="min-h-[24.5px] px-2.5 sm:px-3 py-1 rounded-full bg-[#ecfdf5] flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#10b981] shrink-0"
            style={mont}
          >
            <CheckCircle2 size={12} />
            Connected
          </span>
        ) : (
          <span
            className="min-h-[24.5px] px-2.5 sm:px-3 py-1 rounded-full bg-[#f3f4f6] flex items-center text-[10px] sm:text-[11px] font-semibold text-[#6b7280] shrink-0"
            style={mont}
          >
            Available
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <p
          className="text-[15px] sm:text-[16px] font-semibold text-[#0d2138] break-words"
          style={mont}
        >
          {integration.name}
        </p>

        <p
          className="text-[12px] font-medium leading-5 text-[#6a7282] break-words"
          style={mont}
        >
          {integration.description}
        </p>
      </div>

      {isConnected ? (
        <button
          type="button"
          onClick={() => onManage(integration.id)}
          className="w-full min-h-[38px] bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] px-4 text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
          style={mont}
        >
          Manage
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onConnect(integration.id)}
          disabled={!canManage}
          className="w-full min-h-[38px] bg-[#1e4f86] rounded-[10px] px-4 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={mont}
        >
          Connect
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type IntegrationsPageProps = {
  role: Role;
};

export function IntegrationsPage({
  role,
}: IntegrationsPageProps) {
  const queryClient = useQueryClient();
  const calendarStatus = useGoogleCalendarStatusQuery();

  const [integrations, setIntegrations] =
    useState<Integration[]>(MOCK_INTEGRATIONS);

  const [showRequestModal, setShowRequestModal] =
    useState(false);

  const [manageId, setManageId] =
    useState<string | null>(null);

  const [showGoogleCalendarManage, setShowGoogleCalendarManage] =
    useState(false);

  const canManage = hasPermission(
    role,
    "integrations:manage",
  );

  // Google Calendar's status comes from the real connection, not local mock
  // state — every other card here is still purely decorative.
  const displayIntegrations = integrations.map((integration) =>
    integration.id === GOOGLE_CALENDAR_ID
      ? { ...integration, status: calendarStatus.data?.status.connected ? "Connected" as const : "Available" as const }
      : integration,
  );

  const connected = displayIntegrations.filter(
    (integration) =>
      integration.status === "Connected",
  );

  const available = displayIntegrations.filter(
    (integration) =>
      integration.status === "Available",
  );

  const manageIntegration =
    displayIntegrations.find(
      (integration) => integration.id === manageId,
    ) ?? null;

  function handleConnect(id: string) {
    if (id === GOOGLE_CALENDAR_ID) {
      window.location.href = "/api/integrations/google-calendar/connect";
      return;
    }

    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: "Connected",
              lastSynced: "just now",
              settings:
                integration.settings ??
                defaultSettings(integration.name),
              permissions:
                integration.permissions ??
                defaultPermissions(),
            }
          : integration,
      ),
    );

    setManageId(id);
  }

  function handleManage(id: string) {
    if (id === GOOGLE_CALENDAR_ID) {
      setShowGoogleCalendarManage(true);
      return;
    }
    setManageId(id);
  }

  async function handleGoogleCalendarDisconnect() {
    await fetch("/api/integrations/google-calendar/disconnect", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: queryKeys.googleCalendarStatus() });
  }

  function handleSave(
    id: string,
    settings: IntegrationSettingField[],
    permissions: IntegrationPermission[],
  ) {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              settings,
              permissions,
            }
          : integration,
      ),
    );
  }

  function handleDisconnect(id: string) {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: "Available",
            }
          : integration,
      ),
    );
  }

  function handleRequestSubmit(
    _request: NewIntegrationRequest,
  ) {
    setShowRequestModal(false);
  }

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 lg:px-6 flex flex-col gap-5">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h1
            className="text-[20px] font-medium text-[#0d2138] leading-[30px] sm:leading-[32px]"
            style={poppins}
          >
            Integration
          </h1>

          <p
            className="text-[13px] sm:text-[14px] font-medium leading-5 text-[#6a7282]"
            style={mont}
          >
            Connect your favorite tools and apps
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="w-full sm:w-auto min-h-10 px-4 py-2.5 bg-[#1e4f86] text-white rounded-[10px] flex items-center justify-center gap-2 text-[13px] sm:text-[14px] font-medium hover:bg-[#1b487a] transition-colors shrink-0"
            style={mont}
          >
            <Plus size={16} />
            Request Integration
          </button>
        )}
      </div>

      {/* Stat cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Integrations"
          value={integrations.length}
          iconBg="#e0e7ff"
          icon={
            <LayoutGrid
              size={18}
              className="text-[#6366f1]"
            />
          }
        />

        <StatCard
          label="Connected"
          value={connected.length}
          iconBg="#d1fae5"
          icon={
            <Plug
              size={18}
              className="text-[#10b981]"
            />
          }
        />

        <StatCard
          label="Available"
          value={available.length}
          iconBg="#fef3c7"
          icon={
            <Zap
              size={18}
              className="text-[#f59e0b]"
            />
          }
        />

        <StatCard
          label="Active This Month"
          value={connected.length}
          iconBg="#dbeafe"
          icon={
            <Calendar
              size={18}
              className="text-[#1e4f86]"
            />
          }
        />
      </div>

      {/* Integration cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayIntegrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            // Google Calendar is a personal connection — every staff member who
            // can see this page can connect/disconnect their own, regardless of
            // the org-wide "integrations:manage" permission below.
            canManage={integration.id === GOOGLE_CALENDAR_ID ? true : canManage}
            onConnect={handleConnect}
            onManage={handleManage}
          />
        ))}
      </div>

      {showRequestModal && (
        <RequestIntegrationModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestSubmit}
        />
      )}

      {manageIntegration && (
        <IntegrationDetailModal
          integration={manageIntegration}
          onClose={() => setManageId(null)}
          onSave={(settings, permissions) =>
            handleSave(
              manageIntegration.id,
              settings,
              permissions,
            )
          }
          onDisconnect={() =>
            handleDisconnect(manageIntegration.id)
          }
        />
      )}

      {showGoogleCalendarManage && (
        <GoogleCalendarManageModal
          email={calendarStatus.data?.status.email ?? null}
          onClose={() => setShowGoogleCalendarManage(false)}
          onDisconnect={handleGoogleCalendarDisconnect}
        />
      )}
    </div>
  );
}