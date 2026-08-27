"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Search, Plus, DollarSign, FolderOpen, Trophy, BarChart3,
  Filter, Download, MoreVertical, Pencil, Trash2, Loader2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import type { Currency } from "@/generated/prisma/enums";
import type { OpportunityDto } from "@/features/crm/types/crm-dto";
import { useDashboardOpportunitiesQuery } from "@/hooks/queries/useDashboardOpportunitiesQuery";
import {
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useDeleteOpportunityMutation,
} from "@/hooks/mutations/useCrmMutations";
import { AddOpportunityModal, type OpportunityFormValues } from "./components/AddOpportunityModal";
import {
  OpportunityFilterModal,
  EMPTY_OPPORTUNITY_FILTERS,
  hasActiveOpportunityFilters,
  matchesOpportunityFilters,
  type OpportunityFilterValues,
} from "./components/OpportunityFilterModal";
import { toCsv, downloadCsv } from "@/lib/csv";

const mont = { fontFamily: "'Montserrat', sans-serif" };

/** Display label for the participants column/search — joins every named party. */
function participantsLabel(o: OpportunityDto): string {
  const names = o.participants.map((p) => p.contactName ?? p.companyName).filter((n): n is string => Boolean(n));
  return names.length ? names.join(", ") : "—";
}

/** Display label for the listings column/search/export — joins every linked property. */
function listingsLabel(o: OpportunityDto): string {
  const titles = o.listings.map((l) => l.propertyTitle);
  return titles.length ? titles.join(", ") : "—";
}
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_TABS = ["All", "QUALIFICATION", "VISITATION", "OFFER", "NEGOTIATION", "CLOSING"] as const;
type StageTab = (typeof STAGE_TABS)[number];

const STAGE_LABEL: Record<string, string> = {
  QUALIFICATION: "Qualification",
  VISITATION: "Visitation",
  OFFER: "Offer",
  NEGOTIATION: "Negotiation",
  CLOSING: "Closing",
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: "#dbeafe", text: "#1e4f86" },
  CLOSED_WON:  { bg: "#dcfce7", text: "#16a34a" },
  CLOSED_LOST: { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open", CLOSED_WON: "Closed Won", CLOSED_LOST: "Closed Lost",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, iconBg, icon }: {
  label: string; value: string; sub?: string; trend: string; iconBg: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[12px] p-[18px] flex flex-col gap-6">
      <div className="flex items-start justify-between gap-7">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex items-baseline gap-2">
          <span className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</span>
          {sub && <span className="text-[14px] font-medium text-[#6a7282]" style={mont}>{sub}</span>}
        </p>
        <p className="text-[12px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

function ProbabilityBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[72px] h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
        <div className="h-full rounded-full bg-[#1e4f86]" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] text-[#6a7282]" style={mont}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.OPEN;
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
      {t(`status.${status}`, { defaultValue: STATUS_LABEL[status] ?? status })}
    </span>
  );
}

// ── Row actions menu ──────────────────────────────────────────────────────────
// Portal-rendered so the table's overflow-hidden / overflow-x-auto wrappers can't
// clip it on the last row; flips above the trigger near the viewport bottom.

type RowMenuItem = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean };

