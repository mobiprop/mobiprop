"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  CalendarDays,
  ChevronDown,
  DollarSign,
  ListFilter,
  RotateCcw,
  MoreVertical,
  Plus,
  SquarePen,
  Trash2,
  UserRound,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type { Role } from "@/lib/permissions";
import {
  getMetricsForRole,
  LOCATIONS,
  REVENUE_CHART,
  SALES,
  type MetricCard,
  type SaleOperation,
} from "./data";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricIcon({ card }: { card: MetricCard }) {
  const label = card.label.toLowerCase();

  if (label.includes("listing")) {
    return (
      <Building2
        size={18}
        strokeWidth={1.8}
        style={{ color: card.iconColor }}
      />
    );
  }

  if (label.includes("lost")) {
    return (
      <TrendingDown
        size={18}
        strokeWidth={1.8}
        style={{ color: card.iconColor }}
      />
    );
  }

  if (label.includes("won")) {
    return (
      <TrendingUp
        size={18}
        strokeWidth={1.8}
        style={{ color: card.iconColor }}
      />
    );
  }

  if (label.includes("revenue")) {
    return (
      <DollarSign
        size={18}
        strokeWidth={1.8}
        style={{ color: card.iconColor }}
      />
    );
  }

  return (
    <Building2 size={18} strokeWidth={1.8} style={{ color: card.iconColor }} />
  );
}

function MetricCardView({ card }: { card: MetricCard }) {
  const isUp = card.trendDirection === "up";
  const chartData = card.sparkline.map((value, index) => ({
    index,
    value,
  }));

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
        <span
          className="text-[24px] font-semibold text-[#0d2138]"
          style={poppins}
        >
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

        <span
          className={`text-[12px] font-medium ${
            isUp ? "text-[#00c950]" : "text-[#fb2c36]"
          }`}
          style={mont}
        >
          {card.trendLabel}
        </span>
      </div>

      <div className="h-7 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 3,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
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

// ── Sale operation badge ──────────────────────────────────────────────────────

const OPERATION_STYLE: Record<SaleOperation, { bg: string; text: string }> = {
  Rent: {
    bg: "#dff2fe",
    text: "#0069a8",
  },
  Sale: {
    bg: "#fef3c6",
    text: "#bb4d00",
  },
  "Sale & Rent": {
    bg: "#dcfce7",
    text: "#016630",
  },
};

function OperationBadge({ operation }: { operation: SaleOperation }) {
  const style = OPERATION_STYLE[operation];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        ...mont,
      }}
    >
      {operation}
    </span>
  );
}

// ── Sale actions dropdown ─────────────────────────────────────────────────────

type SaleRow = (typeof SALES)[number];

