"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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

const DATE_RANGE_LABEL: Record<DashboardDateRange, string> = {
  LAST_WEEK: "Last Week",
  "60_DAYS": "Last 60 Days",
  "90_DAYS": "Last 90 Days",
  CUSTOM: "Custom Range",
};

const DATE_RANGE_OPTIONS = (["LAST_WEEK", "60_DAYS", "90_DAYS", "CUSTOM"] as const).map((value) => ({
  value,
  label: DATE_RANGE_LABEL[value],
}));

const SALES_DATE_RANGE_OPTIONS = (["LAST_WEEK", "60_DAYS", "90_DAYS"] as const).map((value) => ({
  value,
  label: DATE_RANGE_LABEL[value],
}));

const OPERATION_FILTER_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Rent", label: "Rent" },
  { value: "Sale", label: "Sale" },
  { value: "Sale & Rent", label: "Sale & Rent" },
];

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricIcon({ card }: { card: MetricCard }) {
  const label = card.label.toLowerCase();

  if (label.includes("listing") || label.includes("propiedades")) {
    return <Building2 size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />;
  }

  if (label.includes("lost")) {
    return <TrendingDown size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />;
  }

  if (label.includes("won") || label.includes("ganadas") || label.includes("abiertas")) {
    return <TrendingUp size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />;
  }

  if (label.includes("revenue") || label.includes("comisión")) {
    return <DollarSign size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />;
  }

  return <Building2 size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />;
}