function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const { t } = useTranslation("opportunities");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = items.length * 40 + 12;
    const gap = 6;
    const padding = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
    if (top + menuHeight > window.innerHeight - padding) top = rect.top - menuHeight - gap;
    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={t("page.rowActions.actionsTitle")}
        aria-label={t("page.rowActions.actionsAria", { name: label })}
        aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen((v) => !v); }}
        className={`inline-flex size-8 items-center justify-center rounded-[8px] transition-colors ${
          open ? "bg-[#eff6ff] text-[#1e4f86]" : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        }`}
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] w-[200px] overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{ top: position.top, left: position.left }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); item.onClick(); }}
                className={`flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium transition-colors ${
                  item.danger ? "text-[#fb2c36] hover:bg-[#fff1f2]" : "text-[#0d2138] hover:bg-[#f8fafc]"
                }`}
                style={mont}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function fmt(n: number | null) {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Per-deal figure prefixed with its own currency — dealSize is native-currency, unlike the USD-only dashboard aggregates. */
function fmtWithCurrency(n: number | null, currency: Currency) {
  if (n === null) return "—";
  return `${currency} $${n.toLocaleString(currency === "ARS" ? "es-AR" : "en-US", { maximumFractionDigits: 0 })}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OpportunitiesPage({
  role,
  currentUserId,
  currentUserName,
}: {
  role: Role;
  currentUserId: string;
  currentUserName: string;
}) {
  const { t } = useTranslation("opportunities");
  const [editing, setEditing] = useState<OpportunityDto | "new" | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<OpportunityFilterValues>(EMPTY_OPPORTUNITY_FILTERS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StageTab>("All");

  const { data, isLoading, isError } = useDashboardOpportunitiesQuery();
  const createMutation = useCreateOpportunityMutation();
  const updateMutation = useUpdateOpportunityMutation();
  const deleteMutation = useDeleteOpportunityMutation();

  const canCreate = hasPermission(role, "opportunities:create");
  const canDelete = hasPermission(role, "opportunities:delete");
  // Roles without agents:view (AGENT) can't pick another agent — their
  // opportunities are always assigned to themselves (enforced server-side too).
  const lockedAgent = hasPermission(role, "agents:view")
    ? null
    : { id: currentUserId, name: currentUserName };

  const opportunities = useMemo(() => data?.opportunities ?? [], [data]);
  const metrics = data?.metrics;

  // Narrowed by the tab + search box — this is what the Filter modal's live
  // "N results" preview counts against, before its own filters are applied.
  const searchTabFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return opportunities.filter((o) => {
      const matchesTab = activeTab === "All" || o.stage === activeTab;
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        participantsLabel(o).toLowerCase().includes(q) ||
        listingsLabel(o).toLowerCase().includes(q) ||
        o.opportunityId.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [opportunities, search, activeTab]);

  const filtered = useMemo(
    () => searchTabFiltered.filter((o) => matchesOpportunityFilters(o, filters)),
    [searchTabFiltered, filters],
  );
  const filtersActive = hasActiveOpportunityFilters(filters);

  function handleExport() {
    const header = [
      "Opportunity ID", "Title", "Participants", "Listings", "Deal Type", "Deal Size",
      "Stage", "Status", "Probability", "Commission Amount", "Agent", "Expected Close", "Created At",
    ];
    const rows = filtered.map((o) => [
      o.opportunityId,
      o.title,
      participantsLabel(o),
      listingsLabel(o),
      o.dealType ?? "",
      o.dealSize ?? "",
      STAGE_LABEL[o.stage] ?? o.stage,
      o.status,
      `${o.probability}%`,
      o.commissionAmount ?? "",
      o.assignedAgentName ?? "",
      o.expectedCloseAt ? new Date(o.expectedCloseAt).toLocaleDateString("en-US") : "",
      new Date(o.createdAt).toLocaleDateString("en-US"),
    ]);
    downloadCsv(`opportunities-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows));
  }

  async function handleSubmit(values: OpportunityFormValues): Promise<OpportunityDto | null> {
    const payload = {
      title: values.title || "Untitled Opportunity",
      participants: values.participants.map((row) =>
        row.role === "AGENCY"
          ? { role: row.role, companyName: row.companyName.trim() }
          : { role: row.role, contactId: row.contactId },
      ),
      propertyIds: values.propertyIds,
      dealType: values.dealType,
      dealSize: values.dealSize ? Number(values.dealSize) : undefined,
      currency: values.currency,
      exchangeRateOverride: values.exchangeRateOverride,
      stage: values.stage,
      status: values.status,
      probability: values.probability,
      commission: values.commission ? Number(values.commission) : undefined,
      commissionUnit: values.commissionUnit,
      paymentTerms: values.paymentTerms || undefined,
      contractStart: values.contractStart || undefined,
      contractEnd: values.contractEnd || undefined,
      expectedCloseAt: values.expectedCloseAt || undefined,
      assignedAgentId: values.assignedAgentId || undefined,
      agentCommissionValue: values.agentCommissionValue ? Number(values.agentCommissionValue) : undefined,
      agentCommissionUnit: values.agentCommissionUnit,
      notes: values.notes || undefined,
    };

    try {
      if (editing && editing !== "new") {
        const { opportunity } = await updateMutation.mutateAsync({ id: editing.id, body: payload });
        return opportunity;
      }
      const { opportunity } = await createMutation.mutateAsync(payload);
      return opportunity;
    } catch {
      toast.error(t("page.toasts.saveFailed"));
      return null;
    }
  }

  async function handleDelete(opp: OpportunityDto) {
    if (!confirm(t("page.deleteConfirm", { title: opp.title }))) return;
    try {
      await deleteMutation.mutateAsync(opp.id);
      toast.success(t("page.toasts.deleted"));
    } catch {
      toast.error(t("page.toasts.deleteFailed"));
    }
  }

  const winRate = metrics && metrics.total > 0
    ? Math.round((metrics.closedWon / metrics.total) * 100)
    : 0;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>{t("page.title")}</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>{t("page.subtitle")}</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            {t("page.newOpportunity")}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label={t("page.stats.totalValue")} value={isLoading ? "—" : fmt(metrics?.totalValue ?? null)} trend={t("page.stats.totalValueTrend")} iconBg="#fef3c7" icon={<DollarSign size={18} className="text-[#f59e0b]" />} />
        <StatCard label={t("page.stats.open")} value={isLoading ? "—" : String(metrics?.open ?? 0)} trend={t("page.stats.openTrend")} iconBg="#e0e7ff" icon={<FolderOpen size={18} className="text-[#6366f1]" />} />
        <StatCard label={t("page.stats.won")} value={isLoading ? "—" : String(metrics?.closedWon ?? 0)} trend={t("page.stats.wonTrend")} iconBg="#d1fae5" icon={<Trophy size={18} className="text-[#10b981]" />} />
        <StatCard label={t("page.stats.winRate")} value={isLoading ? "—" : `${winRate}%`} trend={t("page.stats.winRateTrend")} iconBg="#dbeafe" icon={<BarChart3 size={18} className="text-[#3b82f6]" />} />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] p-1">
            {STAGE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-7 px-3 rounded-[8px] text-[13px] font-medium transition-colors ${
                  activeTab === tab ? "bg-[#1e4f86] text-white" : "text-[#6a7282] hover:text-[#0d2138]"
                }`}
                style={mont}
              >
                {tab === "All" ? t("page.tabs.all") : t(`dashboard:status.${tab}`, { defaultValue: STAGE_LABEL[tab] })}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("page.searchPlaceholder")}
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#4a5565] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              style={mont}
            >
              {t("page.exportCsv")} <Download size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className={`relative flex items-center gap-2 h-9 px-4 rounded-[10px] border text-[14px] font-medium transition-colors ${
                filtersActive
                  ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86]"
                  : "bg-[#f8fafc] border-[#e5e7eb] text-[#99a1af] hover:bg-[#f3f4f6]"
              }`}
              style={mont}
            >
              {t("page.filterBy")} <Filter size={16} />
              {filtersActive && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#1e4f86]" />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[14px]" style={mont}>{t("page.loading")}</span>
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-[14px] text-red-500" style={mont}>{t("page.loadError")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                  {[
                    t("page.columns.opportunity"),
                    t("page.columns.participants"),
                    t("page.columns.dealSize"),
                    t("page.columns.probability"),
                    t("page.columns.stage"),
                    t("page.columns.expectedClose"),
                    t("page.columns.status"),
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                  ))}
                  <th className="px-5 py-3 w-[55px]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((opp: OpportunityDto) => (
                  <tr key={opp.id} className="border-b border-[#e5e7eb] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{opp.title}</span>
                        <span className="text-[11px] text-[#99a1af]" style={mont}>{opp.opportunityId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] text-[#6a7282]" style={mont}>{participantsLabel(opp)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{fmtWithCurrency(opp.dealSize, opp.currency)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <ProbabilityBar value={opp.probability} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-[#f8fafc] border border-[#e5e7eb] text-[12px] font-medium text-[#2b3038] whitespace-nowrap" style={mont}>
                        {t(`dashboard:status.${opp.stage}`, { defaultValue: STAGE_LABEL[opp.stage] ?? opp.stage })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>
                        {opp.expectedCloseAt ? new Date(opp.expectedCloseAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="px-5 py-4 w-[55px] text-center">
                      <RowMenu
                        label={opp.title ?? opp.id}
                        items={[
                          { label: t("page.rowActions.edit"), icon: <Pencil size={14} className="text-[#1e4f86]" />, onClick: () => setEditing(opp) },
                          ...(canDelete
                            ? [{ label: t("page.rowActions.delete"), icon: <Trash2 size={14} />, onClick: () => handleDelete(opp), danger: true }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                      {opportunities.length === 0 ? t("page.emptyNone") : t("page.emptyFiltered")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <AddOpportunityModal
          mode={editing === "new" ? "create" : "edit"}
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          lockedAgent={lockedAgent}
          role={role}
        />
      )}
      {showFilter && (
        <OpportunityFilterModal
          initial={filters}
          baseResults={searchTabFiltered}
          onApply={(next) => { setFilters(next); setShowFilter(false); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
