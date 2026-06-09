"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Search,
  Eye,
} from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type PropertyType = "Apartment" | "House" | "Commercial" | "Villa";
type PropertyStatus = "Active" | "Inactive" | "Paused" | "Rented";

type AssignedProperty = {
  id: string;
  name: string;
  type: PropertyType;
  location: string;
  price: string;
  status: PropertyStatus;
};

type AgentDetail = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Inactive";
  email: string;
  phone: string;
  location: string;
  totalListings: number;
  totalRevenue: string;
  agentEarnings: string;
  earningsTrend: string;
  totalDeals: number;
  openDeals: number;
  properties: AssignedProperty[];
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_AGENTS: Record<number, AgentDetail> = {
  1: {
    id: 1,
    name: "Michael Rodriguez",
    role: "Agent",
    status: "Active",
    email: "michael.r@ulrich.com",
    phone: "+54 11 4567-8901",
    location: "La Plata, Argentina",
    totalListings: 45,
    totalRevenue: "$485K",
    agentEarnings: "$4K",
    earningsTrend: "+18%",
    totalDeals: 23,
    openDeals: 8,
    properties: [
      { id: "LST-0001", name: "Modern Downtown Apartment", type: "Apartment", location: "Buenos Aires", price: "$450,000",  status: "Active"   },
      { id: "LST-0002", name: "Family House with Garden",  type: "House",     location: "La Plata",     price: "$620,000",  status: "Active"   },
      { id: "LST-0003", name: "Luxury Penthouse",          type: "Apartment", location: "Buenos Aires", price: "$890,000",  status: "Inactive" },
      { id: "LST-0004", name: "Commercial Office Space",   type: "Commercial",location: "Córdoba",      price: "$3,500/mo", status: "Paused"   },
      { id: "LST-0005", name: "Beachfront Villa",          type: "House",     location: "Mar del Plata",price: "$1,200,000",status: "Rented"   },
    ],
  },
};

const DEFAULT_AGENT: AgentDetail = {
  id: 0,
  name: "Thomas Fletcher",
  role: "Property Specialist",
  status: "Active",
  email: "michael.r@ulrich.com",
  phone: "+54 11 4567-8901",
  location: "La Plata, Argentina",
  totalListings: 45,
  totalRevenue: "$485K",
  agentEarnings: "$4K",
  earningsTrend: "+18%",
  totalDeals: 23,
  openDeals: 8,
  properties: [
    { id: "LST-0001", name: "Modern Downtown Apartment", type: "Apartment", location: "Buenos Aires", price: "$450,000",  status: "Active"   },
    { id: "LST-0002", name: "Family House with Garden",  type: "House",     location: "La Plata",     price: "$620,000",  status: "Active"   },
    { id: "LST-0003", name: "Luxury Penthouse",          type: "Apartment", location: "Buenos Aires", price: "$890,000",  status: "Inactive" },
    { id: "LST-0004", name: "Commercial Office Space",   type: "Commercial",location: "Córdoba",      price: "$3,500/mo", status: "Paused"   },
    { id: "LST-0005", name: "Beachfront Villa",          type: "House",     location: "Mar del Plata",price: "$1,200,000",status: "Rented"   },
  ],
};

// ── Badges ────────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<PropertyType, { bg: string; text: string }> = {
  Apartment:  { bg: "#ffedd4", text: "#bb4d00" },
  House:      { bg: "#dff2fe", text: "#0069a8" },
  Commercial: { bg: "#dcfce7", text: "#00786f" },
  Villa:      { bg: "#ede9fe", text: "#6d28d9" },
};

const STATUS_STYLE: Record<PropertyStatus, { bg: string; text: string }> = {
  Active:   { bg: "#ecfdf5", text: "#00a63e" },
  Inactive: { bg: "#ffc9c9", text: "#e7000b" },
  Paused:   { bg: "#fef3c6", text: "#e17100" },
  Rented:   { bg: "#f8fafc", text: "#1e4f86" },
};

