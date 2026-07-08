"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  UsersRound,
  Percent,
  Flame,
  CircleDot,
  Filter,
  Download,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Upload,
  Share2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import {
  useDashboardLeadsQuery,
  useLeadMetricsQuery,
} from "@/hooks/queries/useDashboardLeadsQuery";
import { useArchiveLeadMutation } from "@/hooks/mutations/useLeadMutations";
import {
  LeadTemperature,
  LeadLifecycleStatus,
  LeadSource,
} from "@/generated/prisma/enums";
import type { LeadDto } from "@/features/crm/types/crm-dto";
import { AddLeadModal } from "./components/AddLeadModal";
import { LeadFilterModal } from "./components/LeadFilterModal";
import { SearchableSelect } from "./components/SearchableSelect";
import type { LeadListFilters } from "@/schemas/lead.schema";
import { toCsv, downloadCsv } from "@/lib/csv";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "score_desc", label: "Highest Score" },
  { value: "score_asc", label: "Lowest Score" },
  { value: "budget_desc", label: "Highest Budget" },
  { value: "budget_asc", label: "Lowest Budget" },
  { value: "updated", label: "Recently Updated" },
];

const PAGE_LIMIT = 25;
const uiFont = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

// ── Score helpers ─────────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueColor,
  trend,
  iconBg,
  icon,
}: {
  label: string;
  value: string;
  valueColor?: string;
  trend: string;
  iconBg: string;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#e7ebf0] bg-white p-4 sm:p-[18px]">
      <div className="flex items-start justify-between gap-4">
        <p
          className="min-w-0 text-[14px] font-medium text-[#6a7282] sm:text-[14px]"
          style={uiFont}
        >
          {label}
        </p>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[9px] sm:size-9 sm:rounded-[10px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-1 sm:mt-6">
        <p
          className="text-[21px] font-semibold leading-none sm:text-[24px] sm:leading-[28px]"
          style={{ color: valueColor ?? "#0d2138", ...uiFont }}
        >
          {value}
        </p>
        <p
          className="text-[11px] font-medium text-[#00a63e] sm:text-[14px]"
          style={uiFont}
        >
          {trend}
        </p>
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const numericScore = Number(score);
  const safeScore = Math.min(
    100,
    Math.max(0, Number.isFinite(numericScore) ? numericScore : 0),
  );

  return (
    <div className="flex min-w-[104px] items-center gap-2">
      <div className="h-1.5 w-[68px] overflow-hidden rounded-full bg-[#e5e7eb]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${safeScore}%`,
            backgroundColor: scoreColor(safeScore),
          }}
        />
      </div>
      <span className="text-[14px] text-[#6a7282] sm:text-[14px]" style={uiFont}>
        {Math.round(safeScore)}%
      </span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function LeadStatusBadge({
  lifecycleStatus,
  temperature,
}: {
  lifecycleStatus: LeadLifecycleStatus;
  temperature: LeadTemperature;
}) {
  let label = "Cold";
  let backgroundColor = "#dff2ff";
  let color = "#1785c1";

  if (lifecycleStatus === LeadLifecycleStatus.CONVERTED) {
    label = "Won";
    backgroundColor = "#dcfce7";
    color = "#159447";
  } else if (lifecycleStatus === LeadLifecycleStatus.CLOSED) {
    label = "Lost";
    backgroundColor = "#ffdede";
    color = "#ef4444";
  } else if (
    lifecycleStatus === LeadLifecycleStatus.CONTACTED ||
    lifecycleStatus === LeadLifecycleStatus.FOLLOW_UP ||
    lifecycleStatus === LeadLifecycleStatus.QUALIFIED
  ) {
    label = "In Progress";
    backgroundColor = "#e9eef5";
    color = "#315f91";
  } else if (temperature === LeadTemperature.HOT) {
    label = "Hot";
    backgroundColor = "#fee2e2";
    color = "#dc2626";
  } else if (temperature === LeadTemperature.WARM) {
    label = "Warm";
    backgroundColor = "#fef3c7";
    color = "#d97706";
  }

  return (
    <span
      className="inline-flex h-[22px] items-center justify-center whitespace-nowrap rounded-md px-3 text-[11px] font-medium sm:text-[14px]"
      style={{ backgroundColor, color, ...uiFont }}
    >
      {label}
    </span>
  );
}

// ── Row actions menu ──────────────────────────────────────────────────────────

type MenuPosition = {
  top: number;
  left: number;
};

function RowActions({
  lead,
  role,
  onView,
}: {
  lead: LeadDto;
  role: Role;
  onView: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const archive = useArchiveLeadMutation();

  const canArchive = hasPermission(role, "leads:archive") && !lead.isArchived;

  const calculatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 164;
    const menuHeight = canArchive ? 88 : 46;
    const gap = 6;
    const viewportPadding = 8;
    const hasSpaceBelow = window.innerHeight - rect.bottom >= menuHeight + gap;

    const top = hasSpaceBelow
      ? rect.bottom + gap
      : Math.max(viewportPadding, rect.top - menuHeight - gap);

    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.right - menuWidth),
    );

    setPosition({ top, left });
  }, [canArchive]);

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!open) {
      calculatePosition();
      setOpen(true);
      return;
    }

    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const closeMenu = () => setOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close actions menu"
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />

            <div
              role="menu"
              className="fixed z-[9999] min-w-[164px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white py-1 shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              style={{ top: position.top, left: position.left, ...uiFont }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onView(lead.id);
                  setOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-[14px] text-[#0d2138] transition-colors hover:bg-[#f8fafc]"
              >
                View Details
              </button>

              {canArchive && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    archive.mutate(lead.id);
                    setOpen(false);
                  }}
                  disabled={archive.isPending}
                  className="w-full px-3 py-2.5 text-left text-[14px] text-[#dc2626] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {archive.isPending ? "Archiving…" : "Archive"}
                </button>
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${lead.submittedName || "lead"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className="inline-flex size-8 items-center justify-center rounded-[7px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
      >
        <MoreVertical size={16} strokeWidth={1.8} />
      </button>
      {menu}
    </>
  );
}

