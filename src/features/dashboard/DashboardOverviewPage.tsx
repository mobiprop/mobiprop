"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  Loader2,
  RotateCcw,
  MoreVertical,
  Plus,
  SquarePen,
  UserRound,
  Search,
  TrendingDown,
  TrendingUp,
  Target,
} from "lucide-react";

import type { Role } from "@/lib/permissions";
import { useDashboardStore, type DashboardDateRange } from "@/stores/useDashboardStore";
import { useDashboardMetricsQuery } from "@/hooks/queries/useDashboardMetricsQuery";
import { useRevenueChartQuery } from "@/hooks/queries/useRevenueChartQuery";
import { useSalesByAgentQuery } from "@/hooks/queries/useSalesByAgentQuery";
import { useLocationSummaryQuery } from "@/hooks/queries/useLocationSummaryQuery";
import { SearchableSelect } from "./components/SearchableSelect";
import { DatePickerField } from "./components/DatePickerField";
import type { ChartGranularity, MetricCard, SaleOperation, SaleRow } from "./types/dashboard-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const DATE_RANGE_LABEL_KEY: Record<DashboardDateRange, string> = {
  LAST_WEEK: "overview.dateRanges.lastWeek",
  "60_DAYS": "overview.dateRanges.last60Days",
  "30_DAYS": "overview.dateRanges.last30Days",
  CUSTOM: "overview.dateRanges.custom",
};

const DATE_RANGE_VALUES = ["LAST_WEEK", "30_DAYS", "60_DAYS", "CUSTOM"] as const;
const SALES_DATE_RANGE_VALUES = ["LAST_WEEK", "30_DAYS", "60_DAYS"] as const;

const OPERATION_FILTER_VALUES = ["All", "Rent", "Sale", "Sale & Rent"] as const;

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricIcon({ card }: { card: MetricCard }) {
  const key = card.key;

  if (key === "listings" || key === "my-listings") {
    return <Building2 size={18} strokeWidth={1} style={{ color: card.iconColor }} />;
  }

  if (key === "lost") {
    return <TrendingDown size={18} strokeWidth={1.2} style={{ color: card.iconColor }} />;
  }

  if (key === "won" || key === "my-won" || key === "my-open") {
    return <TrendingUp size={18} strokeWidth={1.2} style={{ color: card.iconColor }} />;
  }

  if (key === "revenue" || key === "my-commission") {
    return <DollarSign size={18} strokeWidth={1.2} style={{ color: card.iconColor }} />;
  }

  return <Building2 size={18} strokeWidth={1.2} style={{ color: card.iconColor }} />;
}

const METRIC_LABEL_KEY: Record<string, string> = {
  listings: "overview.metrics.listings",
  lost: "overview.metrics.lost",
  won: "overview.metrics.won",
  revenue: "overview.metrics.revenue",
  "my-listings": "overview.metrics.myListings",
  "my-open": "overview.metrics.myOpen",
  "my-won": "overview.metrics.myWon",
  "my-commission": "overview.metrics.myCommission",
};