function TypeBadge({ type }: { type: PropertyType }) {
  const s = TYPE_STYLE[type];
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-[6px] text-[12px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-[6px] text-[12px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  iconBg,
  icon,
  children,
}: {
  iconBg: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-[14px] p-[15px] flex flex-col gap-3">
      <span
        className="size-10 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AgentDetailPage({ agentId }: { agentId: number }) {
  const agent = MOCK_AGENTS[agentId] ?? { ...DEFAULT_AGENT, id: agentId };

  const initials = agent.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Back link */}
      <Link
        href="/dashboard/agents"
        className="flex items-center gap-1.5 text-[14px] text-[#6a7282] hover:text-[#0d2138] transition-colors w-fit"
        style={mont}
      >
        <ArrowLeft size={16} />
        Back to Agents
      </Link>

      {/* Agent header card */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="size-[80px] rounded-full border-2 border-[#e5e7eb] bg-[#1e4f86] text-white flex items-center justify-center text-[20px] font-semibold shrink-0" style={mont}>
            {initials}
          </div>
          {/* Info */}
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-medium text-[#1f2937]" style={poppins}>
                  {agent.name}
                </h1>
                <span className="size-[7px] rounded-full bg-[#00c950]" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[14px] font-medium text-[#6a7282]" style={mont}>{agent.role}</span>
                <span
                  className="px-2 py-[3px] rounded-full text-[12px] font-semibold"
                  style={{ backgroundColor: "#dcfce7", color: "#008236", ...mont }}
                >
                  {agent.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
                <Mail size={14} className="shrink-0" />
                {agent.email}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
                <Phone size={14} className="shrink-0" />
                {agent.phone}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
                <MapPin size={14} className="shrink-0" />
                {agent.location}
              </span>
            </div>
          </div>
        </div>
        {/* Period selector */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-8 px-3 bg-[#1e4f86] text-white rounded-[10px] text-[12px] font-medium shrink-0"
          style={mont}
        >
          Last Month <ChevronDown size={16} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        {/* Total Listings */}
        <StatCard iconBg="#e0e7ff" icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="10" y="2" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="2" y="10" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="10" y="10" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
          </svg>
        }>
          <div>
            <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>{agent.totalListings}</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Total Listings</p>
          </div>
        </StatCard>

        {/* Revenue + Earnings */}
        <StatCard iconBg="#d1fae5" icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#10b981" strokeWidth="1.5"/>
            <path d="M9 5.5v7M7 7.5c0-.83.67-1.5 2-1.5s2 .67 2 1.5-.67 1.5-2 1.5-2 .67-2 1.5.67 1.5 2 1.5 2-.67 2-1.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>{agent.totalRevenue}</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Total Revenue</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>{agent.agentEarnings}</p>
                <span className="text-[12px] font-medium text-[#00a63e]" style={mont}>{agent.earningsTrend}</span>
              </div>
              <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Agent Earnings</p>
            </div>
          </div>
        </StatCard>

        {/* Total Deals */}
        <StatCard iconBg="#fef3c7" icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2l2.5 4.5H16l-3.5 3 1.5 5L9 12l-5 2.5 1.5-5L2 6.5h4.5L9 2z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        }>
          <div>
            <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>{agent.totalDeals}</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Total Deals</p>
          </div>
        </StatCard>

        {/* Open Deals */}
        <StatCard iconBg="#e0e7ff" icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="10" y="2" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="2" y="10" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
            <rect x="10" y="10" width="6" height="6" rx="1" stroke="#6366f1" strokeWidth="1.5"/>
          </svg>
        }>
          <div>
            <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>{agent.openDeals}</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Open Deals</p>
          </div>
        </StatCard>
      </div>

      {/* Properties Assigned */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Properties Assigned</h2>
            <p className="text-[12px] font-medium text-[#6a7282] mt-0.5" style={mont}>
              {agent.properties.length} total properties
            </p>
          </div>
          <div className="flex items-center gap-2 h-9 px-3 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px]">
            <Search size={14} className="text-[#6a7282] shrink-0" />
            <input
              placeholder="Search properties..."
              className="text-[13px] text-[#2b3038] placeholder:text-[rgba(10,10,10,0.5)] bg-transparent outline-none w-[160px]"
              style={mont}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#fafbfc]">
                {["LISTING ID", "PROPERTY NAME", "TYPE", "LOCATION", "PRICE", "STATUS", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[12px] font-medium text-[#99a1af] text-left tracking-wide"
                    style={mont}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agent.properties.map((prop) => (
                <tr key={prop.id} className="border-t border-[#f0f0f0] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>
                      {prop.id}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] text-[#2b3038] whitespace-nowrap" style={mont}>
                      {prop.name}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <TypeBadge type={prop.type} />
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>
                      <MapPin size={14} className="shrink-0" />
                      {prop.location}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>
                      {prop.price}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <StatusBadge status={prop.status} />
                  </td>
                  <td className="px-4 py-[14px] text-right">
                    <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
