"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  DollarSign,
  Check,
  X,
  Mail,
  Medal,
  Handshake,
  Star,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { formatCurrency } from "@/lib/formatters";
import { AddAgentModal } from "./components/AddAgentModal";
import { EditAgentModal } from "./components/EditAgentModal";
import { SearchableSelect } from "./components/SearchableSelect";
import { useDashboardAgentsQuery } from "@/hooks/queries/useDashboardAgentsQuery";
import type { AgentDto } from "@/features/agents/agent-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentStatus = "Approved" | "Pending" | "Denied";
type PeriodFilter = "this_week" | "this_month" | "last_month" | "all";

// Displayed labels are translated via i18n (see PERIOD_I18N_KEY / STATUS_I18N_KEY
// below); these values stay in stable English because they're compared against
// directly and stored in component state.
const PERIOD_I18N_KEY: Record<PeriodFilter, string> = {
  this_week: "period.thisWeek",
  this_month: "period.thisMonth",
  last_month: "period.lastMonth",
  all: "period.allTime",
};

const STATUS_I18N_KEY: Record<AgentStatus | "All", string> = {
  All: "status.all",
  Approved: "status.approved",
  Pending: "status.pending",
  Denied: "status.denied",
};

function getPeriodBounds(period: PeriodFilter): { from: Date; to: Date } | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "this_week") {
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return { from: monday, to: now };
  }
  if (period === "this_month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  // last_month
  const firstOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfLast  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from: firstOfLast, to: lastOfLast };
}

function mapStatus(status: AgentDto["status"]): AgentStatus {
  if (status === "ACTIVE") return "Approved";
  if (status === "PENDING" || status === "INVITED") return "Pending";
  return "Denied";
}

function mapRole(role: AgentDto["role"], t: (key: string) => string): string {
  if (role === "ADMIN") return t("role.administrator");
  if (role === "MANAGER") return t("role.manager");
  return t("role.agent");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  /** Positive-trend callout (green, with an up arrow). Omit when there's no real trend to show. */
  trend?: string;
  /** Plain explanatory subtext, shown when `trend` isn't provided. */
  note?: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, trend, note, iconBg, icon }: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[14px] p-[18px] flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</p>
        {trend ? (
          <p className="flex items-center gap-1 text-[14px] font-medium text-[#00c950] mt-1" style={mont}>
            <span aria-hidden="true">↑</span>
            <span>{trend}</span>
          </p>
        ) : note ? (
          <p className="text-[14px] font-medium text-[#6a7282] mt-1" style={mont}>{note}</p>
        ) : null}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AgentStatus, { bg: string; border: string; text: string }> = {
  Approved: { bg: "#f5fffa", border: "#89d8a9", text: "#00aa4f" },
  Pending:  { bg: "#fffcf5", border: "#ffd384", text: "#ffa80a" },
  Denied:   { bg: "#fff5f5", border: "#f49e9e", text: "#fb2c36" },
};

function StatusBadge({ status, t }: { status: AgentStatus; t: (key: string) => string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center px-3 py-[7px] rounded-[8px] text-[14px]"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text, ...mont }}
    >
      {t(STATUS_I18N_KEY[status])}
    </span>
  );
}

// ── Row actions menu (kebab → Edit / Delete) ─────────────────────────────────

type AgentActionsMenuProps = {
  agent: AgentDto;
  isOpen: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  variant?: "icon" | "full-width";
  t: (key: string, opts?: Record<string, unknown>) => string;
};

