"use client";

import { useState } from "react";
import { Search, Plus, DollarSign, FolderOpen, Trophy, BarChart3, Filter, Download, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import {
  MOCK_OPPORTUNITIES,
  STAGE_TABS,
  type Opportunity,
  type OppStatus,
  STATUS_BADGE,
} from "./opportunities-data";
import { AddOpportunityModal, type NewOpportunity } from "./components/AddOpportunityModal";
import { OpportunityFilterModal } from "./components/OpportunityFilterModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  trend,
  iconBg,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
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

function StatusBadge({ status }: { status: OppStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type OpportunitiesPageProps = {
  role: Role;
};

export function OpportunitiesPage({ role }: OpportunitiesPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof STAGE_TABS)[number]>("All");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);

  const canCreate = hasPermission(role, "opportunities:create");

  const filtered = opportunities.filter((o) => {
    const matchesTab = activeTab === "All" || o.stage === activeTab;
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.propertyId.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleCreate(input: NewOpportunity) {
    setOpportunities((prev) => [
      {
        id: Math.max(0, ...prev.map((o) => o.id)) + 1,
        name: input.name || "Untitled Opportunity",
        propertyId: "#1234",
        commission: input.dealSize ? `$${Number(input.dealSize).toLocaleString("en-US")}` : "$0",
        probability: input.probability,
        stage: input.stage,
        expectedClose: input.expectedClose || "—",
        status: input.status,
      },
      ...prev,
    ]);
    setShowModal(false);
  }

  function handleDelete(id: number) {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    setOpenMenuId(null);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Opportunity</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Track and manage sales opportunities</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            New Opportunity
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total Value" value="$2.77M" trend="↑ 2 new this month" iconBg="#fef3c7" icon={<DollarSign size={18} className="text-[#f59e0b]" />} />
        <StatCard label="Open" value="2" sub="$23,000" trend="↑ 2 new this month" iconBg="#e0e7ff" icon={<FolderOpen size={18} className="text-[#6366f1]" />} />
        <StatCard label="Won" value="2" sub="$125,000" trend="↑ 2 new this month" iconBg="#d1fae5" icon={<Trophy size={18} className="text-[#10b981]" />} />
        <StatCard label="Win Rate" value="40%" trend="↑ 2 new this month" iconBg="#dbeafe" icon={<BarChart3 size={18} className="text-[#3b82f6]" />} />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          {/* Stage tabs */}
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
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities..."
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            <button type="button" className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Export CSV
              <Download size={16} />
            </button>
            <button type="button" onClick={() => setShowFilter(true)} className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Filter By
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                {["Opportunity", "Property ID", "Commission", "Probability", "Stage", "Expected Close", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                ))}
                <th className="px-5 py-3 w-[55px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((opp) => (
                <tr key={opp.id} className="border-b border-[#e5e7eb] last:border-b-0">
                  <td className="px-5 py-4">
                    <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{opp.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#6a7282]" style={mont}>{opp.propertyId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{opp.commission}</span>
                  </td>
                  <td className="px-5 py-4">
                    <ProbabilityBar value={opp.probability} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-[#f8fafc] border border-[#e5e7eb] text-[12px] font-medium text-[#2b3038] whitespace-nowrap" style={mont}>{opp.stage}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{opp.expectedClose}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={opp.status} />
                  </td>
                  <td className="px-5 py-4 w-[55px] text-center">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === opp.id ? null : opp.id)}
                        title="Actions"
                        className="inline-flex items-center justify-center text-[#6a7282] hover:text-[#0d2138] transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === opp.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[184px] bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] overflow-hidden py-1">
                            <button
                              type="button"
                              onClick={() => { setShowModal(true); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1f2937] hover:bg-[#f9fafb] transition-colors"
                              style={mont}
                            >
                              <Pencil size={16} className="text-[#6a7282]" />
                              Edit
                            </button>
                            <div className="h-px bg-[#f0f0f0]" />
                            <button
                              type="button"
                              onClick={() => handleDelete(opp.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#e7000b] hover:bg-[#fff5f5] transition-colors"
                              style={mont}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No opportunities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddOpportunityModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
      {showFilter && (
        <OpportunityFilterModal
          resultCount={filtered.length}
          onApply={() => setShowFilter(false)}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