// ── Budget display ────────────────────────────────────────────────────────────

function formatBudget(lead: LeadDto): string {
  if (!lead.budgetMin && !lead.budgetMax) return "—";

  const fmt = (value: number) =>
    value >= 1_000_000
      ? `$${(value / 1_000_000).toFixed(1)}M`
      : `$${(value / 1000).toFixed(0)}K`;

  if (lead.budgetMin && lead.budgetMax) {
    return `${fmt(lead.budgetMin)}–${fmt(lead.budgetMax)}`;
  }
  if (lead.budgetMax) return `up to ${fmt(lead.budgetMax)}`;
  return `from ${fmt(lead.budgetMin!)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Partial<Record<LeadSource, string>> = {
  WEBSITE_LISTING_INQUIRY: "Listing Inquiry",
  WEBSITE_CONTACT_FORM: "Contact Form",
  SCHEDULED_TOUR: "Tour",
  MANUAL: "Manual",
  PHONE: "Phone",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  IMPORT: "Import",
  EXTERNAL_API: "API",
  OTHER: "Other",
};

type LeadsPageProps = {
  role: Role;
};

export function LeadsPage({ role }: LeadsPageProps) {
  const router = useRouter();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] =
    useState<LeadListFilters["sortBy"]>("newest");
  const [page, setPage] = useState(1);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const filters = useMemo<Partial<LeadListFilters>>(
    () => ({
      search: debouncedSearch || undefined,
      sortBy,
      page,
      limit: PAGE_LIMIT,
    }),
    [debouncedSearch, sortBy, page],
  );

  const { data, isLoading, isError } = useDashboardLeadsQuery(filters);
  const { data: metrics } = useLeadMetricsQuery();

  const canCreate = hasPermission(role, "leads:create");
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const [isExporting, setIsExporting] = useState(false);

  // Leads are server-paginated (PAGE_LIMIT per page) — export walks every
  // page matching the current search/sort so the CSV isn't just the 25 rows
  // currently on screen. Capped at 40 requests (4000 rows) as a sane ceiling.
  async function handleExport() {
    setIsExporting(true);
    try {
      const exportLimit = 100;
      const all: LeadDto[] = [];
      let exportPage = 1;
      let exportTotal = Infinity;
      while (all.length < exportTotal && exportPage <= 40) {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("sortBy", sortBy);
        params.set("page", String(exportPage));
        params.set("limit", String(exportLimit));
        const res = await fetch(`/api/dashboard/leads?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch leads for export");
        const json = await res.json();
        all.push(...(json.leads as LeadDto[]));
        exportTotal = json.total ?? all.length;
        if (!json.leads?.length) break;
        exportPage++;
      }

      const header = [
        "Lead #", "Name", "Email", "Phone", "Source", "Location", "Budget Min", "Budget Max",
        "Score", "Temperature", "Status", "Agent", "Created At",
      ];
      const rows = all.map((lead) => [
        lead.leadNumber,
        lead.submittedName,
        lead.submittedEmail ?? "",
        lead.submittedPhone ?? "",
        SOURCE_LABELS[lead.source] ?? lead.source ?? "",
        lead.submittedLocation ?? "",
        lead.budgetMin ?? "",
        lead.budgetMax ?? "",
        lead.score,
        lead.temperature,
        lead.lifecycleStatus,
        lead.assignedAgent?.fullName ?? "",
        new Date(lead.createdAt).toLocaleDateString("en-US"),
      ]);
      downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export leads");
    } finally {
      setIsExporting(false);
    }
  }

  const lostLeads = useMemo(
    () =>
      leads.filter(
        (lead) => lead.lifecycleStatus === LeadLifecycleStatus.CLOSED,
      ).length,
    [leads],
  );

  const coldNotContactedLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.temperature === LeadTemperature.COLD &&
          lead.lifecycleStatus === LeadLifecycleStatus.NEW,
      ).length,
    [leads],
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/leads/${id}`);
    },
    [router],
  );

  return (
    <div
      className="flex min-w-0 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6"
      style={uiFont}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-[20px] font-semibold leading-[30px] tracking-[-0.2px] text-[#0d2138]">
            Leads
          </h1>
          <p className="text-[14px] font-normal text-[#6a7282] sm:text-[14px]">
            Manage and nurture your sales leads
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                toast.info("Lead import is coming soon!");
                e.target.value = "";
              }
            }}
            id="import-leads-input"
          />
          {canCreate && (
            <label
              htmlFor="import-leads-input"
              className="flex h-10 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#4a5565] transition-colors hover:bg-[#f9fafb] sm:px-4"
              style={uiFont}
            >
              <Upload size={16} className="shrink-0" />
              <span className="truncate">Import</span>
            </label>
          )}
          {hasPermission(role, "leads:export") && (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || total === 0}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#4a5565] transition-colors hover:bg-[#f9fafb] disabled:opacity-60 sm:px-4"
              style={uiFont}
            >
              {isExporting ? (
                <Loader2 size={16} className="shrink-0 animate-spin" />
              ) : (
                <Share2 size={16} className="shrink-0" />
              )}
              <span className="truncate">Export</span>
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="col-span-2 flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-span-1 sm:px-4"
            >
              <Plus size={16} strokeWidth={1.8} />
              <span className="truncate">Add Leads</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={String(metrics?.total ?? total)}
          trend="+ 2 new this month"
          iconBg="#e0e7ff"
          icon={
            <UsersRound
              size={17}
              strokeWidth={1.8}
              className="text-[#6366f1]"
            />
          }
        />

        <StatCard
          label="Conversion Rate (Won)"
          value={`${metrics?.conversionRate ?? 0}%`}
          trend="+ 2 new this month"
          iconBg="#d1fae5"
          icon={
            <Percent
              size={17}
              strokeWidth={1.8}
              className="text-[#10b981]"
            />
          }
        />

        <StatCard
          label="Lost Leads"
          value={String(lostLeads)}
          valueColor="#ff2738"
          trend="+ 2 new this month"
          iconBg="#fee2e2"
          icon={
            <Flame
              size={17}
              strokeWidth={1.8}
              className="text-[#ff4d5e]"
            />
          }
        />

        <StatCard
          label="Cold (Not Contacted)"
          value={String(coldNotContactedLeads)}
          trend="+ 2 new this month"
          iconBg="#e0f2fe"
          icon={
            <CircleDot
              size={17}
              strokeWidth={1.8}
              className="text-[#0284c7]"
            />
          }
        />
      </div>

      {/* Leads list */}
      <section className="min-w-0 rounded-[14px] border border-[#e7ebf0] bg-white">
        {/* Header controls */}
        <div className="flex flex-col gap-3 px-3 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <h2 className="text-[15px] font-semibold text-[#10233d]">
            All Leads List
          </h2>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
            <label className="col-span-2 flex h-9 min-w-0 items-center gap-2 rounded-[9px] border border-[#dfe4ea] bg-[#f8fafc] px-3 sm:w-[220px]">
              <Search
                size={15}
                strokeWidth={1.8}
                className="shrink-0 text-[#94a0b2]"
              />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search contacts..."
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#263951] outline-none placeholder:text-[#7d899a]"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="flex h-9 items-center justify-center gap-2 rounded-[9px] border border-[#dfe4ea] bg-[#f8fafc] px-3 text-[14px] font-medium text-[#778397] transition-colors hover:bg-[#f1f4f7] sm:justify-start"
            >
              Filter
              <Filter size={14} strokeWidth={1.8} />
            </button>

            <div className="relative h-9 min-w-0 sm:w-[105px]">
              <SearchableSelect
                size="sm"
                searchable={false}
                value={sortBy}
                ariaLabel="Sort leads"
                onChange={(next) => {
                  setSortBy(next as LeadListFilters["sortBy"]);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
                placeholder="Sort by"
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Desktop/tablet table */}
        <div className="hidden min-w-0 overflow-x-auto md:block">
          <table className="w-full min-w-[950px] table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[3%]" />
            </colgroup>

            <thead>
              <tr className="border-y border-[#e6eaef] bg-[#f8fafc]">
                {[
                  "Name",
                  "Contact",
                  "Source",
                  "Location",
                  "Budget",
                  "Score",
                  "Status",
                  "Agent",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-[14px] font-medium text-[#69758a] lg:text-[14px]"
                  >
                    {heading}
                  </th>
                ))}
                <th className="w-12 px-2 py-3" />
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-[14px] text-[#69758a]"
                  >
                    Loading leads…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-[14px] text-[#dc2626]"
                  >
                    Failed to load leads.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleView(lead.id)}
                    className="h-[58px] cursor-pointer border-b border-[#e6eaef] transition-colors last:border-b-0 hover:bg-[#fafbfc]"
                  >
                    <td className="px-5 py-3">
                      <span className="block truncate text-[14px] font-semibold text-[#174f89]">
                        {lead.submittedName || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[14px] text-[#37465b]">
                          {lead.submittedEmail ?? lead.contact?.email ?? "—"}
                        </span>
                        <span className="truncate text-[14px] text-[#7b8798]">
                          {lead.submittedPhone ?? lead.contact?.phone ?? ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span className="block truncate text-[14px] text-[#34445b]">
                        {SOURCE_LABELS[lead.source] ?? lead.source ?? "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <span className="block truncate text-[14px] text-[#34445b]">
                        {lead.submittedLocation ?? lead.contact?.location ?? "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <span className="whitespace-nowrap text-[14px] font-medium text-[#10233d]">
                        {formatBudget(lead)}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <ScoreBar score={lead.score ?? 0} />
                    </td>

                    <td
                      className="px-5 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <LeadStatusBadge
                        lifecycleStatus={lead.lifecycleStatus}
                        temperature={lead.temperature}
                      />
                    </td>

                    <td className="px-5 py-3">
                      <span className="block truncate text-[14px] text-[#34445b]">
                        {lead.assignedAgent?.fullName ?? "—"}
                      </span>
                    </td>

                    <td
                      className="px-2 py-3 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <RowActions
                        lead={lead}
                        role={role}
                        onView={handleView}
                      />
                    </td>
                  </tr>
                ))}

              {!isLoading && !isError && leads.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-[14px] text-[#69758a]"
                  >
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="border-t border-[#e6eaef] md:hidden">
          {isLoading && (
            <div className="px-4 py-12 text-center text-[14px] text-[#69758a]">
              Loading leads…
            </div>
          )}

          {isError && (
            <div className="px-4 py-12 text-center text-[14px] text-[#dc2626]">
              Failed to load leads.
            </div>
          )}

          {!isLoading &&
            !isError &&
            leads.map((lead) => (
              <article
                key={lead.id}
                onClick={() => handleView(lead.id)}
                className="cursor-pointer border-b border-[#e6eaef] p-4 last:border-b-0 active:bg-[#fafbfc]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-[#174f89]">
                      {lead.submittedName || "—"}
                    </h3>
                    <p className="mt-1 truncate text-[14px] text-[#37465b]">
                      {lead.submittedEmail ?? lead.contact?.email ?? "—"}
                    </p>
                    {(lead.submittedPhone ?? lead.contact?.phone) && (
                      <p className="mt-0.5 truncate text-[14px] text-[#7b8798]">
                        {lead.submittedPhone ?? lead.contact?.phone}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <LeadStatusBadge
                      lifecycleStatus={lead.lifecycleStatus}
                      temperature={lead.temperature}
                    />
                    <RowActions lead={lead} role={role} onView={handleView} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#94a0b2]">
                      Source
                    </p>
                    <p className="mt-1 truncate text-[14px] text-[#34445b]">
                      {SOURCE_LABELS[lead.source] ?? lead.source ?? "—"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#94a0b2]">
                      Location
                    </p>
                    <p className="mt-1 truncate text-[14px] text-[#34445b]">
                      {lead.submittedLocation ?? lead.contact?.location ?? "—"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#94a0b2]">
                      Budget
                    </p>
                    <p className="mt-1 truncate text-[14px] font-medium text-[#10233d]">
                      {formatBudget(lead)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#94a0b2]">
                      Score
                    </p>
                    <div className="mt-1.5">
                      <ScoreBar score={lead.score ?? 0} />
                    </div>
                  </div>
                </div>
              </article>
            ))}

          {!isLoading && !isError && leads.length === 0 && (
            <div className="px-4 py-12 text-center text-[14px] text-[#69758a]">
              No leads found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-[#e6eaef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-center text-[14px] text-[#69758a] sm:text-left">
              Showing {leads.length} of {total} leads
            </span>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex size-8 items-center justify-center rounded-md border border-[#dfe4ea] text-[#69758a] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} strokeWidth={1.8} />
              </button>

              <span className="min-w-[54px] text-center text-[14px] text-[#69758a]">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="flex size-8 items-center justify-center rounded-md border border-[#dfe4ea] text-[#69758a] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </section>

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}

      {showFilter && (
        <LeadFilterModal
          resultCount={total}
          onApply={() => setShowFilter(false)}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}