function AgentActionsMenu({
  agent,
  isOpen,
  canEdit,
  canDelete,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  variant = "icon",
  t,
}: AgentActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 160 });

  // Rendered via a portal to `document.body` and positioned with `fixed`
  // coordinates computed from the trigger button — the table/card wrappers
  // use `overflow-hidden` for rounded corners, which clipped this menu
  // whenever it was absolutely positioned inside them (worst near the last
  // row, where there's no room below before the container's edge).
  useLayoutEffect(() => {
    if (!isOpen) return;
    const button = buttonRef.current;
    if (!button) return;

    function updatePosition() {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = variant === "full-width" ? rect.width : 160;
      const menuHeight = (canEdit ? 1 : 0) * 40 + (canDelete ? 1 : 0) * 40 + 8;
      const gap = 4;
      const padding = 8;

      let left = variant === "full-width" ? rect.left : rect.right - menuWidth;
      let top = rect.bottom + gap;
      if (left < padding) left = padding;
      if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
      if (top + menuHeight > window.innerHeight - padding) top = rect.top - menuHeight - gap;
      setPosition({ top, left, width: menuWidth });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, variant, canEdit, canDelete]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!canEdit && !canDelete) {
    return (
      <span className="text-[14px] text-[#99a1af]" style={mont}>
        {t("table.noActions")}
      </span>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={t("table.moreActions")}
        aria-label={t("table.moreActionsAria", { name: agent.name })}
        onClick={onToggle}
        className={
          variant === "full-width"
            ? "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white text-[14px] font-medium text-[#0d2138] transition-colors active:scale-[0.99]"
            : "inline-flex size-8 items-center justify-center rounded-[7px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        }
      >
        <MoreVertical size={variant === "full-width" ? 17 : 14} />
        {variant === "full-width" && t("table.moreActionsFullWidth")}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-lg"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] text-[#0d2138] transition-colors hover:bg-[#f8fafc]"
                style={mont}
              >
                <Pencil size={14} />
                {t("table.edit")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] text-[#fb2c36] transition-colors hover:bg-[#fff5f5]"
                style={mont}
              >
                <Trash2 size={14} />
                {t("table.delete")}
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type AgentsPageProps = {
  role: Role;
};

export function AgentsPage({ role }: AgentsPageProps) {
  const { t } = useTranslation("agents");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "All">("All");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentDto | null>(null);

  const canInvite = hasPermission(role, "agents:invite");
  const canApprove = hasPermission(role, "agents:update");
  const canEdit = hasPermission(role, "agents:update");
  const canDelete = hasPermission(role, "agents:delete");
  const canViewInvitations = hasPermission(role, "invitations:view");
  const canViewRevenue = hasPermission(role, "dashboard:viewCompanyRevenue");

  const { data, isLoading: loading, refetch: fetchAgents } = useDashboardAgentsQuery();
  const agents = data?.agents ?? [];
  const metrics = data?.metrics ?? null;

  async function handleApprove(agentId: string) {
    setActioningId(agentId);
    await fetch(`/api/dashboard/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    await fetchAgents();
    setActioningId(null);
  }

  // Declining a pending/invited agent means they were never approved in the
  // first place, so there's no account to keep around — remove it outright
  // instead of just flipping status to INACTIVE.
  async function handleDeny(agentId: string) {
    setActioningId(agentId);
    try {
      const res = await fetch(`/api/dashboard/agents/${agentId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.error ?? t("toasts.declineFailed"));
        return;
      }
      toast.success(t("toasts.declinedSuccess"));
      await fetchAgents();
    } finally {
      setActioningId(null);
    }
  }

  async function handleDelete(agent: AgentDto) {
    const confirmed = window.confirm(t("confirmDelete", { name: agent.name }));
    if (!confirmed) return;

    setActioningId(agent.id);
    try {
      const res = await fetch(`/api/dashboard/agents/${agent.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.error ?? t("toasts.deleteFailed"));
        return;
      }
      toast.success(t("toasts.deletedSuccess"));
      await fetchAgents();
    } finally {
      setActioningId(null);
    }
  }

  const periodBounds = getPeriodBounds(period);

  const filtered = agents.filter((a) => {
    const mapped = mapStatus(a.status);
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || mapped === statusFilter;
    const signedUp = new Date(a.createdAt);
    const matchesPeriod = !periodBounds || (signedUp >= periodBounds.from && signedUp <= periodBounds.to);
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px]" style={poppins}>{t("page.title")}</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>{t("page.subtitle")}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          {canViewInvitations && (
            <Link
              href="/dashboard/agents/invitations"
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f8fafc] sm:px-4"
              style={mont}
            >
              <Mail size={16} className="shrink-0" />
              <span className="truncate">{t("actions.invitations")}</span>
            </Link>
          )}
          {canInvite && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:px-4"
              style={mont}
            >
              <Plus size={16} className="shrink-0" />
              <span className="truncate">{t("actions.addAgent")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
  <StatCard
    label={t("stats.totalAgents")}
    value={metrics ? String(metrics.total) : "—"}
    trend={metrics && metrics.newThisMonth > 0 ? t("stats.newThisMonth", { count: metrics.newThisMonth }) : undefined}
    note={metrics && metrics.newThisMonth === 0 ? t("stats.noNewAgentsThisMonth") : undefined}
    iconBg="#e7ebff"
    icon={
      <Medal
        size={17}
        strokeWidth={1.8}
        className="text-[#6274f5]"
      />
    }
  />

  <StatCard
    label={t("stats.activeDeals")}
    value={metrics ? String(metrics.activeDeals) : "—"}
    trend={metrics && metrics.activeDealsNewThisMonth > 0 ? t("stats.newThisMonth", { count: metrics.activeDealsNewThisMonth }) : undefined}
    note={metrics && metrics.activeDealsNewThisMonth === 0 ? t("stats.openOpportunities") : undefined}
    iconBg="#e6faf3"
    icon={
      <Handshake
        size={18}
        strokeWidth={1.8}
        className="text-[#08bd87]"
      />
    }
  />

  <StatCard
    label={t("stats.totalRevenue")}
    value={!canViewRevenue ? "—" : metrics ? formatCurrency(metrics.totalRevenue) : "—"}
    note={!canViewRevenue ? t("stats.adminManagerOnly") : t("stats.fromClosedWonOpportunities")}
    iconBg="#fff1c7"
    icon={
      <DollarSign
        size={18}
        strokeWidth={1.8}
        className="text-[#ff9700]"
      />
    }
  />

  <StatCard
    label={t("stats.totalListings")}
    value={metrics ? String(metrics.totalListings) : "—"}
    trend={metrics && metrics.totalListingsNewThisMonth > 0 ? t("stats.newThisMonth", { count: metrics.totalListingsNewThisMonth }) : undefined}
    note={metrics && metrics.totalListingsNewThisMonth === 0 ? t("stats.allListings") : undefined}
    iconBg="#fff2e8"
    icon={
      <Star
        size={18}
        strokeWidth={1.8}
        className="text-[#ff7214]"
      />
    }
  />
</div>

      {/* Agents table */}
      <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
        {/* Header and controls */}
        <div className="border-b border-[#f3f4f6] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2
              className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
              style={mont}
            >
              {t("table.title")}
            </h2>

            <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
              {/* Search */}
              <div className="col-span-2 flex h-11 min-w-0 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 focus-within:border-[#1e4f86] sm:h-9 sm:w-[200px]">
                <Search
                  size={16}
                  className="shrink-0 text-[#99a1af]"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("table.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[12px]"
                  style={mont}
                />
              </div>

              {/* Status filter */}
              <SearchableSelect
                size="sm"
                searchable={false}
                value={statusFilter}
                onChange={(next) => setStatusFilter(next as AgentStatus | "All")}
                options={(["All", "Approved", "Pending", "Denied"] as const).map((value) => ({
                  value,
                  label: t(STATUS_I18N_KEY[value]),
                }))}
                placeholder={t("status.all")}
                ariaLabel={t("table.filterByStatusAria")}
                className="min-w-0 sm:min-w-[120px]"
              />

              {/* Period */}
              <SearchableSelect
                size="sm"
                searchable={false}
                value={period}
                onChange={(next) => setPeriod(next as PeriodFilter)}
                options={(Object.keys(PERIOD_I18N_KEY) as PeriodFilter[]).map((value) => ({
                  value,
                  label: t(PERIOD_I18N_KEY[value]),
                }))}
                placeholder={t("table.periodPlaceholder")}
                ariaLabel={t("table.filterByPeriodAria")}
                className="min-w-0 sm:min-w-[120px]"
              />
            </div>
          </div>
        </div>

  {/* Desktop and tablet table */}
  <div className="hidden overflow-x-auto sm:block">
    <table className="w-full min-w-[800px]">
      <thead>
        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
          {[
            { key: "agents", label: t("table.columns.agents") },
            { key: "role", label: t("table.columns.role") },
            { key: "contact", label: t("table.columns.contact") },
            { key: "location", label: t("table.columns.location") },
            { key: "signUpDate", label: t("table.columns.signUpDate") },
            { key: "status", label: t("table.columns.status") },
            { key: "actions", label: t("table.columns.actions") },
          ].map((heading) => (
            <th
              key={heading.key}
              className={`px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] ${
                heading.key === "status" || heading.key === "actions"
                  ? "text-center"
                  : ""
              }`}
              style={mont}
            >
              {heading.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              {t("table.loadingAgents")}
            </td>
          </tr>
        ) : (
          filtered.map((agent) => {
            const mappedStatus = mapStatus(agent.status);
            const isActioned =
              mappedStatus === "Approved" || mappedStatus === "Denied";
            const isActioning = actioningId === agent.id;

            return (
              <tr
                key={agent.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-b-0 hover:bg-[#fcfcfd]"
              >
                <td className="w-[220px] px-4 py-4">
                  <div className="flex items-center gap-3">
                    {agent.avatarUrl ? (
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white"
                        style={mont}
                      >
                        {agent.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    )}

                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86] hover:underline"
                      style={mont}
                    >
                      {agent.name}
                    </Link>
                  </div>
                </td>

                <td className="w-[172px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    {mapRole(agent.role, t)}
                  </span>
                </td>

                <td className="w-[200px] px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className="whitespace-nowrap text-[14px] text-[#0d2138]"
                      style={mont}
                    >
                      {agent.email}
                    </span>

                    <span
                      className="whitespace-nowrap text-[12px] text-[#6a7282]"
                      style={mont}
                    >
                      {agent.phone ?? "—"}
                    </span>
                  </div>
                </td>

                <td className="w-[136px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {agent.city ?? "—"}
                  </span>
                </td>

                <td className="w-[144px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {formatDate(agent.createdAt)}
                  </span>
                </td>

                <td className="w-[144px] px-4 py-4">
                  <StatusBadge status={mappedStatus} t={t} />
                </td>

                <td className="w-[134px] px-4 py-4 text-center">
                  {isActioning ? (
                    <span
                      className="text-[14px] text-[#99a1af]"
                      style={mont}
                    >
                      {t("table.updating")}
                    </span>
                  ) : isActioned ? (
                    canEdit || canDelete ? (
                      <AgentActionsMenu
                        agent={agent}
                        isOpen={menuOpenId === agent.id}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onToggle={() => setMenuOpenId(menuOpenId === agent.id ? null : agent.id)}
                        onClose={() => setMenuOpenId(null)}
                        onEdit={() => { setMenuOpenId(null); setEditingAgent(agent); }}
                        onDelete={() => { setMenuOpenId(null); handleDelete(agent); }}
                        t={t}
                      />
                    ) : (
                      <span
                        className="text-[14px] text-[#6a7282]"
                        style={mont}
                      >
                        {t(STATUS_I18N_KEY[mappedStatus])}
                      </span>
                    )
                  ) : canApprove ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title={t("table.approve")}
                        aria-label={t("table.approveAria", { name: agent.name })}
                        onClick={() => handleApprove(agent.id)}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#7bf1a8] bg-white transition-colors hover:bg-[#f5fffa]"
                      >
                        <Check size={14} className="text-[#00aa4f]" />
                      </button>

                      <button
                        type="button"
                        title={t("table.deny")}
                        aria-label={t("table.denyAria", { name: agent.name })}
                        onClick={() => handleDeny(agent.id)}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#ffa2a2] bg-white transition-colors hover:bg-[#fff5f5]"
                      >
                        <X size={14} className="text-[#fb2c36]" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="text-[14px] text-[#99a1af]"
                      style={mont}
                    >
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        )}

        {!loading && filtered.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              {t("table.noAgentsFound")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="bg-[#f8fafc] p-3 sm:hidden">
    {loading ? (
      <div
        className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
        style={mont}
      >
        {t("table.loadingAgents")}
      </div>
    ) : filtered.length === 0 ? (
      <div
        className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
        style={mont}
      >
        {t("table.noAgentsFound")}
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        {filtered.map((agent) => {
          const mappedStatus = mapStatus(agent.status);
          const isActioned =
            mappedStatus === "Approved" || mappedStatus === "Denied";
          const isActioning = actioningId === agent.id;

          return (
            <article
              key={agent.id}
              className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              {/* Agent top details */}
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {agent.avatarUrl ? (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                      style={mont}
                    >
                      {agent.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="block truncate text-[14px] font-semibold text-[#1e4f86] hover:underline"
                      style={mont}
                    >
                      {agent.name}
                    </Link>

                    <p
                      className="mt-1 truncate text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {mapRole(agent.role, t)}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={mappedStatus} t={t} />
                </div>
              </div>

              {/* Contact */}
              <div className="mx-4 rounded-[10px] bg-[#f8fafc] p-3">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  {t("table.contactLabel")}
                </p>

                <p
                  className="mt-1.5 break-all text-[14px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {agent.email}
                </p>

                <p
                  className="mt-1.5 text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {agent.phone ?? t("table.phoneNotAvailable")}
                </p>
              </div>

              {/* Other details */}
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    {t("table.locationLabel")}
                  </p>

                  <p
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {agent.city ?? "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    {t("table.signUpDateLabel")}
                  </p>

                  <p
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {formatDate(agent.createdAt)}
                  </p>
                </div>
              </div>

              {/* Mobile actions */}
              <div className="border-t border-[#f3f4f6] p-4">
                {isActioning ? (
                  <div
                    className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    {t("table.updating")}
                  </div>
                ) : isActioned ? (
                  canEdit || canDelete ? (
                    <AgentActionsMenu
                      agent={agent}
                      isOpen={menuOpenId === agent.id}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onToggle={() => setMenuOpenId(menuOpenId === agent.id ? null : agent.id)}
                      onClose={() => setMenuOpenId(null)}
                      onEdit={() => { setMenuOpenId(null); setEditingAgent(agent); }}
                      onDelete={() => { setMenuOpenId(null); handleDelete(agent); }}
                      variant="full-width"
                      t={t}
                    />
                  ) : (
                    <div
                      className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] font-medium text-[#6a7282]"
                      style={mont}
                    >
                      {t("table.agentStatus", { status: t(STATUS_I18N_KEY[mappedStatus]) })}
                    </div>
                  )
                ) : canApprove ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(agent.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#7bf1a8] bg-[#f5fffa] text-[14px] font-semibold text-[#00aa4f] transition-colors active:scale-[0.99]"
                      style={mont}
                    >
                      <Check size={17} />
                      {t("table.approve")}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeny(agent.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#ffa2a2] bg-[#fff5f5] text-[14px] font-semibold text-[#fb2c36] transition-colors active:scale-[0.99]"
                      style={mont}
                    >
                      <X size={17} />
                      {t("table.deny")}
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    {t("table.noActionsAvailable")}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    )}
  </div>

  {/* Footer */}
  <div className="border-t border-[#f3f4f6] bg-white px-4 py-4 sm:px-5 sm:py-3">
    <p
      className="text-center text-[14px] font-medium text-[#6a7282] sm:text-left sm:text-[12px]"
      style={mont}
    >
      {t("table.showingCount", { filtered: filtered.length, total: agents.length })}
    </p>
  </div>
</div>

      {showModal && <AddAgentModal viewerRole={role} onClose={() => setShowModal(false)} />}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={() => fetchAgents()}
        />
      )}
    </div>
  );
}
