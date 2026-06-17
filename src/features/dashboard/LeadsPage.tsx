"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Users, Percent, Flame, Target,
  Filter, ChevronDown, Download, MoreVertical,
  ChevronLeft, ChevronRight,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { useDashboardLeadsQuery, useLeadMetricsQuery } from "@/hooks/queries/useDashboardLeadsQuery";
import { useArchiveLeadMutation } from "@/hooks/mutations/useLeadMutations";
import { LeadTemperature, LeadLifecycleStatus, LeadSource } from "@/generated/prisma/enums";
import type { LeadDto } from "@/features/crm/types/crm-dto";
import { AddLeadModal } from "./components/AddLeadModal";
import { LeadFilterModal } from "./components/LeadFilterModal";
import type { LeadListFilters } from "@/schemas/lead.schema";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Score helpers ─────────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

// ── Temperature badge ─────────────────────────────────────────────────────────

const TEMP_BADGE: Record<LeadTemperature, { bg: string; text: string; label: string }> = {
  COLD: { bg: "#e0f2fe", text: "#0284c7", label: "Cold" },
  WARM: { bg: "#fef3c7", text: "#d97706", label: "Warm" },
  HOT:  { bg: "#fee2e2", text: "#dc2626", label: "Hot"  },
};

const LIFECYCLE_BADGE: Record<LeadLifecycleStatus, { bg: string; text: string; label: string }> = {
  NEW:         { bg: "#e0e7ff", text: "#4f46e5", label: "New"         },
  CONTACTED:   { bg: "#d1fae5", text: "#059669", label: "Contacted"   },
  FOLLOW_UP:   { bg: "#fef3c7", text: "#d97706", label: "Follow Up"   },
  QUALIFIED:   { bg: "#dcfce7", text: "#16a34a", label: "Qualified"   },
  UNQUALIFIED: { bg: "#f3f4f6", text: "#6b7280", label: "Unqualified" },
  CONVERTED:   { bg: "#d1fae5", text: "#065f46", label: "Converted"   },
  CLOSED:      { bg: "#fee2e2", text: "#dc2626", label: "Closed"      },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, valueColor, trend, iconBg, icon,
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
      <span className="text-[12px] text-[#6a7282]" style={mont}>{score}</span>
    </div>
  );
}

function TempBadge({ temperature }: { temperature: LeadTemperature }) {
  const s = TEMP_BADGE[temperature];
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {s.label}
    </span>
  );
}

function LifecycleBadge({ status }: { status: LeadLifecycleStatus }) {
  const s = LIFECYCLE_BADGE[status];
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {s.label}
    </span>
  );
}

// ── Row actions menu ──────────────────────────────────────────────────────────

