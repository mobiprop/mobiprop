"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Search,
  Eye,
  Loader2,
} from "lucide-react";

import { useAgentDetailQuery } from "@/hooks/queries/useAgentDetailQuery";
import { TYPE_LABELS, STATUS_LABELS, TYPE_BADGE, STATUS_BADGE } from "./listings-data";
import type { PropertyType, PropertyStatus } from "@/generated/prisma/enums";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatPrice(salePrice: number | null, rentPrice: number | null): string {
  const sale = salePrice !== null ? `$${priceFormat.format(salePrice)}` : null;
  const rent = rentPrice !== null ? `$${priceFormat.format(rentPrice)}/mo` : null;
  if (sale && rent) return `${sale} · ${rent}`;
  return sale ?? rent ?? "—";
}

function Badge({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text, ...mont }}
    >
      {label}
    </span>
  );
}

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

export function AgentDetailPage({ agentId }: { agentId: string }) {
  const { data: agent, isLoading, isError } = useAgentDetailQuery(agentId);
  const [search, setSearch] = useState("");

  const filteredProperties = useMemo(() => {
    if (!agent) return [];
    const q = search.toLowerCase();
    if (!q) return agent.properties;
    return agent.properties.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.listingId.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [agent, search]);

  if (isLoading) {
    return (
      <div className="px-6 py-10 flex items-center justify-center gap-2 text-[#6a7282]" style={mont}>
        <Loader2 size={18} className="animate-spin" /> Loading agent…
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-[14px] text-[#dc2626]" style={mont}>Agent not found or access denied.</p>
        <Link href="/dashboard/agents" className="mt-3 inline-block text-[13px] text-[#1e4f86] hover:underline" style={mont}>
          Back to Agents
        </Link>
      </div>
    );
  }

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
                <span className={`size-[7px] rounded-full ${agent.status === "ACTIVE" ? "bg-[#00c950]" : "bg-[#d1d5db]"}`} />
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
              {agent.phone && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
                  <Phone size={14} className="shrink-0" />
                  {agent.phone}
                </span>
              )}
              {agent.city && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
                  <MapPin size={14} className="shrink-0" />
                  {agent.city}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
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

        <StatCard iconBg="#d1fae5" icon={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#10b981" strokeWidth="1.5"/>
            <path d="M9 5.5v7M7 7.5c0-.83.67-1.5 2-1.5s2 .67 2 1.5-.67 1.5-2 1.5-2 .67-2 1.5.67 1.5 2 1.5 2-.67 2-1.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        }>
          <div>
            <p className="text-[24px] font-semibold text-[#0d2138] leading-7" style={poppins}>${priceFormat.format(agent.totalRevenue)}</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5" style={mont}>Total Revenue (closed contracts)</p>
          </div>
        </StatCard>

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="border-t border-[#f0f0f0] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>
                      {prop.listingId}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] text-[#2b3038] whitespace-nowrap" style={mont}>
                      {prop.title}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <Badge label={TYPE_LABELS[prop.type as PropertyType]} style={TYPE_BADGE[prop.type as PropertyType]} />
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>
                      <MapPin size={14} className="shrink-0" />
                      {prop.location}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>
                      {formatPrice(prop.salePrice, prop.rentPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-[14px]">
                    <Badge label={STATUS_LABELS[prop.status as PropertyStatus]} style={STATUS_BADGE[prop.status as PropertyStatus]} />
                  </td>
                  <td className="px-4 py-[14px] text-right">
                    <a href={`/listings/${prop.slug}`} target="_blank" rel="noopener noreferrer" title="View public listing" className="text-[#6a7282] hover:text-[#0d2138] transition-colors inline-flex">
                      <Eye size={16} />
                    </a>
                  </td>
                </tr>
              ))}
              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No properties assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
