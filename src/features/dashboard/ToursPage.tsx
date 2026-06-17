"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Calendar, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight, Filter, Users,
} from "lucide-react";

import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { useDashboardToursQuery, useTourMetricsQuery } from "@/hooks/queries/useDashboardToursQuery";
import { TourStatus } from "@/generated/prisma/enums";
import type { TourDto } from "@/features/crm/types/crm-dto";
import type { TourListFilters } from "@/schemas/tour.schema";
import { AddTourModal } from "./components/AddTourModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Status badge ──────────────────────────────────────────────────────────────

export const TOUR_STATUS_BADGE: Record<TourStatus, { bg: string; text: string; label: string }> = {
  REQUESTED:   { bg: "#e0e7ff", text: "#4f46e5", label: "Requested"   },
  CONFIRMED:   { bg: "#d1fae5", text: "#059669", label: "Confirmed"   },
  RESCHEDULED: { bg: "#fef3c7", text: "#d97706", label: "Rescheduled" },
  COMPLETED:   { bg: "#dcfce7", text: "#16a34a", label: "Completed"   },
  CANCELLED:   { bg: "#fee2e2", text: "#dc2626", label: "Cancelled"   },
  NO_SHOW:     { bg: "#f3f4f6", text: "#6b7280", label: "No-show"     },
};

function StatusBadge({ status }: { status: TourStatus }) {
  const b = TOUR_STATUS_BADGE[status];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: b.bg, color: b.text, fontFamily: mont.fontFamily }}
    >
      {b.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, iconBg,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[12px] p-[18px] flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] font-medium text-[#6a7282]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <p className="text-[24px] font-semibold" style={{ color: "#0d2138", ...poppins }}>{value}</p>
    </div>
  );
}

// ── Format scheduled datetime ─────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── Tour row ──────────────────────────────────────────────────────────────────

function TourRow({ tour, onClick }: { tour: TourDto; onClick: () => void }) {
  return (
    <tr
      className="border-t border-[#f3f4f6] hover:bg-[#f9fafb] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <p className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{tour.tourNumber}</p>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>{tour.source === "PUBLIC_REQUEST" ? "Public request" : "Dashboard"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>{tour.contact.fullName}</p>
        {tour.contact.email && (
          <p className="text-[11px] text-[#9ca3af]" style={mont}>{tour.contact.email}</p>
        )}
      </td>
      <td className="px-4 py-3">
        {tour.property ? (
          <>
            <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>{tour.property.title}</p>
            <p className="text-[11px] text-[#9ca3af]" style={mont}>{tour.property.listingId}</p>
          </>
        ) : (
          <span className="text-[12px] text-[#9ca3af]" style={mont}>—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>{fmtDate(tour.scheduledAt)}</p>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>{fmtTime(tour.scheduledAt)}</p>
      </td>
      <td className="px-4 py-3">
        {tour.assignedAgent ? (
          <p className="text-[13px] text-[#0d2138]" style={mont}>{tour.assignedAgent.fullName ?? tour.assignedAgent.email}</p>
        ) : (
          <span className="text-[12px] text-[#9ca3af]" style={mont}>Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={tour.status} />
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ToursPage({ role }: { role: Role }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TourStatus | "">("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const limit = 25;

  const filters: Partial<TourListFilters> = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter && { status: statusFilter }),
    ...(upcomingOnly && { upcoming: true }),
    page,
    limit,
    sortBy: upcomingOnly ? "scheduled_asc" : "newest",
  };

  const { data, isLoading } = useDashboardToursQuery(filters);
  const { data: metrics } = useTourMetricsQuery();

  const canCreate = hasPermission(role, "tours:create");

  // Debounce search
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t);
    (handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  }, []);

  const tours = data?.tours ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#0d2138]" style={mont}>Scheduled Tours</h1>
          <p className="text-[13px] text-[#6a7282] mt-0.5" style={mont}>Manage all property viewing appointments</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#0d2138] text-white text-[13px] font-semibold px-4 py-2 rounded-[10px] hover:bg-[#1a3a5c] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            New Tour
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="flex gap-4 flex-wrap">
        <StatCard
          label="Total Tours"
          value={metrics?.total ?? "—"}
          icon={<Calendar size={18} color="#0d2138" />}
          iconBg="#e0e7ff"
        />
        <StatCard
          label="Upcoming"
          value={metrics?.upcoming ?? "—"}
          icon={<Clock size={18} color="#d97706" />}
          iconBg="#fef3c7"
        />
        <StatCard
          label="Confirmed"
          value={metrics?.confirmed ?? "—"}
          icon={<CheckCircle2 size={18} color="#059669" />}
          iconBg="#d1fae5"
        />
        <StatCard
          label="Completed"
          value={metrics?.completed ?? "—"}
          icon={<Users size={18} color="#16a34a" />}
          iconBg="#dcfce7"
        />
        <StatCard
          label="Cancelled"
          value={metrics?.cancelled ?? "—"}
          icon={<XCircle size={18} color="#dc2626" />}
          iconBg="#fee2e2"
        />
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-[8px] px-3 py-2 flex-1 min-w-[200px] max-w-[320px]">
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search tours…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 outline-none text-[13px] text-[#0d2138] bg-transparent placeholder:text-[#9ca3af]"
            style={mont}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-[8px] px-3 py-2">
          <Filter size={14} color="#9ca3af" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as TourStatus | ""); setPage(1); }}
            className="outline-none text-[13px] text-[#0d2138] bg-transparent cursor-pointer"
            style={mont}
          >
            <option value="">All statuses</option>
            {Object.entries(TOUR_STATUS_BADGE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Upcoming toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#0d2138]" style={mont}>
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => { setUpcomingOnly(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Upcoming only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f9fafb]">
                {["Tour #", "Contact", "Property", "Scheduled", "Agent", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]" style={mont}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#9ca3af]" style={mont}>
                    Loading…
                  </td>
                </tr>
              ) : tours.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={mont}>
                    <Calendar size={32} color="#d1d5db" className="mx-auto mb-2" />
                    <p className="text-[13px] text-[#9ca3af]">No tours found</p>
                  </td>
                </tr>
              ) : (
                tours.map((t) => (
                  <TourRow key={t.id} tour={t} onClick={() => router.push(`/dashboard/tours/${t.id}`)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#f3f4f6] flex items-center justify-between">
            <p className="text-[12px] text-[#9ca3af]" style={mont}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-[6px] border border-[#e5e7eb] disabled:opacity-40 hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[12px] text-[#0d2138] font-medium" style={mont}>{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-[6px] border border-[#e5e7eb] disabled:opacity-40 hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddTourModal
          role={role}
          onClose={() => setShowAddModal(false)}
          onCreated={(id) => { setShowAddModal(false); router.push(`/dashboard/tours/${id}`); }}
        />
      )}
    </div>
  );
}