function RowActions({ lead, role, onView }: { lead: LeadDto; role: Role; onView: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const archive = useArchiveLeadMutation();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center justify-center size-7 rounded-[6px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1 min-w-[150px]">
            <button
              type="button"
              onClick={() => { onView(lead.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13px] text-[#0d2138] hover:bg-[#f9fafb]"
              style={mont}
            >
              View Details
            </button>
            {hasPermission(role, "leads:archive") && !lead.isArchived && (
              <button
                type="button"
                onClick={() => { archive.mutate(lead.id); setOpen(false); }}
                disabled={archive.isPending}
                className="w-full text-left px-3 py-2 text-[13px] text-[#dc2626] hover:bg-[#f9fafb] disabled:opacity-50"
                style={mont}
              >
                Archive
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Budget display ────────────────────────────────────────────────────────────

function formatBudget(lead: LeadDto): string {
  if (!lead.budgetMin && !lead.budgetMax) return "—";
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  if (lead.budgetMin && lead.budgetMax) return `${fmt(lead.budgetMin)}–${fmt(lead.budgetMax)}`;
  if (lead.budgetMax) return `up to ${fmt(lead.budgetMax)}`;
  return `from ${fmt(lead.budgetMin!)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Partial<Record<LeadSource, string>> = {
  WEBSITE_LISTING_INQUIRY: "Listing Inquiry",
  WEBSITE_CONTACT_FORM: "Contact Form",
  SCHEDULED_TOUR: "Tour",
  MANUAL: "Manual",
  PHONE: "Phone",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  SOCIAL_MEDIA: "Social Media",
  IMPORT: "Import",
  EXTERNAL_API: "API",
  OTHER: "Other",
};

type LeadsPageProps = {
  role: Role;
};

export function LeadsPage({ role }: LeadsPageProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<LeadListFilters["sortBy"]>("newest");
  const [page, setPage] = useState(1);

  // Debounce search
  const onSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((onSearchChange as unknown as { _timer?: ReturnType<typeof setTimeout> })._timer);
    (onSearchChange as unknown as { _timer?: ReturnType<typeof setTimeout> })._timer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }, []);

  const filters = useMemo<Partial<LeadListFilters>>(
    () => ({ search: debouncedSearch || undefined, sortBy, page, limit: 25 }),
    [debouncedSearch, sortBy, page],
  );

  const { data, isLoading, isError } = useDashboardLeadsQuery(filters);
  const { data: metrics } = useLeadMetricsQuery();

  const canCreate = hasPermission(role, "leads:create");
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  function handleView(id: string) {
    router.push(`/dashboard/leads/${id}`);
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
            Add Lead
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard
          label="Total Leads"
          value={metrics ? String(metrics.total) : "—"}
          trend="Live count"
          iconBg="#e0e7ff"
          icon={<Users size={18} className="text-[#6366f1]" />}
        />
        <StatCard
          label="Hot Leads"
          value={metrics ? String(metrics.hot) : "—"}
          valueColor="#dc2626"
          trend="Temperature: Hot"
          iconBg="#fee2e2"
          icon={<Flame size={18} className="text-[#ef4444]" />}
        />
        <StatCard
          label="Conversion Rate"
          value={metrics ? `${metrics.conversionRate}%` : "—"}
          trend="Converted ÷ Total"
          iconBg="#d1fae5"
          icon={<Percent size={18} className="text-[#10b981]" />}
        />
        <StatCard
          label="Average Score"
          value={metrics ? String(metrics.averageScore) : "—"}
          trend="Across active leads"
          iconBg="#e0f2fe"
          icon={<Target size={18} className="text-[#0284c7]" />}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Leads</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[220px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search leads..."
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
                onChange={(e) => { setSortBy(e.target.value as LeadListFilters["sortBy"]); setPage(1); }}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="budget_desc">Highest Budget</option>
                <option value="budget_asc">Lowest Budget</option>
                <option value="updated">Recently Updated</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            {hasPermission(role, "leads:export") && (
              <button
                type="button"
                className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
                style={mont}
              >
                Export CSV
                <Download size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                {["Lead #", "Name", "Contact", "Source", "Location", "Budget", "Score", "Temp", "Status", "Agent"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[13px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                ))}
                <th className="px-4 py-3 w-[48px]" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>Loading leads…</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[14px] text-[#dc2626]" style={mont}>Failed to load leads.</td>
                </tr>
              )}
              {!isLoading && !isError && leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#e5e7eb] last:border-b-0 hover:bg-[#f9fafb] cursor-pointer transition-colors"
                  onClick={() => handleView(lead.id)}
                >
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{lead.leadNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{lead.submittedName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] text-[#0d2138] whitespace-nowrap" style={mont}>{lead.submittedEmail ?? lead.contact.email ?? "—"}</span>
                      <span className="text-[11px] text-[#6a7282] whitespace-nowrap" style={mont}>{lead.submittedPhone ?? lead.contact.phone ?? ""}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>
                      {lead.submittedLocation ?? lead.contact.location ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{formatBudget(lead)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={lead.score} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <TempBadge temperature={lead.temperature} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <LifecycleBadge status={lead.lifecycleStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>
                      {lead.assignedAgent?.fullName ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <RowActions lead={lead} role={role} onView={handleView} />
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && leads.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {leads.length} of {total} leads
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="size-7 flex items-center justify-center rounded-[6px] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#f3f4f6] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[12px] text-[#6a7282]" style={mont}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-7 flex items-center justify-center rounded-[6px] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#f3f4f6] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onCreated={() => setShowModal(false)} />}
      {showFilter && (
        <LeadFilterModal
          resultCount={total}
          onApply={() => setShowFilter(false)}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
