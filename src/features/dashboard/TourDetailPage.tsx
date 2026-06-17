"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, User, Building2, Phone, Mail,
  CheckCircle2, XCircle, RefreshCw, Loader2, ExternalLink,
  UserCog, MessageSquare, AlertTriangle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { TourStatus } from "@/generated/prisma/enums";
import { useTourDetailQuery } from "@/hooks/queries/useDashboardToursQuery";
import { useUpdateTourStatusMutation, useAssignTourAgentMutation, useUpdateTourMutation } from "@/hooks/mutations/useTourMutations";
import type { TourDto } from "@/features/crm/types/crm-dto";
import { TOUR_STATUS_BADGE } from "./ToursPage";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const ACTIVITY_LABELS: Record<string, string> = {
  TOUR_CREATED:    "Tour created",
  TOUR_CONFIRMED:  "Tour confirmed",
  TOUR_RESCHEDULED:"Tour rescheduled",
  TOUR_COMPLETED:  "Tour completed",
  TOUR_CANCELLED:  "Tour cancelled",
  TOUR_NO_SHOW:    "No-show recorded",
  TOUR_ASSIGNED:   "Agent assigned",
  TOUR_REASSIGNED: "Agent reassigned",
  TOUR_UPDATED:    "Tour updated",
};

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TourStatus }) {
  const b = TOUR_STATUS_BADGE[status];
  return (
    <span
      className="text-[12px] font-semibold px-3 py-1 rounded-full"
      style={{ background: b.bg, color: b.text, fontFamily: mont.fontFamily }}
    >
      {b.label}
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]" style={mont}>{label}</span>
      <span className="text-[13px] text-[#0d2138]" style={mont}>{value || "—"}</span>
    </div>
  );
}

// ── Status transition panel ───────────────────────────────────────────────────

const TRANSITION_LABELS: Partial<Record<TourStatus, { label: string; color: string; icon: React.ReactNode }>> = {
  [TourStatus.CONFIRMED]:   { label: "Confirm Tour",      color: "#059669", icon: <CheckCircle2 size={14} /> },
  [TourStatus.RESCHEDULED]: { label: "Reschedule",        color: "#d97706", icon: <RefreshCw size={14} />   },
  [TourStatus.COMPLETED]:   { label: "Mark Completed",    color: "#16a34a", icon: <CheckCircle2 size={14} /> },
  [TourStatus.CANCELLED]:   { label: "Cancel Tour",       color: "#dc2626", icon: <XCircle size={14} />     },
  [TourStatus.NO_SHOW]:     { label: "Mark No-show",      color: "#6b7280", icon: <AlertTriangle size={14} /> },
};

