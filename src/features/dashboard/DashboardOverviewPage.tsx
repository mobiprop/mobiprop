"use client";

import { useEffect, useState } from "react";
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
  MoreVertical,
  Plus,
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
    <Building2
      size={18}
      strokeWidth={1.8}
      style={{ color: card.iconColor }}
    />
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
        <span
          className="flex size-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: card.iconBg }}
        >
          <MetricIcon card={card} />
        </span>

        <div className="h-9 w-[72px]">
          <AreaChart
            width={72}
            height={36}
            data={chartData}
            margin={{
              top: 4,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <defs>
              <linearGradient
                id={`spark-${card.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={isUp ? "#00c950" : "#fb2c36"}
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor={isUp ? "#00c950" : "#fb2c36"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="value"
              stroke={isUp ? "#00c950" : "#fb2c36"}
              strokeWidth={1.5}
              fill={`url(#spark-${card.key})`}
              dot={false}
            />
          </AreaChart>
        </div>
      </div>

      <p
        className="mb-1 text-[14px] font-medium text-[#6a7282]"
        style={mont}
      >
        {card.label}
      </p>

      <div className="mb-2 flex items-baseline gap-2">
        <span
          className="text-[24px] font-semibold text-[#0d2138]"
          style={poppins}
        >
          {card.value}
        </span>

        {card.sub && (
          <span
            className="text-[14px] font-medium text-[#6a7282]"
            style={mont}
          >
            {card.sub}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
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
    </div>
  );
}

// ── Sale operation badge ──────────────────────────────────────────────────────

const OPERATION_STYLE: Record<
  SaleOperation,
  { bg: string; text: string }
> = {
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

function OperationBadge({
  operation,
}: {
  operation: SaleOperation;
}) {
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
            {firstName
              ? `Bienvenido ${firstName}!`
              : "Bienvenido!"}{" "}
            Este es tu resumen de hoy.
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
              className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 4 font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-span-1 sm:w-auto sm:text-[14px]"
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
      <div className="flex flex-col gap-3.5 lg:flex-row">
        {/* Revenue / opportunities chart */}
        <div className="min-w-0 flex-1 rounded-[14px] border border-[#f3f4f6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2
                className="mb-3 text-[14px] font-semibold leading-5 text-[#0d2138] sm:text-[16px]"
                style={mont}
              >
                Open Opportunities / Revenue
              </h2>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[#ff7093]" />

                  <span
                    className="text-[14px] text-[#99a1af] sm:text-[12px]"
                    style={mont}
                  >
                    Revenue
                  </span>

                  <span
                    className="ml-auto text-[14px] font-semibold text-[#6a7282] sm:ml-0 sm:text-[16px]"
                    style={mont}
                  >
                    US$14.000
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[#fe9a00]" />

                  <span
                    className="truncate text-[14px] text-[#99a1af] sm:text-[12px]"
                    style={mont}
                  >
                    Open Opportunities
                  </span>

                  <span
                    className="ml-auto shrink-0 text-[14px] font-semibold text-[#6a7282] sm:ml-0 sm:text-[16px]"
                    style={mont}
                  >
                    US$12.000
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 rounded-[8px] bg-[#f3f4f6] p-1 sm:flex sm:w-fit sm:items-center">
              {CHART_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChartTab(tab)}
                  className={`min-w-0 rounded-[6px] px-2 py-1.5 text-[14px] font-medium transition-colors sm:px-3 sm:text-[12px] ${
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

          <div className="h-[220px] w-full sm:h-[260px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={REVENUE_CHART}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -25,
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
                        stopColor="#ff7093"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#ff7093"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="grad-opps"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#fe9a00"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#fe9a00"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#f3f4f6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 10,
                      fill: "#99a1af",
                    }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={12}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: "#99a1af",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff7093"
                    strokeWidth={2}
                    fill="url(#grad-revenue)"
                  />

                  <Area
                    type="monotone"
                    dataKey="opportunities"
                    stroke="#fe9a00"
                    strokeWidth={2}
                    fill="url(#grad-opps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="w-full shrink-0 rounded-[16px] border border-[#f3f4f6] bg-white p-4 sm:p-5 lg:w-[340px]">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <h2
              className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
              style={mont}
            >
              Ubicaciones
            </h2>

            <button
              type="button"
              className="flex h-8 shrink-0 items-center gap-1 rounded-[8px] bg-[#f3f4f6] px-2.5 text-[14px] text-[#6a7282] sm:text-[12px]"
              style={mont}
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>

          <div className="flex flex-col">
            {LOCATIONS.map((location) => (
              <div
                key={location.name}
                className="flex items-center justify-between gap-3 border-b border-[#f3f4f6] py-3 last:border-b-0"
              >
                <span
                  className="min-w-0 truncate 4 text-[#2b3038] sm:text-[14px]"
                  style={mont}
                >
                  {location.name}
                </span>

                <span
                  className="shrink-0 rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[14px] text-[#6a7282] sm:text-[12px]"
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
      <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2
            className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
            style={mont}
          >
            Total Sales
          </h2>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <div className="col-span-2 flex h-9 min-w-0 items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-3 sm:col-span-1 sm:w-[180px]">
              <Search
                size={14}
                className="shrink-0 text-[#6a7282]"
              />

              <input
                placeholder="Search..."
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#2b3038] outline-none placeholder:text-[#6a7282]"
                style={mont}
              />
            </div>

            <button
              type="button"
              className="h-9 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] text-[#6a7282] sm:text-[12px]"
              style={mont}
            >
              Last Month
            </button>

            <button
              type="button"
              className="h-9 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:text-[12px]"
              style={mont}
            >
              Export
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
                    <button
                      type="button"
                      aria-label="Open sale options"
                      className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col sm:hidden">
          {SALES.map((row, index) => (
            <div
              key={index}
              className="border-t border-[#f3f4f6] p-4 first:border-t-0"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                    style={mont}
                  >
                    {row.agentName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </span>

                  <div className="min-w-0">
                    <p
                      className="truncate text-[14px] font-medium text-[#2b3038]"
                      style={mont}
                    >
                      {row.agentName}
                    </p>

                    <p
                      className="mt-0.5 text-[14px] text-[#99a1af]"
                      style={mont}
                    >
                      {row.date}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Open sale options"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Listing ID
                  </p>

                  <p
                    className="mt-1 truncate text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {row.listingId}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Opportunity ID
                  </p>

                  <p
                    className="mt-1 truncate text-[12px] text-[#6a7282]"
                    style={mont}
                  >
                    {row.opportunityId}
                  </p>
                </div>

                <div>
                  <p
                    className="mb-1.5 text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Operation Type
                  </p>

                  <OperationBadge operation={row.operation} />
                </div>

                <div>
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Revenue
                  </p>

                  <p
                    className="mt-1 4 font-medium text-[#1e4f86]"
                    style={mont}
                  >
                    {row.revenue}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#f3f4f6] px-4 py-3 sm:px-5">
          <span
            className="text-[14px] font-medium text-[#6a7282] sm:text-[12px]"
            style={mont}
          >
            Showing {SALES.length} of {SALES.length} results
          </span>
        </div>
      </div>
    </div>
  );
}