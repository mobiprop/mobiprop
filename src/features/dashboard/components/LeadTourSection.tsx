"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { TourStatus } from "@/generated/prisma/enums";
import { useDashboardToursQuery } from "@/hooks/queries/useDashboardToursQuery";
import {
  useUpdateTourMutation,
  useUpdateTourStatusMutation,
} from "@/hooks/mutations/useTourMutations";
import { TOUR_STATUS_BADGE } from "@/features/crm/tour-status-badge";
import type { LeadDto, TourDto } from "@/features/crm/types/crm-dto";
import { AddTourModal } from "./AddTourModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };

function StatusBadge({ status }: { status: TourStatus }) {
  const b = TOUR_STATUS_BADGE[status];
  return (
    <span
      className="text-[12px] font-semibold px-3 py-1 rounded-full"
      style={{ background: b.bg, color: b.text, ...mont }}
    >
      {b.label}
    </span>
  );
}

function NoteBox({
  label,
  value,
  bg,
  labelColor,
  textColor,
}: {
  label: string;
  value: string;
  bg: string;
  labelColor: string;
  textColor: string;
}) {
  return (
    <div className="rounded-[8px] px-3 py-2" style={{ background: bg }}>
      <p
        className="text-[11px] font-semibold uppercase"
        style={{ color: labelColor, ...mont }}
      >
        {label}
      </p>
      <p className="text-[12px]" style={{ color: textColor, ...mont }}>
        {value}
      </p>
    </div>
  );
}

// ── Status transition panel (ported from the former TourDetailPage) ───────────

const TRANSITION_LABELS: Partial<
  Record<TourStatus, { label: string; color: string; icon: React.ReactNode }>
> = {
  [TourStatus.CONFIRMED]: { label: "Confirm Tour", color: "#059669", icon: <CheckCircle2 size={14} /> },
  [TourStatus.RESCHEDULED]: { label: "Reschedule", color: "#d97706", icon: <RefreshCw size={14} /> },
  [TourStatus.COMPLETED]: { label: "Mark Completed", color: "#16a34a", icon: <CheckCircle2 size={14} /> },
  [TourStatus.CANCELLED]: { label: "Cancel Tour", color: "#dc2626", icon: <XCircle size={14} /> },
  [TourStatus.NO_SHOW]: { label: "Mark No-show", color: "#6b7280", icon: <AlertTriangle size={14} /> },
};

const VALID_NEXT: Partial<Record<TourStatus, TourStatus[]>> = {
  [TourStatus.REQUESTED]: [TourStatus.CONFIRMED, TourStatus.RESCHEDULED, TourStatus.CANCELLED],
  [TourStatus.CONFIRMED]: [TourStatus.RESCHEDULED, TourStatus.COMPLETED, TourStatus.CANCELLED, TourStatus.NO_SHOW],
  [TourStatus.RESCHEDULED]: [TourStatus.CONFIRMED, TourStatus.COMPLETED, TourStatus.CANCELLED, TourStatus.NO_SHOW],
};