function SaleActions({ row }: { row: SaleRow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    const button = buttonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 205;
    const menuHeight = 154;
    const viewportGap = 8;

    let left = rect.right - menuWidth;
    left = Math.max(
      viewportGap,
      Math.min(left, window.innerWidth - menuWidth - viewportGap),
    );

    let top = rect.bottom + 6;

    if (top + menuHeight > window.innerHeight - viewportGap) {
      top = rect.top - menuHeight - 6;
    }

    setPosition({ top, left });
  };

  const toggleMenu = () => {
    if (!isOpen) {
      updateMenuPosition();
    }

    setIsOpen((current) => !current);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    const handleViewportChange = () => {
      closeMenu();
    };

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
    console.log("View agent profile:", row);

    // Example:
    // router.push(`/agents/${row.agentId}`);
  };

  const handleEdit = () => {
    closeMenu();
    console.log("Edit sale:", row);

    // Open your edit modal or route here.
  };

  const handleDelete = () => {
    closeMenu();
    console.log("Delete sale:", row);

    // Open your delete confirmation modal here.
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
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleViewProfile}
              className="flex w-full items-center gap-3 px-5 py-4 text-[14px] text-[#282d35] transition-colors hover:bg-[#f8f9fa]"
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

            <button
              type="button"
              role="menuitem"
              onClick={handleDelete}
              className="flex w-full items-center gap-3 border-t border-[#eeeeee] px-5 py-4 text-[14px] text-[#ff3b3b] transition-colors hover:bg-[#fff5f5]"
              style={mont}
            >
              <Trash2 size={18} className="shrink-0" />
              <span>Delete</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type DashboardOverviewProps = {
  role: Role;
  firstName: string;
};

const CHART_TABS = ["Mensual", "Semanal", "Diario"] as const;

export function DashboardOverviewPage({
  role,
  firstName,
}: DashboardOverviewProps) {
  const metrics = getMetricsForRole(role);

  const [chartTab, setChartTab] =
    useState<(typeof CHART_TABS)[number]>("Mensual");

  const [mounted, setMounted] = useState(false);

  const canAddListing = role !== "USER";

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[18px] font-medium text-[#0d2138] sm:text-[20px]"
            style={poppins}
          >
            Dashboard
          </h1>

          <p
            className="mt-1 text-[12px] font-medium leading-5 text-[#6a7282] sm:text-[14px]"
            style={mont}
          >
            {firstName ? `Bienvenido ${firstName}!` : "Bienvenido!"} Este es tu
            resumen de hoy.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <button
            type="button"
            className="flex h-10 min-w-0 items-center justify-between gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[12px] text-[#6a7282] sm:w-auto sm:justify-center sm:text-[14px]"
            style={mont}
          >
            <span className="truncate">Mes Actual</span>
            <ChevronDown size={16} className="shrink-0" />
          </button>

          <button
            type="button"
            className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[12px] text-[#6a7282] sm:w-auto sm:text-[14px]"
            style={mont}
          >
            <CalendarDays size={16} className="shrink-0" />
            <span className="truncate">Seleccionar Fecha</span>
          </button>

          {canAddListing && (
            <button
              type="button"
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
        {metrics.map((card) => (
          <MetricCardView key={card.key} card={card} />
        ))}
      </div>

      {/* Chart + locations */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Revenue / opportunities chart */}
        <div className="min-w-0 flex-1 rounded-[14px] border border-[#f3f4f6] bg-white px-3 pb-3 pt-4 sm:px-4">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2
                className="mb-3 text-[14px] font-semibold leading-5 text-[#0d2138]"
                style={mont}
              >
                Open Opportunities / Revenue
              </h2>

              <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#ff3545]" />

                  <span
                    className="text-[10px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    Revenue
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#ff6b00]" />

                  <span
                    className="text-[10px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    Open Opportunities
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className="text-[13px] font-semibold text-[#6a7282]"
                  style={mont}
                >
                  US$14.000
                </span>

                <span
                  className="text-[13px] font-semibold text-[#6a7282]"
                  style={mont}
                >
                  US$12.000
                </span>
              </div>
            </div>

            <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:shrink-0">
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center text-[#99a1af]"
                aria-label="Refresh chart"
              >
                <RotateCcw size={12} strokeWidth={1.5} />
              </button>

              <div className="grid min-w-0 flex-1 grid-cols-3 items-center rounded-[8px] bg-[#f3f4f6] p-[3px] md:flex md:flex-none">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setChartTab(tab)}
                    className={`min-w-0 rounded-[6px] px-2 py-1.5 text-[10px] font-medium transition-colors sm:px-3 ${
                      chartTab === tab
                        ? "bg-white text-[#1e4f86] shadow-sm"
                        : "text-[#99a1af]"
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
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={REVENUE_CHART}
                  margin={{
                    top: 8,
                    right: 0,
                    left: -28,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="grad-revenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ff3545"
                        stopOpacity={0.18}
                      />
                      <stop offset="100%" stopColor="#ff3545" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="grad-opps" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#ff6b00"
                        stopOpacity={0.12}
                      />
                      <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e9edf2"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    interval="preserveStartEnd"
                    minTickGap={8}
                    tick={{
                      fontSize: 9,
                      fill: "#99a1af",
                    }}
                  />

                  <YAxis
                    domain={[0, 140]}
                    ticks={[0, 35, 70, 105, 140]}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    width={42}
                    tick={{
                      fontSize: 9,
                      fill: "#99a1af",
                    }}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="opportunities"
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
          </div>
        </div>

        {/* Locations */}
        <div className="w-full min-w-0 shrink-0 rounded-[14px] border border-[#f3f4f6] bg-white p-4 lg:w-[292px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-[14px] font-semibold text-[#0d2138]"
              style={mont}
            >
              Locations
            </h2>

            <button
              type="button"
              className="flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-[#f3f4f6] px-3 text-[10px] font-medium text-[#6a7282]"
              style={mont}
            >
              <Plus size={13} strokeWidth={1.7} />
              Add Location
            </button>
          </div>

          <div className="flex flex-col">
            {LOCATIONS.map((location, index) => (
              <div
                key={`${location.name}-${index}`}
                className="flex min-h-[38px] items-center justify-between gap-3 border-b border-[#f3f4f6] py-2 last:border-b-0"
              >
                <span
                  className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#2b3038]"
                  style={mont}
                >
                  {location.name}
                </span>

                <span
                  className="flex min-w-[30px] shrink-0 items-center justify-center rounded-[6px] bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6a7282]"
                  style={mont}
                >
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
          <h2
            className="mb-4 text-[14px] font-semibold text-[#0d2138] sm:mb-0 sm:text-[16px]"
            style={mont}
          >
            Total Sales
          </h2>

          <div className="grid grid-cols-2 gap-2.5 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {/* Search */}
            <div className="col-span-2 flex h-11 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 focus-within:border-[#1e4f86] sm:h-9 sm:w-[180px]">
              <Search size={16} className="shrink-0 text-[#99a1af]" />

              <input
                type="search"
                placeholder="Search sales..."
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[12px]"
                style={mont}
              />
            </div>

            {/* Filter */}
            <button
              type="button"
              className="flex h-11 items-center justify-between gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] text-[#6a7282] sm:h-9 sm:justify-center sm:text-[12px]"
              style={mont}
            >
              <span>All</span>
              <ListFilter size={16} className="text-[#99a1af]" />
            </button>

            {/* Date */}
            <button
              type="button"
              className="flex h-11 items-center justify-between gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] text-[#6a7282] sm:h-9 sm:justify-center sm:text-[12px]"
              style={mont}
            >
              <span>Last Month</span>
              <ChevronDown size={16} className="text-[#99a1af]" />
            </button>

            {/* Export */}
            <button
              type="button"
              className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#183f6b] active:scale-[0.99] sm:col-span-1 sm:h-9 sm:text-[12px]"
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
                {[
                  "Agent Name",
                  "Listing ID",
                  "Opportunity ID",
                  "Operation Type",
                  "Date",
                  "Revenue",
                  "",
                ].map((heading, index) => (
                  <th
                    key={`${heading}-${index}`}
                    className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-[#6a7282] lg:px-5 lg:text-[14px]"
                    style={mont}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {SALES.map((row, index) => (
                <tr
                  key={index}
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

                      <span
                        className="whitespace-nowrap text-[12px] text-[#2b3038] lg:text-[14px]"
                        style={mont}
                      >
                        {row.agentName}
                      </span>
                    </div>
                  </td>

                  <td
                    className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]"
                    style={mont}
                  >
                    {row.listingId}
                  </td>

                  <td
                    className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]"
                    style={mont}
                  >
                    {row.opportunityId}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                    <OperationBadge operation={row.operation} />
                  </td>

                  <td
                    className="whitespace-nowrap px-4 py-3 text-[12px] text-[#6a7282] lg:px-5 lg:text-[14px]"
                    style={mont}
                  >
                    {row.date}
                  </td>

                  <td
                    className="whitespace-nowrap px-4 py-3 text-[12px] font-medium text-[#1e4f86] lg:px-5 lg:text-[14px]"
                    style={mont}
                  >
                    {row.revenue}
                  </td>

                  <td className="px-4 py-3 text-right lg:px-5">
                    <SaleActions row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Improved mobile cards */}
        <div className="flex flex-col gap-3 bg-[#f8fafc] p-3 sm:hidden">
          {SALES.map((row, index) => (
            <article
              key={index}
              className="rounded-[14px] border border-[#e8ebef] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              {/* Agent details */}
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
                    <h3
                      className="truncate text-[14px] font-semibold text-[#0d2138]"
                      style={mont}
                    >
                      {row.agentName}
                    </h3>

                    <p className="mt-1 text-[14px] text-[#99a1af]" style={mont}>
                      {row.date}
                    </p>
                  </div>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center">
                  <SaleActions row={row} />
                </div>
              </div>

              {/* IDs */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    Listing ID
                  </p>

                  <p
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {row.listingId}
                  </p>
                </div>

                <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                  <p className="text-[14px] text-[#99a1af]" style={mont}>
                    Opportunity ID
                  </p>

                  <p
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {row.opportunityId}
                  </p>
                </div>
              </div>

              {/* Operation and revenue */}
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

                  <p
                    className="mt-1.5 text-[14px] font-semibold text-[#1e4f86]"
                    style={mont}
                  >
                    {row.revenue}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f3f4f6] bg-white px-4 py-4 sm:px-5 sm:py-3">
          <p
            className="text-center text-[14px] font-medium text-[#6a7282] sm:text-left sm:text-[12px]"
            style={mont}
          >
            Showing {SALES.length} of {SALES.length} results
          </p>
        </div>
      </div>
    </div>
  );
}