function MetricCardView({ card }: { card: MetricCard }) {
  const isUp = card.trendDirection === "up";
  const chartData = card.sparkline.map((value, index) => ({ index, value }));

  return (
    <div className="min-w-0 flex-1 rounded-[16px] border border-[#f3f4f6] bg-white p-[18px]">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>
          {card.label}
        </p>

        <span
          className="flex size-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: card.iconBg }}
        >
          <MetricIcon card={card} />
        </span>
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[24px] font-semibold text-[#0d2138]" style={poppins}>
          {card.value}
        </span>

        {card.sub && (
          <span className="text-[14px] font-medium text-[#6a7282]" style={mont}>
            {card.sub}
          </span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-1">
        {isUp ? (
          <ArrowUpRight size={14} className="text-[#00c950]" />
        ) : (
          <ArrowDownRight size={14} className="text-[#fb2c36]" />
        )}

        <div className="flex items-center gap-1 text-[12px]" style={mont}>
          <span
            className={`font-semibold ${isUp ? "text-[#00c950]" : "text-[#fb2c36]"
              }`}
          >
            {card.trendValue}
          </span>

          <span className="font-normal text-[#6a7282]">
            {card.trendText}
          </span>
        </div>
      </div>

      <div className="h-7 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isUp ? "#00c950" : "#fb2c36"}
              strokeWidth={1.8}
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
    <div className="min-w-0 flex-1 animate-pulse rounded-[16px] border border-[#f3f4f6] bg-white p-[18px]">
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
  const style = OPERATION_STYLE[operation];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ backgroundColor: style.bg, color: style.text, ...mont }}
    >
      {operation}
    </span>
  );
}

// ── Sale actions dropdown ─────────────────────────────────────────────────────

function SaleActions({ row }: { row: SaleRow }) {
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
        aria-label={`Open options for ${row.agentName}`}
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
            aria-label={`Actions for ${row.agentName}`}
            className="fixed z-[100] w-[205px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
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
              <span>View Agent Profile</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleEdit}
              className="flex w-full items-center gap-3 border-t border-[#eeeeee] px-5 py-4 text-[14px] text-[#282d35] transition-colors hover:bg-[#f8f9fa]"
              style={mont}
            >
              <SquarePen size={18} className="shrink-0 text-[#64748b]" />
              <span>Edit</span>
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
    payload: any;
    [key: string]: any;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const revenueItem = payload.find((x) => x.dataKey === "revenue");
  const oppsItem = payload.find((x) => x.dataKey === "openOpportunities");

  const revenue = revenueItem ? Number(revenueItem.value) : 0;
  const openOpportunities = oppsItem ? Number(oppsItem.value) : 0;

  const gap = openOpportunities - revenue;
  const gapSign = gap >= 0 ? "+" : "-";
  const gapFormatted = `${gapSign}US$${Math.abs(gap).toLocaleString("en-US")}`;

  let percentChange = 0;
  if (revenue > 0) {
    percentChange = ((openOpportunities - revenue) / revenue) * 100;
  } else if (openOpportunities > 0) {
    percentChange = 100;
  }

  const isPercentUp = percentChange >= 0;
  const percentFormatted = `${isPercentUp ? "+" : ""}${percentChange.toFixed(1)}%`;

  return (
    <div
      className="w-[237px] rounded-[24px] border border-[#f3f4f6] bg-white p-[18px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      style={mont}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#6a7282] tracking-wider" style={mont}>
          {String(label).toUpperCase()}
        </span>
        <span
          className={`flex h-6 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isPercentUp ? "bg-[#e8f7f0] text-[#10b981]" : "bg-[#fef2f2] text-[#ef4444]"
            }`}
          style={mont}
        >
          {isPercentUp ? (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 shrink-0"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          ) : (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 shrink-0"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          )}
          {percentFormatted}
        </span>
      </div>

      <div className="my-3 border-b border-[#f3f4f6]" />

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {/* Revenue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#fff1f2]">
              <span className="text-[15px] font-bold text-[#ff3545]" style={poppins}>
                $
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#8f9cae]" style={mont}>
                Revenue
              </span>
              <span className="text-[15px] font-bold text-[#0d2138] leading-tight" style={poppins}>
                US${revenue.toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#ff3545] shrink-0" />
        </div>

        {/* Open Opportunities */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#fff7ed]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6b00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#8f9cae]" style={mont}>
                Open Opportunities
              </span>
              <span className="text-[15px] font-bold text-[#0d2138] leading-tight" style={poppins}>
                US${openOpportunities.toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#ff6b00] shrink-0" />
        </div>
      </div>

      <div className="my-3 border-b border-[#f3f4f6]" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#6a7282]" style={mont}>
          Gap
        </span>
        <span
          className={`text-[15px] font-bold ${gap >= 0 ? "text-[#059669]" : "text-[#ef4444]"
            }`}
          style={poppins}
        >
          {gapFormatted}
        </span>
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

export function DashboardOverviewPage({ role, firstName }: DashboardOverviewProps) {
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
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium text-[#0d2138] sm:text-[20px]" style={poppins}>
            Dashboard
          </h1>

          <p className="mt-1 text-[12px] font-medium leading-5 text-[#6a7282] sm:text-[14px]" style={mont}>
            {firstName ? `Bienvenido ${firstName}!` : "Bienvenido!"} Este es tu resumen de hoy.
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
              }
            }}
            options={DATE_RANGE_OPTIONS}
            placeholder="Select range"
            className="col-span-2 sm:col-span-1 sm:w-[180px]"
          />

          {(showCustomInputs || dateRange === "CUSTOM") && (
            <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
              <DatePickerField
                value={customFrom}
                onChange={setCustomFrom}
                placeholder="From"
                className="sm:w-[140px]"
              />
              <span className="text-[#99a1af]">–</span>
              <DatePickerField
                value={customTo}
                onChange={setCustomTo}
                placeholder="To"
                className="sm:w-[140px]"
              />
              <button
                type="button"
                onClick={handleApplyCustomRange}
                disabled={!customFrom || !customTo}
                className="h-10 shrink-0 rounded-[10px] bg-[#1e4f86] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[14px]"
                style={mont}
              >
                Apply
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
              Add Listing
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
        <div className="min-w-0 flex-1 rounded-[14px] border border-[#f3f4f6] bg-white px-3 pb-3 pt-4 sm:px-4">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="mb-3 text-[14px] font-semibold leading-5 text-[#0d2138]" style={mont}>
                Open Opportunities / Revenue
              </h2>

              <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#ff3545]" />
                  <span className="text-[10px] font-medium text-[#6a7282]" style={mont}>
                    Revenue
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#ff6b00]" />
                  <span className="text-[10px] font-medium text-[#6a7282]" style={mont}>
                    Open Opportunities
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:shrink-0">
              <button
                type="button"
                onClick={() => chartQuery.refetch()}
                className="flex size-7 shrink-0 items-center justify-center text-[#99a1af]"
                aria-label="Refresh chart"
              >
                {chartQuery.isFetching ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCcw size={12} strokeWidth={1.5} />
                )}
              </button>

              <div className="grid min-w-0 flex-1 grid-cols-3 items-center rounded-[8px] bg-[#f3f4f6] p-[3px] md:flex md:flex-none">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setChartTab(tab)}
                    className={`min-w-0 rounded-[6px] px-2 py-1.5 text-[10px] font-medium transition-colors sm:px-3 ${chartTab === tab ? "bg-white text-[#1e4f86] shadow-sm" : "text-[#99a1af]"
                      }`}
                    style={mont}
                  >
                    <span className="block truncate">{tab}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[210px] w-full min-w-0 sm:h-[230px] lg:h-[185px]">
            {mounted && !chartQuery.isLoading && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3545" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#ff3545" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="grad-opps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
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
                    width={42}
                    tick={{ fontSize: 9, fill: "#99a1af" }}
                  />

                  <Tooltip cursor={{ stroke: "#e2e8f0", strokeWidth: 1.5 }} content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="openOpportunities"
                    stroke="#ff6b00"
                    strokeWidth={1.8}
                    fill="url(#grad-opps)"
                    dot={false}
                    isAnimationActive={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff3545"
                    strokeWidth={1.8}
                    fill="url(#grad-revenue)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {mounted && !chartQuery.isLoading && chartData.length === 0 && (
              <div className="flex h-full items-center justify-center text-[12px] text-[#99a1af]" style={mont}>
                No hay datos para este período.
              </div>
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="w-full min-w-0 shrink-0 rounded-[14px] border border-[#f3f4f6] bg-white p-4 lg:w-[292px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
              Locations
            </h2>

            <button
              type="button"
              onClick={() => router.push("/dashboard/locations")}
              className="flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-[#f3f4f6] px-3 text-[10px] font-medium text-[#6a7282]"
              style={mont}
            >
              <Plus size={13} strokeWidth={1.7} />
              Add Location
            </button>
          </div>

          <div className="flex flex-col">
            {locationsQuery.isLoading && (
              <p className="py-3 text-center text-[12px] text-[#99a1af]" style={mont}>
                Cargando…
              </p>
            )}

            {!locationsQuery.isLoading && locations.length === 0 && (
              <p className="py-3 text-center text-[12px] text-[#99a1af]" style={mont}>
                No hay locations todavía.
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

                <span className="flex min-w-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6a7282]" style={mont}>
                  {location.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total Sales */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        {/* Header */}
        <div className="border-b border-[#f3f4f6] p-4 sm:p-5">
          <h2 className="mb-4 text-[14px] font-semibold text-[#0d2138] sm:mb-0 sm:text-[16px]" style={mont}>
            Total Sales
          </h2>

          <div className="grid grid-cols-2 gap-2.5 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {/* Search */}
            <div className="col-span-2 flex h-11 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 focus-within:border-[#1e4f86] sm:h-9 sm:w-[180px]">
              <Search size={16} className="shrink-0 text-[#99a1af]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sales..."
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
              options={OPERATION_FILTER_OPTIONS}
              placeholder="All"
              className="sm:w-[140px]"
            />

            {/* Period */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={dateRange === "CUSTOM" ? "60_DAYS" : dateRange}
              onChange={(next) => setDateRange(next as DashboardDateRange)}
              options={SALES_DATE_RANGE_OPTIONS}
              placeholder="Select range"
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
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-[#f9fafb] text-left">
                {["Agent Name", "Listing ID", "Opportunity ID", "Operation Type", "Date", "Revenue", ""].map(
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
                          {row.agentName
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .slice(0, 2)}
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
                      ${row.revenue.toLocaleString("en-US")}
                    </td>

                    <td className="px-4 py-3 text-right lg:px-5">
                      <SaleActions row={row} />
                    </td>
                  </tr>
                ))}

              {!salesQuery.isLoading && filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    {allSales.length === 0 ? "No sales in this period yet." : "No sales match your search."}
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
              {allSales.length === 0 ? "No sales in this period yet." : "No sales match your search."}
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
                    {row.agentName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
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
                    Listing ID
                  </p>
                  <p className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]" style={mont}>
                    {row.listingId ?? "—"}
                  </p>
                </div>

                <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    Opportunity ID
                  </p>
                  <p className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]" style={mont}>
                    {row.opportunityId}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#f3f4f6] pt-4">
                <div>
                  <p className="mb-2 text-[14px] text-[#99a1af]" style={mont}>
                    Operation Type
                  </p>
                  <OperationBadge operation={row.operation} />
                </div>

                <div className="text-right">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    Revenue
                  </p>
                  <p className="mt-1.5 text-[14px] font-semibold text-[#1e4f86]" style={mont}>
                    ${row.revenue.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f3f4f6] bg-white px-4 py-4 sm:px-5 sm:py-3">
          <p className="text-center text-[14px] font-medium text-[#6a7282] sm:text-left sm:text-[12px]" style={mont}>
            Showing {filteredSales.length} of {allSales.length} results
          </p>
        </div>
      </div>
    </div>
  );
}