const VALID_NEXT: Partial<Record<TourStatus, TourStatus[]>> = {
  [TourStatus.REQUESTED]:   [TourStatus.CONFIRMED, TourStatus.RESCHEDULED, TourStatus.CANCELLED],
  [TourStatus.CONFIRMED]:   [TourStatus.RESCHEDULED, TourStatus.COMPLETED, TourStatus.CANCELLED, TourStatus.NO_SHOW],
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
    <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-4">
      <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Change Status</p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((s) => {
          const def = TRANSITION_LABELS[s];
          if (!def) return null;
          return (
            <button
              key={s}
              onClick={() => setSelected(selected === s ? null : s)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] border transition-colors"
              style={{
                borderColor: selected === s ? def.color : "#e5e7eb",
                color: selected === s ? def.color : "#374151",
                background: selected === s ? `${def.color}15` : "transparent",
                fontFamily: mont.fontFamily,
              }}
            >
              {def.icon}{def.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-3">
          {selected === TourStatus.RESCHEDULED && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#6b7280] uppercase" style={mont}>New Date & Time</label>
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
              selected === TourStatus.CONFIRMED ? "Confirmation note (optional)…" :
              selected === TourStatus.RESCHEDULED ? "Reason for rescheduling (optional)…" :
              selected === TourStatus.CANCELLED ? "Cancellation reason (optional)…" :
              selected === TourStatus.COMPLETED ? "Completion notes (optional)…" : "Note (optional)…"
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#0d2138] resize-none"
            style={mont}
          />
          <button
            onClick={handleApply}
            disabled={statusMutation.isPending || (selected === TourStatus.RESCHEDULED && !newDate)}
            className="self-start flex items-center gap-2 bg-[#0d2138] text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] hover:bg-[#1a3a5c] disabled:opacity-40 transition-colors"
            style={mont}
          >
            {statusMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Apply
          </button>
          {statusMutation.isError && (
            <p className="text-[12px] text-red-500" style={mont}>{(statusMutation.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reschedule inline form ────────────────────────────────────────────────────

function RescheduleDateForm({ tour, role }: { tour: TourDto; role: Role }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const updateMutation = useUpdateTourMutation(tour.id);
  const canUpdate = hasPermission(role, "tours:update");

  const isTerminal = tour.status === TourStatus.COMPLETED || tour.status === TourStatus.CANCELLED || tour.status === TourStatus.NO_SHOW;

  if (!canUpdate || isTerminal) return null;

  const handleSave = async () => {
    if (!value) return;
    await updateMutation.mutateAsync({ scheduledAt: new Date(value).toISOString() });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-[11px] text-[#4f46e5] hover:underline" style={mont}>
        Edit date/time
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-[#e5e7eb] rounded-[6px] px-2 py-1 text-[12px] outline-none focus:border-[#0d2138]"
        style={mont}
      />
      <button
        onClick={handleSave}
        disabled={!value || updateMutation.isPending}
        className="text-[12px] font-semibold text-white bg-[#0d2138] px-3 py-1 rounded-[6px] disabled:opacity-40"
        style={mont}
      >
        Save
      </button>
      <button onClick={() => setEditing(false)} className="text-[12px] text-[#6b7280]" style={mont}>Cancel</button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TourDetailPage({ tourId, role }: { tourId: string; role: Role }) {
  const router = useRouter();
  const { data: tour, isLoading, isError } = useTourDetailQuery(tourId);
  const assignMutation = useAssignTourAgentMutation(tourId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[#0d2138]" />
      </div>
    );
  }
  if (isError || !tour) {
    return (
      <div className="p-6 text-center">
        <p className="text-[14px] text-[#dc2626]" style={mont}>Tour not found or you don&apos;t have access.</p>
        <button onClick={() => router.push("/dashboard/tours")} className="mt-3 text-[13px] text-[#0d2138] underline" style={mont}>
          Back to Tours
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1100px] mx-auto">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/dashboard/tours")} className="mt-0.5 p-1.5 rounded-[8px] border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
          <ArrowLeft size={16} color="#0d2138" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[20px] font-bold text-[#0d2138]" style={mont}>{tour.tourNumber}</h1>
            <StatusBadge status={tour.status} />
            <span className="text-[11px] text-[#9ca3af] px-2 py-0.5 bg-[#f3f4f6] rounded-full" style={mont}>
              {tour.source === "PUBLIC_REQUEST" ? "Public request" : "Dashboard"}
            </span>
          </div>
          <p className="text-[12px] text-[#9ca3af] mt-1" style={mont}>
            Created {formatDistanceToNow(new Date(tour.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Scheduled time */}
          <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Appointment</p>
            <div className="flex items-center gap-3">
              <Calendar size={16} color="#4f46e5" />
              <div>
                <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>
                  {format(new Date(tour.scheduledAt), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-[13px] text-[#6a7282]" style={mont}>
                  {format(new Date(tour.scheduledAt), "h:mm a")} · {tour.durationMinutes} min
                </p>
                {tour.rescheduledFrom && (
                  <p className="text-[11px] text-[#9ca3af] mt-0.5" style={mont}>
                    Originally: {format(new Date(tour.rescheduledFrom), "MMM d, yyyy h:mm a")}
                  </p>
                )}
              </div>
            </div>
            <RescheduleDateForm tour={tour} role={role} />

            {tour.confirmationNote && (
              <div className="bg-[#d1fae5] rounded-[8px] px-3 py-2">
                <p className="text-[11px] font-semibold text-[#059669] uppercase" style={mont}>Confirmation note</p>
                <p className="text-[12px] text-[#065f46]" style={mont}>{tour.confirmationNote}</p>
              </div>
            )}
            {tour.rescheduleNote && (
              <div className="bg-[#fef3c7] rounded-[8px] px-3 py-2">
                <p className="text-[11px] font-semibold text-[#d97706] uppercase" style={mont}>Reschedule note</p>
                <p className="text-[12px] text-[#92400e]" style={mont}>{tour.rescheduleNote}</p>
              </div>
            )}
            {tour.cancellationReason && (
              <div className="bg-[#fee2e2] rounded-[8px] px-3 py-2">
                <p className="text-[11px] font-semibold text-[#dc2626] uppercase" style={mont}>Cancellation reason</p>
                <p className="text-[12px] text-[#7f1d1d]" style={mont}>{tour.cancellationReason}</p>
              </div>
            )}
            {tour.completionNote && (
              <div className="bg-[#dcfce7] rounded-[8px] px-3 py-2">
                <p className="text-[11px] font-semibold text-[#16a34a] uppercase" style={mont}>Completion notes</p>
                <p className="text-[12px] text-[#14532d]" style={mont}>{tour.completionNote}</p>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Name" value={tour.contact.fullName} />
              <InfoRow label="Contact ID" value={tour.contact.contactId} />
              <InfoRow label="Email" value={tour.contact.email} />
              <InfoRow label="Phone" value={tour.contact.phone} />
            </div>
            {tour.submittedMessage && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]" style={mont}>Message</span>
                <p className="text-[13px] text-[#0d2138] bg-[#f9fafb] rounded-[8px] px-3 py-2" style={mont}>{tour.submittedMessage}</p>
              </div>
            )}
          </div>

          {/* Property */}
          <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Property</p>
            {tour.property ? (
              <div className="flex items-start gap-3">
                <Building2 size={16} color="#6b7280" className="mt-0.5 shrink-0" />
                <div>
                  <a
                    href={`/listings/${tour.property.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="text-[13px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1"
                    style={mont}
                  >
                    {tour.property.title}
                    <ExternalLink size={11} />
                  </a>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>{tour.property.location} · {tour.property.listingId}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#9ca3af]" style={mont}>No property linked</p>
            )}
            {tour.leadId && (
              <div>
                <a
                  href={`/dashboard/leads/${tour.leadId}`}
                  className="text-[12px] text-[#4f46e5] hover:underline flex items-center gap-1"
                  style={mont}
                >
                  View linked lead <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* Status actions */}
          <StatusActionPanel tour={tour} role={role} />
        </div>

        {/* Right: sidebar */}
        <div className="flex flex-col gap-5">
          {/* Assigned agent */}
          <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Assigned Agent</p>
            {tour.assignedAgent ? (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#4f46e5] font-bold text-[13px]" style={mont}>
                  {(tour.assignedAgent.fullName ?? tour.assignedAgent.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>
                    {tour.assignedAgent.fullName ?? tour.assignedAgent.email}
                  </p>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>{tour.assignedAgent.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#9ca3af]" style={mont}>Unassigned</p>
            )}
            {hasPermission(role, "tours:assign") && (
              <p className="text-[11px] text-[#9ca3af]" style={mont}>Agent assignment managed via dashboard actions</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="bg-white border border-[#f3f4f6] rounded-[12px] p-5 flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Timeline</p>
            <div className="flex flex-col gap-2">
              <InfoRow label="Created" value={format(new Date(tour.createdAt), "MMM d, yyyy h:mm a")} />
              <InfoRow label="Last updated" value={format(new Date(tour.updatedAt), "MMM d, yyyy h:mm a")} />
              {tour.completedAt && <InfoRow label="Completed" value={format(new Date(tour.completedAt), "MMM d, yyyy h:mm a")} />}
              {tour.cancelledAt && <InfoRow label="Cancelled" value={format(new Date(tour.cancelledAt), "MMM d, yyyy h:mm a")} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
