"use client";

import { useState } from "react";
import { Search, Plus, Users, Percent, Flame, Target, Filter, ChevronDown, Download, MoreVertical } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { MOCK_LEADS, type Lead, type LeadStatus, STATUS_BADGE, scoreColor } from "./leads-data";
import { AddLeadModal, type NewLead } from "./components/AddLeadModal";
import { LeadFilterModal } from "./components/LeadFilterModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

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
  icon: React.ReactNode;
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
        <p className="text-[24px] font-semibold leading-[28px]" style={{ color: valueColor ?? "#0d2138", ...poppins }}>{value}</p>
        <p className="text-[12px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[64px] h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
      </div>
      <span className="text-[12px] text-[#6a7282]" style={mont}>{score}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type LeadsPageProps = {
  role: Role;
};

export function LeadsPage({ role }: LeadsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name" | "score">("default");
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

  const canCreate = hasPermission(role, "leads:create");

  const filtered = leads
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "score") return b.score - a.score;
      return 0;
    });

  function handleCreate(input: NewLead) {
    setLeads((prev) => [
      {
        id: Math.max(0, ...prev.map((l) => l.id)) + 1,
        name: input.name || "Unnamed Lead",
        email: input.email,
        phone: input.phone,
        source: input.source,
        location: "—",
        budget: input.minBudget && input.maxBudget ? `$${input.minBudget}-$${input.maxBudget}` : "—",
        score: input.score,
        status: input.status,
      },
      ...prev,
    ]);
    setShowModal(false);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Leads</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage and nurture your sales leads</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            Add Leads
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total Leads"           value={String(leads.length)} trend="↑ 2 new this month" iconBg="#e0e7ff" icon={<Users size={18} className="text-[#6366f1]" />} />
        <StatCard label="Conversion Rate (Won)" value="32%" trend="↑ 2 new this month" iconBg="#d1fae5" icon={<Percent size={18} className="text-[#10b981]" />} />
        <StatCard label="Lost Leads"            value={String(leads.filter((l) => l.status === "Lost").length)} valueColor="#e7000b" trend="↑ 2 new this month" iconBg="#fee2e2" icon={<Flame size={18} className="text-[#ef4444]" />} />
        <StatCard label="Cold (Not Contacted)"  value={String(leads.filter((l) => l.status === "Cold").length)} trend="↑ 2 new this month" iconBg="#e0f2fe" icon={<Target size={18} className="text-[#0284c7]" />} />
      </div>

      {/* Leads table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Leads List</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Filter
              <Filter size={16} />
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="default">Sort By</option>
                <option value="name">Name (A–Z)</option>
                <option value="score">Lead Score</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Export CSV
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                {["Name", "Contact", "Source", "Location", "Budget", "Score", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                ))}
                <th className="px-5 py-3 w-[55px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-[#e5e7eb] last:border-b-0">
                  {/* Name */}
                  <td className="px-5 py-4">
                    <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{lead.name}</span>
                  </td>
                  {/* Contact */}
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] text-[#0d2138] whitespace-nowrap" style={mont}>{lead.email}</span>
                      <span className="text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>{lead.phone}</span>
                    </div>
                  </td>
                  {/* Source */}
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{lead.source}</span>
                  </td>
                  {/* Location */}
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{lead.location}</span>
                  </td>
                  {/* Budget */}
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{lead.budget}</span>
                  </td>
                  {/* Score */}
                  <td className="px-5 py-4">
                    <ScoreBar score={lead.score} />
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4 w-[55px] text-center">
                    <button type="button" title="Actions" className="inline-flex items-center justify-center text-[#6a7282] hover:text-[#0d2138] transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {leads.length} leads
          </span>
        </div>
      </div>

      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
      {showFilter && (
        <LeadFilterModal
          resultCount={filtered.length}
          onApply={() => setShowFilter(false)}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
