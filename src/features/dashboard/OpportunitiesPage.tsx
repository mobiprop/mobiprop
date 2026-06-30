"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Plus, DollarSign, FolderOpen, Trophy, BarChart3,
  Filter, Download, MoreVertical, Pencil, Trash2, FileSignature, Loader2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { OpportunityStatus } from "@/generated/prisma/enums";
import type { OpportunityDto } from "@/features/crm/types/crm-dto";
import { useDashboardOpportunitiesQuery } from "@/hooks/queries/useDashboardOpportunitiesQuery";
import {
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useDeleteOpportunityMutation,
} from "@/hooks/mutations/useCrmMutations";
import { AddOpportunityModal, type OpportunityFormValues } from "./components/AddOpportunityModal";
import { OpportunityFilterModal } from "./components/OpportunityFilterModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_TABS = ["All", "QUALIFICATION", "VISITATION", "OFFER", "NEGOTIATION", "CLOSING"] as const;
type StageTab = (typeof STAGE_TABS)[number];

const STAGE_LABEL: Record<string, string> = {
  QUALIFICATION: "Qualification",
  VISITATION: "Visitation",
  OFFER: "Offer",
  NEGOTIATION: "Negotiation",
  CLOSING: "Closing",
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: "#dbeafe", text: "#1e4f86" },
  CLOSED_WON:  { bg: "#dcfce7", text: "#16a34a" },
  CLOSED_LOST: { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open", CLOSED_WON: "Closed Won", CLOSED_LOST: "Closed Lost",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, iconBg, icon }: {
  label: string; value: string; sub?: string; trend: string; iconBg: string; icon: React.ReactNode;
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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.OPEN;
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function fmt(n: number | null) {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OpportunitiesPage({ role }: { role: Role }) {
  const router = useRouter();
  const [editing, setEditing] = useState<OpportunityDto | "new" | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StageTab>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, isError } = useDashboardOpportunitiesQuery();
  const createMutation = useCreateOpportunityMutation();
  const updateMutation = useUpdateOpportunityMutation();
  const deleteMutation = useDeleteOpportunityMutation();

  const canCreate = hasPermission(role, "opportunities:create");
  const canDelete = hasPermission(role, "opportunities:delete");

  const opportunities = useMemo(() => data?.opportunities ?? [], [data]);
  const metrics = data?.metrics;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return opportunities.filter((o) => {
      const matchesTab = activeTab === "All" || o.stage === activeTab;
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        (o.contactName ?? "").toLowerCase().includes(q) ||
        (o.propertyTitle ?? "").toLowerCase().includes(q) ||
        o.opportunityId.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [opportunities, search, activeTab]);

  async function handleSubmit(values: OpportunityFormValues) {
    const payload = {
      title: values.title || "Untitled Opportunity",
      contactId: values.contactId || undefined,
      propertyId: values.propertyId || undefined,
      dealType: values.dealType,
      dealSize: values.dealSize ? Number(values.dealSize) : undefined,
      stage: values.stage,
      status: values.status,
      probability: values.probability,
      commission: values.commission ? Number(values.commission) : undefined,
      commissionUnit: values.commissionUnit,
      paymentTerms: values.paymentTerms || undefined,
      contractStart: values.contractStart || undefined,
      contractEnd: values.contractEnd || undefined,
      expectedCloseAt: values.expectedCloseAt || undefined,
      assignedAgentId: values.assignedAgentId || undefined,
      agentCommissionValue: values.agentCommissionValue ? Number(values.agentCommissionValue) : undefined,
      agentCommissionUnit: values.agentCommissionUnit,
      notes: values.notes || undefined,
    };

    try {
      if (editing && editing !== "new") {
        await updateMutation.mutateAsync({ id: editing.id, body: payload });
        toast.success("Opportunity updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Opportunity created");
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save opportunity");
    }
  }

  async function handleDelete(opp: OpportunityDto) {
    if (!confirm(`Delete "${opp.title}"? This can't be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(opp.id);
      toast.success("Opportunity deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete opportunity");
    }
  }

  const winRate = metrics && metrics.total > 0
    ? Math.round((metrics.closedWon / metrics.total) * 100)
    : 0;

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
            onClick={() => setEditing("new")}
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
        <StatCard label="Total Value" value={isLoading ? "—" : fmt(metrics?.totalValue ?? null)} trend="Live from database" iconBg="#fef3c7" icon={<DollarSign size={18} className="text-[#f59e0b]" />} />
        <StatCard label="Open" value={isLoading ? "—" : String(metrics?.open ?? 0)} trend="Active opportunities" iconBg="#e0e7ff" icon={<FolderOpen size={18} className="text-[#6366f1]" />} />
        <StatCard label="Won" value={isLoading ? "—" : String(metrics?.closedWon ?? 0)} trend="Closed successfully" iconBg="#d1fae5" icon={<Trophy size={18} className="text-[#10b981]" />} />
        <StatCard label="Win Rate" value={isLoading ? "—" : `${winRate}%`} trend="Closed Won ÷ Total" iconBg="#dbeafe" icon={<BarChart3 size={18} className="text-[#3b82f6]" />} />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
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
                {tab === "All" ? "All" : STAGE_LABEL[tab]}
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
              Export CSV <Download size={16} />
            </button>
            <button type="button" onClick={() => setShowFilter(true)} className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Filter By <Filter size={16} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[14px]" style={mont}>Loading opportunities…</span>
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-[14px] text-red-500" style={mont}>Failed to load opportunities.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                  {["Opportunity", "Contact", "Deal Size", "Probability", "Stage", "Expected Close", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                  ))}
                  <th className="px-5 py-3 w-[55px]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((opp: OpportunityDto) => (
                  <tr key={opp.id} className="border-b border-[#e5e7eb] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{opp.title}</span>
                        <span className="text-[11px] text-[#99a1af]" style={mont}>{opp.opportunityId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] text-[#6a7282]" style={mont}>{opp.contactName ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{fmt(opp.dealSize)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <ProbabilityBar value={opp.probability} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-[6px] bg-[#f8fafc] border border-[#e5e7eb] text-[12px] font-medium text-[#2b3038] whitespace-nowrap" style={mont}>
                        {STAGE_LABEL[opp.stage] ?? opp.stage}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>
                        {opp.expectedCloseAt ? new Date(opp.expectedCloseAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
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
                            <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[200px] bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] overflow-hidden py-1">
                              <button
                                type="button"
                                onClick={() => { setEditing(opp); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1f2937] hover:bg-[#f9fafb] transition-colors"
                                style={mont}
                              >
                                <Pencil size={16} className="text-[#6a7282]" /> Edit
                              </button>
                              {opp.status === OpportunityStatus.CLOSED_WON && (
                                <button
                                  type="button"
                                  onClick={() => { router.push(`/dashboard/contracts?fromOpportunity=${opp.id}`); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1f2937] hover:bg-[#f9fafb] transition-colors"
                                  style={mont}
                                >
                                  <FileSignature size={16} className="text-[#6a7282]" /> Create Contract
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => { handleDelete(opp); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                                  style={mont}
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              )}
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
                      {opportunities.length === 0 ? "No opportunities yet — create your first." : "No opportunities match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <AddOpportunityModal
          mode={editing === "new" ? "create" : "edit"}
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      )}
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