function StatusActionPanel({ tour, role }: { tour: TourDto; role: Role }) {
  const [selected, setSelected] = useState<TourStatus | null>(null);
  const [note, setNote] = useState("");
  const [newDate, setNewDate] = useState("");
  const statusMutation = useUpdateTourStatusMutation(tour.id);
  const canUpdate = hasPermission(role, "tours:update");

  const nextStatuses = VALID_NEXT[tour.status] ?? [];
  if (!canUpdate || nextStatuses.length === 0) return null;

  const handleApply = async () => {
    if (!selected) return;
    await statusMutation.mutateAsync({
      status: selected,
      confirmationNote: selected === TourStatus.CONFIRMED ? note || undefined : undefined,
      rescheduleNote: selected === TourStatus.RESCHEDULED ? note || undefined : undefined,
      cancellationReason: selected === TourStatus.CANCELLED ? note || undefined : undefined,
      completionNote: selected === TourStatus.COMPLETED ? note || undefined : undefined,
      scheduledAt: selected === TourStatus.RESCHEDULED && newDate ? new Date(newDate).toISOString() : undefined,
    });
    setSelected(null);
    setNote("");
    setNewDate("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-[#f9fafb] p-4">
      <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
        Change Status
      </p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((s) => {
          const def = TRANSITION_LABELS[s];
          if (!def) return null;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelected(selected === s ? null : s)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border transition-colors"
              style={{
                borderColor: selected === s ? def.color : "#e5e7eb",
                color: selected === s ? def.color : "#374151",
                background: selected === s ? `${def.color}15` : "transparent",
                ...mont,
              }}
            >
              {def.icon}
              {def.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-3">
          {selected === TourStatus.RESCHEDULED && (
            <div className="flex flex-col gap-1">
              <label
                className="text-[11px] font-semibold text-[#6b7280] uppercase"
                style={mont}
              >
                New Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-[13px] text-[#0d2138] outline-none focus:border-[#0d2138]"
                style={mont}
              />
            </div>
          )}
          <textarea
            placeholder={
              selected === TourStatus.CONFIRMED
                ? "Confirmation note (optional)…"
                : selected === TourStatus.RESCHEDULED
                  ? "Reason for rescheduling (optional)…"
                  : selected === TourStatus.CANCELLED
                    ? "Cancellation reason (optional)…"
                    : selected === TourStatus.COMPLETED
                      ? "Completion notes (optional)…"
                      : "Note (optional)…"
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#0d2138] resize-none"
            style={mont}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={statusMutation.isPending || (selected === TourStatus.RESCHEDULED && !newDate)}
            className="self-start flex items-center gap-2 bg-[#0d2138] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#1a3a5c] disabled:opacity-40 transition-colors"
            style={mont}
          >
            {statusMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Apply
          </button>
          {statusMutation.isError && (
            <p className="text-[12px] text-red-500" style={mont}>
              {(statusMutation.error as Error).message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline reschedule (date/time only, no status change) ──────────────────────

function RescheduleDateForm({ tour, role }: { tour: TourDto; role: Role }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const updateMutation = useUpdateTourMutation(tour.id);
  const canUpdate = hasPermission(role, "tours:update");

  const isTerminal =
    tour.status === TourStatus.COMPLETED ||
    tour.status === TourStatus.CANCELLED ||
    tour.status === TourStatus.NO_SHOW;

  if (!canUpdate || isTerminal) return null;

  const handleSave = async () => {
    if (!value) return;
    await updateMutation.mutateAsync({ scheduledAt: new Date(value).toISOString() });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="self-start text-[11px] text-[#4f46e5] hover:underline"
        style={mont}
      >
        Edit date/time
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-[#e5e7eb] rounded-[6px] px-2 py-1 text-[12px] outline-none focus:border-[#0d2138]"
        style={mont}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!value || updateMutation.isPending}
        className="text-[12px] font-semibold text-white bg-[#0d2138] px-3 py-1 rounded-[6px] disabled:opacity-40"
        style={mont}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-[12px] text-[#6b7280]"
        style={mont}
      >
        Cancel
      </button>
    </div>
  );
}

// ── Main section, embedded in Lead Detail ──────────────────────────────────────

type LeadForTour = Pick<
  LeadDto,
  "id" | "submittedName" | "submittedEmail" | "submittedPhone" | "primaryListing" | "assignedAgentId"
>;

export function LeadTourSection({ lead, role }: { lead: LeadForTour; role: Role }) {
  const { data, isLoading } = useDashboardToursQuery({
    leadId: lead.id,
    limit: 5,
    sortBy: "scheduled_desc",
  });
  const [showAdd, setShowAdd] = useState(false);

  const canView = hasPermission(role, "tours:view");
  const canCreate = hasPermission(role, "tours:create");

  if (!canView) return null;

  if (isLoading) {
    return (
      <p className="flex items-center gap-1.5 text-[14px] text-[#6a7282]" style={mont}>
        <Loader2 size={13} className="animate-spin" />
        Loading tour…
      </p>
    );
  }

  const tour = data?.tours?.[0] ?? null;

  if (!tour) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-[#6a7282]" style={mont}>
          No tour scheduled for this lead yet.
        </p>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex h-9 w-fit items-center gap-2 rounded-[8px] border border-dashed border-[#d1d5db] px-3 text-[14px] text-[#6a7282] transition-colors hover:border-[#1e4f86] hover:text-[#1e4f86]"
            style={mont}
          >
            <Plus size={13} />
            Schedule a Tour
          </button>
        )}
        {showAdd && (
          <AddTourModal
            role={role}
            leadId={lead.id}
            initialValues={{
              name: lead.submittedName,
              email: lead.submittedEmail ?? undefined,
              phone: lead.submittedPhone ?? undefined,
              propertyId: lead.primaryListing?.id,
              propertyTitle: lead.primaryListing?.title,
              propertyListingId: lead.primaryListing?.listingId,
              propertyLocation: lead.primaryListing?.location,
              agentId: lead.assignedAgentId ?? undefined,
            }}
            onClose={() => setShowAdd(false)}
            onCreated={() => setShowAdd(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Calendar size={16} className="text-[#4f46e5]" />
        <div>
          <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
            {format(new Date(tour.scheduledAt), "EEEE, MMMM d, yyyy")}
          </p>
          <p className="text-[13px] text-[#6a7282]" style={mont}>
            {format(new Date(tour.scheduledAt), "h:mm a")} · {tour.durationMinutes} min
          </p>
        </div>
        <StatusBadge status={tour.status} />
      </div>

      <RescheduleDateForm tour={tour} role={role} />

      {tour.confirmationNote && (
        <NoteBox label="Confirmation note" value={tour.confirmationNote} bg="#d1fae5" labelColor="#059669" textColor="#065f46" />
      )}
      {tour.rescheduleNote && (
        <NoteBox label="Reschedule note" value={tour.rescheduleNote} bg="#fef3c7" labelColor="#d97706" textColor="#92400e" />
      )}
      {tour.cancellationReason && (
        <NoteBox label="Cancellation reason" value={tour.cancellationReason} bg="#fee2e2" labelColor="#dc2626" textColor="#7f1d1d" />
      )}
      {tour.completionNote && (
        <NoteBox label="Completion notes" value={tour.completionNote} bg="#dcfce7" labelColor="#16a34a" textColor="#14532d" />
      )}

      <StatusActionPanel tour={tour} role={role} />
    </div>
  );
}