function MetricCardView({ card }: { card: MetricCard }) {
  const { t } = useTranslation("dashboard");
  const isUp = card.trendDirection === "up";
  const sparkColor = card.iconColor;
  const chartData = card.sparkline.map((value, index) => ({ index, value }));

  return (
    <div className="flex min-h-[188px] min-w-0 flex-1 flex-col rounded-[12px] border border-[#e9e9e9] bg-white p-[18px]">
      <div className="mb-2 flex min-h-9 items-start justify-between gap-2">
        <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>
          {t(METRIC_LABEL_KEY[card.key] ?? card.label, { defaultValue: card.label })}
        </p>

        <span
          className="flex size-9 items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-[#fbfbfb]"
        >
          <MetricIcon card={card} />
        </span>
      </div>

      <div className="flex min-h-[48px] items-start">
        {card.netValue ? (
          <div className="grid w-full min-w-0 grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="break-words text-[24px] font-medium leading-8 text-[#232323]" style={poppins}>{card.value.replace(/^USD\s*/, "")}</p>
              <p className="text-[11px] leading-4 text-[#6c6c6c]" style={mont}>USD {t("overview.metrics.grossLabel")}</p>
            </div>
            <div className="min-w-0">
              <p className="break-words text-[24px] font-medium leading-8 text-[#059669]" style={poppins}>{card.netValue.replace(/^USD\s*/, "")}</p>
              <p className="text-[11px] leading-4 text-[#059669]" style={mont}>USD {t("overview.metrics.netLabel")}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[24px] font-medium leading-8 text-[#232323]" style={poppins}>{card.value}</span>
            {card.sub && <span className="text-[12px] text-[#6c6c6c]" style={mont}>{card.sub}</span>}
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]" style={mont}>
        <span className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-medium ${isUp ? "bg-[#dcfce7] text-[#008236]" : "bg-[#fff1f2] text-[#e11d48]"}`}>
          {card.trendValue}
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        </span>
        <span className="text-[#6c6c6c]">{t("overview.previousPeriod", { defaultValue: "vs. período anterior" })}</span>
      </div>

      <div className="mt-auto h-6 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
            <YAxis hide domain={[0, (max: number) => Math.max(max * 1.2, 1)]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={sparkColor}
              strokeWidth={1.2}
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="min-w-0 flex-1 animate-pulse rounded-[12px] border border-[#e9e9e9] bg-white p-[18px]">
      <div className="mb-4 h-4 w-2/3 rounded bg-[#f3f4f6]" />
      <div className="mb-2 h-6 w-1/2 rounded bg-[#f3f4f6]" />
      <div className="h-3 w-1/3 rounded bg-[#f3f4f6]" />
    </div>
  );
}

// ── Sale operation badge ──────────────────────────────────────────────────────

const OPERATION_STYLE: Record<SaleOperation, { bg: string; text: string }> = {
  Rent: { bg: "#dff2fe", text: "#0069a8" },
  Sale: { bg: "#fef3c6", text: "#bb4d00" },
  "Sale & Rent": { bg: "#dcfce7", text: "#016630" },
};

function OperationBadge({ operation }: { operation: SaleOperation }) {
  const { t } = useTranslation("dashboard");
  const style = OPERATION_STYLE[operation];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ backgroundColor: style.bg, color: style.text, ...mont }}
    >
      {t(OPERATION_LABEL_KEY[operation])}
    </span>
  );
}

// ── Sale actions dropdown ─────────────────────────────────────────────────────

function SaleActions({ row }: { row: SaleRow }) {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 205;
    const menuHeight = 102;
    const viewportGap = 8;

    let left = rect.right - menuWidth;
    left = Math.max(viewportGap, Math.min(left, window.innerWidth - menuWidth - viewportGap));

    let top = rect.bottom + 6;
    if (top + menuHeight > window.innerHeight - viewportGap) {
      top = rect.top - menuHeight - 6;
    }

    setPosition({ top, left });
  };

  const toggleMenu = () => {
    if (!isOpen) updateMenuPosition();
    setIsOpen((current) => !current);
  };

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    const handleViewportChange = () => closeMenu();

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  const handleViewProfile = () => {
    closeMenu();
    if (row.agentId) router.push(`/dashboard/agents/${row.agentId}`);
  };

  const handleEdit = () => {
    closeMenu();
    router.push("/dashboard/opportunities");
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("overview.openOptionsFor", { name: row.agentName })}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggleMenu}
        className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6]"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={t("overview.actionsFor", { name: row.agentName })}
            className="mobi-dropdown-menu fixed z-[100] w-[205px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              role="menuitem"
              disabled={!row.agentId}
              onClick={handleViewProfile}
              className="flex w-full items-center gap-3 px-5 py-4 text-[14px] text-[#282d35] transition-colors hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50"
              style={mont}
            >
              <UserRound size={18} className="shrink-0 text-[#64748b]" />
              <span>{t("overview.viewAgentProfile")}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleEdit}
              className="flex w-full items-center gap-3 border-t border-[#eeeeee] px-5 py-4 text-[14px] text-[#282d35] transition-colors hover:bg-[#f8f9fa]"
              style={mont}
            >
              <SquarePen size={18} className="shrink-0 text-[#64748b]" />
              <span>{t("overview.edit")}</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string | number;
    value: number | string;
    payload: { revenueNet?: number };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { t } = useTranslation("dashboard");
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const revenueItem = payload.find((x) => x.dataKey === "revenue");
  const oppsItem = payload.find((x) => x.dataKey === "openOpportunities");

  const revenue = revenueItem ? Number(revenueItem.value) : 0;
  const revenueNet = Number(revenueItem?.payload?.revenueNet ?? 0);
  const openOpportunities = oppsItem ? Number(oppsItem.value) : 0;

  return (
    <div
      className="w-[237px] rounded-[12px] border border-[#e9e9e9] bg-white p-[18px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      style={mont}
    >
      {/* Header */}
      <span className="text-[12px] font-medium text-[#6a7282] tracking-wider" style={mont}>
        {String(label).toUpperCase()}
      </span>

      <div className="my-3 border-b border-[#e9e9e9]" />

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {/* Revenue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f0f6fa]">
              <span className="text-[15px] font-medium text-[#005089]" style={poppins}>
                $
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#6c6c6c]" style={mont}>
                {t("overview.tooltip.revenue")}
              </span>
              <span className="text-[15px] font-medium text-[#0d2138] leading-tight" style={poppins}>
                US${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#005089] shrink-0" />
        </div>

        {/* Net Revenue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f0f6fa]">
              <span className="text-[15px] font-medium text-[#5486b9]" style={poppins}>
                $
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#6c6c6c]" style={mont}>
                {t("overview.tooltip.revenueNet")}
              </span>
              <span className="text-[15px] font-medium text-[#0d2138] leading-tight" style={poppins}>
                US${revenueNet.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#5486b9] shrink-0" />
        </div>

        {/* Open Opportunities */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f0f6fa]">
              <Target size={16} strokeWidth={1.5} className="shrink-0 text-[#5c93cb]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#6c6c6c]" style={mont}>
                {t("overview.tooltip.openOpportunities")}
              </span>
              <span className="text-[15px] font-medium text-[#0d2138] leading-tight" style={poppins}>
                US${openOpportunities.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#5c93cb] shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type DashboardOverviewProps = {
  role: Role;
  firstName: string;
};

const CHART_TABS = ["Monthly", "Weekly", "Daily"] as const;

const GRANULARITY_FOR_TAB: Record<(typeof CHART_TABS)[number], ChartGranularity> = {
  Monthly: "monthly",
  Weekly: "weekly",
  Daily: "daily",
};

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

const CHART_TAB_LABEL_KEY: Record<(typeof CHART_TABS)[number], string> = {
  Monthly: "overview.chartTabs.monthly",
  Weekly: "overview.chartTabs.weekly",
  Daily: "overview.chartTabs.daily",
};

const OPERATION_LABEL_KEY: Record<"All" | SaleOperation, string> = {
  All: "overview.totalSales.operations.all",
  Rent: "overview.totalSales.operations.rent",
  Sale: "overview.totalSales.operations.sale",
  "Sale & Rent": "overview.totalSales.operations.saleAndRent",
};

export function DashboardOverviewPage({ role, firstName }: DashboardOverviewProps) {
  const { t } = useTranslation("dashboard");
  const router = useRouter();

  const { dateRange, customDateRange, setDateRange, setCustomDateRange } = useDashboardStore(
    useShallow((state) => ({
      dateRange: state.dateRange,
      customDateRange: state.customDateRange,
      setDateRange: state.setDateRange,
      setCustomDateRange: state.setCustomDateRange,
    })),
  );

  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [customFrom, setCustomFrom] = useState(customDateRange.from ?? "");
  const [customTo, setCustomTo] = useState(customDateRange.to ?? "");

  const [chartTab, setChartTab] = useState<(typeof CHART_TABS)[number]>("Monthly");
  const [mounted, setMounted] = useState(false);

  const [search, setSearch] = useState("");
  const [operationFilter, setOperationFilter] = useState<"All" | SaleOperation>("All");

  const canAddListing = role !== "USER";

  const dateRangeOptions = useMemo(
    () => DATE_RANGE_VALUES.map((value) => ({ value, label: t(DATE_RANGE_LABEL_KEY[value]) })),
    [t],
  );
  const salesDateRangeOptions = useMemo(
    () => SALES_DATE_RANGE_VALUES.map((value) => ({ value, label: t(DATE_RANGE_LABEL_KEY[value]) })),
    [t],
  );
  const operationFilterOptions = useMemo(
    () => OPERATION_FILTER_VALUES.map((value) => ({ value, label: t(OPERATION_LABEL_KEY[value]) })),
    [t],
  );

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const metricsQuery = useDashboardMetricsQuery();
  const chartQuery = useRevenueChartQuery(GRANULARITY_FOR_TAB[chartTab]);
  const locationsQuery = useLocationSummaryQuery();
  const salesQuery = useSalesByAgentQuery();

  const metrics = metricsQuery.data?.metrics ?? [];
  const chartData = chartQuery.data?.chart ?? [];
  const locations = locationsQuery.data?.locations ?? [];
  const allSales = useMemo(() => salesQuery.data?.sales ?? [], [salesQuery.data]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSales.filter((row) => {
      if (operationFilter !== "All" && row.operation !== operationFilter) return false;
      if (!q) return true;
      return (
        row.agentName.toLowerCase().includes(q) ||
        (row.listingId ?? "").toLowerCase().includes(q) ||
        row.opportunityId.toLowerCase().includes(q)
      );
    });
  }, [allSales, operationFilter, search]);

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setCustomDateRange(customFrom, customTo);
    setShowCustomInputs(false);
  };

  const handleExport = () => {
    const header = ["Agent Name", "Listing ID", "Opportunity ID", "Operation Type", "Date", "Revenue"];
    const lines = filteredSales.map((row) =>
      [
        row.agentName,
        row.listingId ?? "—",
        row.opportunityId,
        row.operation,
        new Date(row.date).toLocaleDateString("en-US"),
        row.revenue,
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.map(csvCell).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `total-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium text-[#0d2138] sm:text-[20px]" style={poppins}>
            {t("overview.title")}
          </h1>

          <p className="mt-1 text-[12px] font-medium leading-5 text-[#6a7282] sm:text-[14px]" style={mont}>
            {firstName ? t("overview.greeting", { name: firstName }) : t("overview.greetingNoName")}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <SearchableSelect
            size="sm"
            searchable={false}
            value={dateRange}
            onChange={(next) => {
              const value = next as DashboardDateRange;
              if (value === "CUSTOM") {
                setShowCustomInputs(true);
              } else {
                setShowCustomInputs(false);
                setDateRange(value);
                setChartTab(value === "LAST_WEEK" ? "Daily" : value === "30_DAYS" ? "Weekly" : "Monthly");
              }
            }}
            options={dateRangeOptions}
            placeholder={t("overview.selectRange")}
            className="col-span-2 sm:col-span-1 sm:w-[180px]"
          />

          {(showCustomInputs || dateRange === "CUSTOM") && (
            <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
              <DatePickerField
                value={customFrom}
                onChange={setCustomFrom}
                placeholder={t("overview.from")}
                className="sm:w-[140px]"
              />
              <span className="text-[#99a1af]">–</span>
              <DatePickerField
                value={customTo}
                onChange={setCustomTo}
                placeholder={t("overview.to")}
                className="sm:w-[140px]"
              />
              <button
                type="button"
                onClick={handleApplyCustomRange}
                disabled={!customFrom || !customTo}
                className="h-10 shrink-0 rounded-[10px] bg-[#1e4f86] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[14px]"
                style={mont}
              >
                {t("overview.apply")}
              </button>
            </div>
          )}

          {canAddListing && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/listings")}
              className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-span-1 sm:w-auto sm:text-[14px]"
              style={mont}
            >
              <Plus size={16} />
              {t("overview.addListing")}
            </button>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
        {metricsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => <MetricCardSkeleton key={index} />)
          : metrics.map((card) => <MetricCardView key={card.key} card={card} />)}
      </div>

      {/* Chart + locations */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Revenue / opportunities chart */}
        <div className="min-w-0 flex-1 rounded-[12px] border border-[#e9e9e9] bg-white px-3 pb-3 pt-4 sm:px-4">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="mb-3 text-[14px] font-semibold leading-5 text-[#0d2138]" style={mont}>
                {t("overview.chartTitle")}
              </h2>

              <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#005089]" />
                  <span className="text-[10px] font-medium text-[#6a7282]" style={mont}>
                    {t("overview.tooltip.revenue")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#5c93cb]" />
                  <span className="text-[10px] font-medium text-[#6a7282]" style={mont}>
                    {t("overview.tooltip.openOpportunities")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:shrink-0">
              <button
                type="button"
                onClick={() => chartQuery.refetch()}
                className="flex size-7 shrink-0 items-center justify-center text-[#99a1af]"
                aria-label={t("overview.refreshChart")}
              >
                {chartQuery.isFetching ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCcw size={12} strokeWidth={1.5} />
                )}
              </button>

              <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-1 md:flex md:flex-none">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setChartTab(tab)}
                    className={`min-w-0 border-b-2 px-2 py-1.5 text-[10px] font-medium transition-colors sm:px-3 ${chartTab === tab ? "border-[#005089] text-[#005089]" : "border-transparent text-[#6c6c6c]"
                      }`}
                    style={mont}
                  >
                    <span className="block truncate">{t(CHART_TAB_LABEL_KEY[tab])}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[210px] w-full min-w-0 sm:h-[230px] lg:h-[220px]">
            {mounted && !chartQuery.isLoading && !chartQuery.isError && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#005089" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#005089" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="grad-opps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5c93cb" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#5c93cb" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e9edf2" vertical={false} />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    interval="preserveStartEnd"
                    minTickGap={8}
                    tick={{ fontSize: 9, fill: "#99a1af" }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    width={56}
                    tickFormatter={(value: number) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
                    tick={{ fontSize: 9, fill: "#99a1af" }}
                  />

                  <Tooltip cursor={{ stroke: "#e2e8f0", strokeWidth: 1.5 }} content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="openOpportunities"
                    stroke="#5c93cb"
                    strokeWidth={1.2}
                    fill="url(#grad-opps)"
                    dot={false}
                    isAnimationActive={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#005089"
                    strokeWidth={1.2}
                    fill="url(#grad-revenue)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {mounted && chartQuery.isError && (
              <div role="alert" className="flex h-full items-center justify-center text-sm text-[#005089]">
                <button type="button" onClick={() => chartQuery.refetch()}>No se pudo cargar el gráfico. Reintentar</button>
              </div>
            )}
            {mounted && !chartQuery.isLoading && !chartQuery.isError && chartData.length === 0 && (
              <div className="flex h-full items-center justify-center text-[12px] text-[#99a1af]" style={mont}>
                {t("overview.noChartData")}
              </div>
            )}
          </div>
          {chartData.some((point) => (point.legacyDateCount ?? 0) > 0) && (
            <p className="mt-2 text-[10px] leading-4 text-[#6c6c6c]" style={mont}>
              Los cierres anteriores sin fecha registrada se muestran según su última actualización.
            </p>
          )}
        </div>

        {/* Locations */}
        <div className="w-full min-w-0 shrink-0 rounded-[12px] border border-[#e9e9e9] bg-white p-4 lg:w-[292px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
              {t("overview.locations.title")}
            </h2>

            <button
              type="button"
              onClick={() => router.push("/dashboard/locations")}
              className="flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#e9e9e9] bg-[#fbfbfb] px-3 text-[10px] font-medium text-[#6a7282]"
              style={mont}
            >
              <Plus size={13} strokeWidth={1.7} />
              {t("overview.locations.addLocation")}
            </button>
          </div>

          <div className="flex flex-col">
            {locationsQuery.isLoading && (
              <p className="py-3 text-center text-[12px] text-[#99a1af]" style={mont}>
                {t("overview.locations.loading")}
              </p>
            )}

            {!locationsQuery.isLoading && locations.length === 0 && (
              <p className="py-3 text-center text-[12px] text-[#99a1af]" style={mont}>
                {t("overview.locations.empty")}
              </p>
            )}

            {locations.map((location, index) => (
              <div
                key={`${location.name}-${index}`}
                className="flex min-h-[38px] items-center justify-between gap-3 border-b border-[#f3f4f6] py-2 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#2b3038]" style={mont}>
                  {location.name}
                </span>

                <span className="flex min-w-[30px] shrink-0 items-center justify-center rounded-[4px] border border-[#e9e9e9] bg-[#f0f6fa] px-2 py-0.5 text-[10px] font-medium text-[#6a7282]" style={mont}>
                  {location.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total Sales */}
      <div className="overflow-hidden rounded-[12px] border border-[#e9e9e9] bg-white">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[#e9e9e9] p-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="shrink-0 text-[14px] font-medium text-[#0d2138]" style={mont}>
            {t("overview.totalSales.title")}
          </h2>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {/* Search */}
            <div className="col-span-2 flex h-11 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 focus-within:border-[#1e4f86] sm:h-9 sm:w-[180px]">
              <Search size={16} className="shrink-0 text-[#99a1af]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("overview.totalSales.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[12px]"
                style={mont}
              />
            </div>

            {/* Operation filter */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={operationFilter}
              onChange={(next) => setOperationFilter(next as "All" | SaleOperation)}
              options={operationFilterOptions}
              placeholder={t("overview.totalSales.operations.all")}
              className="sm:w-[140px]"
            />

            {/* Period */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={dateRange === "CUSTOM" ? "60_DAYS" : dateRange}
              onChange={(next) => {
                setDateRange(next as DashboardDateRange);
                setChartTab(next === "LAST_WEEK" ? "Daily" : next === "30_DAYS" ? "Weekly" : "Monthly");
              }}
              options={salesDateRangeOptions}
              placeholder={t("overview.selectRange")}
              className="sm:w-[150px]"
            />

            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredSales.length === 0}
              className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#183f6b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1 sm:h-9 sm:text-[12px]"
              style={mont}
            >
              <Plus size={16} />
              <span>{t("overview.totalSales.export")}</span>
            </button>
          </div>
        </div>

        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-[#f9fafb] text-left">
                {[
                  t("overview.totalSales.columns.agentName"),
                  t("overview.totalSales.columns.listingId"),
                  t("overview.totalSales.columns.opportunityId"),
                  t("overview.totalSales.columns.operationType"),
                  t("overview.totalSales.columns.date"),
                  t("overview.totalSales.columns.revenue"),
                  "",
                ].map(
                  (heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-[#6a7282] lg:px-5 lg:text-[14px]"
                      style={mont}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {salesQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 size={20} className="mx-auto animate-spin text-[#99a1af]" />
                  </td>
                </tr>
              )}

              {!salesQuery.isLoading &&
                filteredSales.map((row) => (
                  <tr
                    key={row.opportunityId}
                    className="border-t border-[#f3f4f6] transition-colors hover:bg-[#fcfcfd]"
                  >
                    <td className="px-4 py-3 lg:px-5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                          style={mont}
                        >
                          {row.agentAvatarUrl ? <img src={row.agentAvatarUrl} alt={row.agentName} className="size-full rounded-full object-cover" /> : row.agentName.split(" ").map(name => name[0]).join("").slice(0, 2)}
                        </span>

                        <span className="whitespace-nowrap text-[12px] text-[#2b3038] lg:text-[14px]" style={mont}>
                          {row.agentName}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]" style={mont}>
                      {row.listingId ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]" style={mont}>
                      {row.opportunityId}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                      <OperationBadge operation={row.operation} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]" style={mont}>
                      {new Date(row.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-[#1e4f86] lg:px-5 lg:text-[14px]" style={mont}>
                      USD ${row.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>

                    <td className="px-4 py-3 text-right lg:px-5">
                      <SaleActions row={row} />
                    </td>
                  </tr>
                ))}

              {!salesQuery.isLoading && filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    {allSales.length === 0 ? t("overview.totalSales.emptyNoSales") : t("overview.totalSales.emptyNoMatches")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Improved mobile cards */}
        <div className="flex flex-col gap-3 bg-[#f8fafc] p-3 sm:hidden">
          {salesQuery.isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[#99a1af]" />
            </div>
          )}

          {!salesQuery.isLoading && filteredSales.length === 0 && (
            <p className="py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
              {allSales.length === 0 ? t("overview.totalSales.emptyNoSales") : t("overview.totalSales.emptyNoMatches")}
            </p>
          )}

          {filteredSales.map((row) => (
            <article
              key={row.opportunityId}
              className="rounded-[14px] border border-[#e8ebef] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                    style={mont}
                  >
                    {row.agentAvatarUrl ? <img src={row.agentAvatarUrl} alt={row.agentName} className="size-full rounded-full object-cover" /> : row.agentName.split(" ").map(name => name[0]).join("").slice(0, 2)}
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-[#0d2138]" style={mont}>
                      {row.agentName}
                    </h3>

                    <p className="mt-1 text-[14px] text-[#99a1af]" style={mont}>
                      {new Date(row.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center">
                  <SaleActions row={row} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    {t("overview.totalSales.columns.listingId")}
                  </p>
                  <p className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]" style={mont}>
                    {row.listingId ?? "—"}
                  </p>
                </div>

                <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    {t("overview.totalSales.columns.opportunityId")}
                  </p>
                  <p className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]" style={mont}>
                    {row.opportunityId}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#f3f4f6] pt-4">
                <div>
                  <p className="mb-2 text-[14px] text-[#99a1af]" style={mont}>
                    {t("overview.totalSales.columns.operationType")}
                  </p>
                  <OperationBadge operation={row.operation} />
                </div>

                <div className="text-right">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    {t("overview.totalSales.columns.revenue")}
                  </p>
                  <p className="mt-1.5 text-[14px] font-semibold text-[#1e4f86]" style={mont}>
                    USD ${row.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f3f4f6] bg-white px-4 py-4 sm:px-5 sm:py-3">
          <p className="text-center text-[14px] font-medium text-[#6a7282] sm:text-left sm:text-[12px]" style={mont}>
            {t("overview.totalSales.showingResults", { shown: filteredSales.length, total: allSales.length })}
          </p>
        </div>
      </div>
    </div>
  );
}
