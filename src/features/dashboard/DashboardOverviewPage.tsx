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
  CalendarDays,
  ChevronDown,
  MoreVertical,
  Plus,
  Search,
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

function MetricCardView({ card }: { card: MetricCard }) {
  const isUp = card.trendDirection === "up";
  const chartData = card.sparkline.map((v, i) => ({ i, v }));
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[16px] p-[18px]">
      <div className="flex items-start justify-between mb-2">
        <span
          className="size-9 rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: card.iconBg }}
        >
          <span className="size-3 rounded-[3px]" style={{ backgroundColor: card.iconColor }} />
        </span>
        <div className="w-[72px] h-9">
          <AreaChart width={72} height={36} data={chartData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={`spark-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#00c950" : "#fb2c36"} stopOpacity={0.25} />
                <stop offset="100%" stopColor={isUp ? "#00c950" : "#fb2c36"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={isUp ? "#00c950" : "#fb2c36"} strokeWidth={1.5} fill={`url(#spark-${card.key})`} />
          </AreaChart>
        </div>
      </div>
      <p className="text-[14px] font-medium text-[#6a7282] mb-1" style={mont}>{card.label}</p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[24px] font-semibold text-[#0d2138]" style={poppins}>{card.value}</span>
        {card.sub && <span className="text-[14px] font-medium text-[#6a7282]" style={mont}>{card.sub}</span>}
      </div>
      <div className="flex items-center gap-1">
        {isUp ? <ArrowUpRight size={14} className="text-[#00c950]" /> : <ArrowDownRight size={14} className="text-[#fb2c36]" />}
        <span className={`text-[12px] font-medium ${isUp ? "text-[#00c950]" : "text-[#fb2c36]"}`} style={mont}>
          {card.trendLabel}
        </span>
      </div>
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
  const s = OPERATION_STYLE[operation];
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
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

export function DashboardOverviewPage({ role, firstName }: DashboardOverviewProps) {
  const metrics = getMetricsForRole(role);
  const [chartTab, setChartTab] = useState<(typeof CHART_TABS)[number]>("Mensual");
  const [mounted, setMounted] = useState(false);
  const canAddListing = role !== "CLIENT";

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="px-8 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#0d2138]" style={poppins}>Dashboard</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>
            {firstName ? `Bienvenido ${firstName}!` : "Bienvenido!"} Este es tu resumen de hoy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-2 h-10 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] text-[#6a7282]" style={mont}>
            Mes Actual <ChevronDown size={16} />
          </button>
          <button type="button" className="flex items-center gap-2 h-10 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] text-[#6a7282]" style={mont}>
            <CalendarDays size={16} /> Seleccionar Fecha
          </button>
          {canAddListing && (
            <button type="button" className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors" style={mont}>
              <Plus size={16} /> Add Listing
            </button>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="flex flex-wrap gap-3.5">
        {metrics.map((card) => (
          <MetricCardView key={card.key} card={card} />
        ))}
      </div>

      {/* Chart + locations */}
      <div className="flex flex-col lg:flex-row gap-3.5">
        {/* Revenue / opportunities chart */}
        <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[14px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#0d2138] mb-2" style={mont}>Open Opportunities / Revenue</h2>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#ff7093]" />
                  <span className="text-[12px] text-[#99a1af]" style={mont}>Revenue</span>
                  <span className="text-[16px] font-semibold text-[#6a7282]" style={mont}>US$14.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#fe9a00]" />
                  <span className="text-[12px] text-[#99a1af]" style={mont}>Open Opportunities</span>
                  <span className="text-[16px] font-semibold text-[#6a7282]" style={mont}>US$12.000</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-[8px] p-1">
              {CHART_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChartTab(tab)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                    chartTab === tab ? "bg-white text-[#1e4f86] shadow-sm" : "text-[#99a1af]"
                  }`}
                  style={mont}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px] w-full">
            {mounted && <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_CHART} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7093" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ff7093" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-opps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fe9a00" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#fe9a00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#99a1af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#99a1af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#ff7093" strokeWidth={2} fill="url(#grad-revenue)" />
                <Area type="monotone" dataKey="opportunities" stroke="#fe9a00" strokeWidth={2} fill="url(#grad-opps)" />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Locations */}
        <div className="w-full lg:w-[340px] shrink-0 bg-white border border-[#f3f4f6] rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Ubicaciones</h2>
            <button type="button" className="flex items-center gap-1 h-8 px-2.5 bg-[#f3f4f6] rounded-[8px] text-[12px] text-[#6a7282]" style={mont}>
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="flex flex-col">
            {LOCATIONS.map((loc) => (
              <div key={loc.name} className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-b-0">
                <span className="text-[14px] text-[#2b3038]" style={mont}>{loc.name}</span>
                <span className="text-[12px] text-[#6a7282] bg-[#f5f5f5] rounded-full px-2.5 py-0.5" style={mont}>{loc.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total Sales table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Total Sales</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-9 px-3 border border-[#e5e7eb] rounded-[10px]">
              <Search size={14} className="text-[#6a7282]" />
              <input placeholder="Search..." className="text-[12px] text-[#2b3038] placeholder:text-[#6a7282] bg-transparent outline-none w-[120px]" style={mont} />
            </div>
            <button type="button" className="h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#6a7282]" style={mont}>Last Month</button>
            <button type="button" className="h-9 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[12px] font-medium hover:bg-[#1b487a] transition-colors" style={mont}>Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-[#f9fafb] text-left">
                {["Agent Name", "Listing ID", "Opportunity ID", "Operation Type", "Date", "Revenue", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282]" style={mont}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SALES.map((row, i) => (
                <tr key={i} className="border-t border-[#f3f4f6]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="size-8 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold" style={mont}>
                        {row.agentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                      <span className="text-[14px] text-[#2b3038]" style={mont}>{row.agentName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[14px] text-[#6a7282]" style={mont}>{row.listingId}</td>
                  <td className="px-5 py-3 text-[14px] text-[#6a7282]" style={mont}>{row.opportunityId}</td>
                  <td className="px-5 py-3"><OperationBadge operation={row.operation} /></td>
                  <td className="px-5 py-3 text-[14px] text-[#6a7282]" style={mont}>{row.date}</td>
                  <td className="px-5 py-3 text-[14px] font-medium text-[#1e4f86]" style={mont}>{row.revenue}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="text-[#6a7282] hover:text-[#0d2138]"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>Showing {SALES.length} of {SALES.length} results</span>
        </div>
      </div>
    </div>
  );
}
