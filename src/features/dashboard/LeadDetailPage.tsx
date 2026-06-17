"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Flame, Target, User, Building2, Phone, Mail,
  MapPin, Calendar, DollarSign, Activity, MessageSquare,
  RefreshCw, Archive, ArchiveRestore, ExternalLink, Loader2,
  Plus, Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { LeadTemperature, LeadLifecycleStatus, LeadSource } from "@/generated/prisma/enums";
import { useLeadDetailQuery, useLeadNotesQuery, useLeadActivitiesQuery } from "@/hooks/queries/useDashboardLeadsQuery";
import {
  useUpdateLeadMutation,
  useArchiveLeadMutation,
  useRestoreLeadMutation,
  useConvertLeadMutation,
  useAddLeadNoteMutation,
} from "@/hooks/mutations/useLeadMutations";
import type { LeadDto, LeadActivityDto } from "@/features/crm/types/crm-dto";
import { scoreColor } from "./LeadsPage";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Constants ─────────────────────────────────────────────────────────────────

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

const ACTIVITY_LABELS: Record<string, string> = {
  LEAD_CREATED: "Lead created",
  LEAD_UPDATED: "Lead updated",
  LEAD_CONTACT_LINKED: "Contact linked",
  LEAD_LISTING_LINKED: "Listing linked",
  LEAD_ASSIGNED: "Agent assigned",
  LEAD_REASSIGNED: "Agent reassigned",
  LEAD_SCORE_CHANGED: "Score updated",
  LEAD_TEMPERATURE_CHANGED: "Temperature changed",
  LEAD_STATUS_CHANGED: "Status changed",
  LEAD_FOLLOW_UP_CHANGED: "Follow-up date set",
  LEAD_NOTE_ADDED: "Note added",
  LEAD_NOTE_UPDATED: "Note updated",
  LEAD_INQUIRY_RECEIVED: "Inquiry received",
  LEAD_TOUR_LINKED: "Tour linked",
  LEAD_CONVERTED: "Converted to Opportunity",
  LEAD_ARCHIVED: "Lead archived",
  LEAD_RESTORED: "Lead restored",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f3f4f6]">
        <h3 className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#f9fafb] last:border-b-0">
      <span className="text-[12px] font-medium text-[#6a7282] w-[130px] shrink-0 pt-0.5" style={mont}>{label}</span>
      <span className="text-[13px] text-[#0d2138] flex-1" style={mont}>{value || "—"}</span>
    </div>
  );
}

function formatBudget(lead: LeadDto): string {
  if (!lead.budgetMin && !lead.budgetMax) return "—";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${lead.currency} ${(n / 1_000_000).toFixed(1)}M` : `${lead.currency} ${(n / 1000).toFixed(0)}K`;
  if (lead.budgetMin && lead.budgetMax) return `${fmt(lead.budgetMin)} – ${fmt(lead.budgetMax)}`;
  if (lead.budgetMax) return `up to ${fmt(lead.budgetMax)}`;
  return `from ${fmt(lead.budgetMin!)}`;
}

// ── Activity feed ─────────────────────────────────────────────────────────────

function ActivityFeed({ leadId }: { leadId: string }) {
  const { data: activities, isLoading } = useLeadActivitiesQuery(leadId);

  if (isLoading) {
    return <p className="text-[13px] text-[#6a7282] py-2" style={mont}>Loading activity…</p>;
  }

  if (!activities || activities.length === 0) {
    return <p className="text-[13px] text-[#6a7282] py-2" style={mont}>No activity recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((a: LeadActivityDto) => (
        <div key={a.id} className="flex items-start gap-3">
          <div className="size-7 rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0 mt-0.5">
            <Activity size={13} className="text-[#4f46e5]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#0d2138]" style={mont}>
              {ACTIVITY_LABELS[a.type] ?? a.type}
              {a.actorName && <span className="text-[#6a7282]"> by {a.actorName}</span>}
            </p>
            <p className="text-[11px] text-[#99a1af]" style={mont}>
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notes section ─────────────────────────────────────────────────────────────

function NotesSection({ leadId, role, isArchived }: { leadId: string; role: Role; isArchived: boolean }) {
  const { data: notes, isLoading } = useLeadNotesQuery(leadId);
  const addNote = useAddLeadNoteMutation(leadId);
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const canAdd = hasPermission(role, "leads:add_note") && !isArchived;

  async function handleAdd() {
    if (!content.trim()) return;
    await addNote.mutateAsync({ content: content.trim() });
    setContent("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading && <p className="text-[13px] text-[#6a7282]" style={mont}>Loading notes…</p>}
      {notes?.map((n) => (
        <div key={n.id} className="p-3 bg-[#f9fafb] rounded-[10px]">
          <p className="text-[13px] text-[#0d2138] whitespace-pre-wrap" style={mont}>{n.content}</p>
          <p className="text-[11px] text-[#99a1af] mt-1.5" style={mont}>
            {n.authorName ?? "Unknown"} · {format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      ))}
      {!notes?.length && !isLoading && (
        <p className="text-[13px] text-[#6a7282]" style={mont}>No notes yet.</p>
      )}
      {canAdd && (
        showForm ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              maxLength={5000}
              className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] resize-none"
              style={mont}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 h-8 border border-[#e5e7eb] rounded-[8px] text-[12px] text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                style={mont}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={addNote.isPending || !content.trim()}
                className="px-4 h-8 bg-[#1e4f86] rounded-[8px] text-[12px] text-white hover:bg-[#1b487a] disabled:opacity-60 transition-colors flex items-center gap-1.5"
                style={mont}
              >
                {addNote.isPending && <Loader2 size={12} className="animate-spin" />}
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-8 px-3 border border-dashed border-[#d1d5db] rounded-[8px] text-[12px] text-[#6a7282] hover:border-[#1e4f86] hover:text-[#1e4f86] transition-colors w-fit"
            style={mont}
          >
            <Plus size={13} />
            Add Note
          </button>
        )
      )}
    </div>
  );
}

// ── Convert modal ─────────────────────────────────────────────────────────────

function ConvertModal({ leadId, leadName, onClose }: { leadId: string; leadName: string; onClose: () => void }) {
  const [title, setTitle] = useState(`Opportunity from ${leadName}`);
  const [notes, setNotes] = useState("");
  const convert = useConvertLeadMutation(leadId);
  const [error, setError] = useState("");

  async function handleConvert() {
    setError("");
    try {
      await convert.mutateAsync({ title, notes: notes || undefined });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to convert");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-[16px] w-full max-w-[480px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Convert to Opportunity</p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Opportunity Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86]"
              style={mont}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="px-3 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86] resize-none"
              style={mont}
            />
          </div>
          {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#6b7280] hover:bg-[#f3f4f6]" style={mont}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              disabled={convert.isPending || !title.trim()}
              className="flex-1 h-10 bg-[#1e4f86] rounded-[10px] text-[12px] text-white hover:bg-[#1b487a] disabled:opacity-60 flex items-center justify-center gap-1.5"
              style={mont}
            >
              {convert.isPending && <Loader2 size={13} className="animate-spin" />}
              Convert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type LeadDetailPageProps = {
  leadId: string;
  role: Role;
};

export function LeadDetailPage({ leadId, role }: LeadDetailPageProps) {
  const router = useRouter();
  const { data: lead, isLoading, isError } = useLeadDetailQuery(leadId);
  const update = useUpdateLeadMutation(leadId);
  const archive = useArchiveLeadMutation();
  const restore = useRestoreLeadMutation();
  const [showConvert, setShowConvert] = useState(false);

  if (isLoading) {
    return (
      <div className="px-6 py-10 flex items-center justify-center gap-2 text-[#6a7282]" style={mont}>
        <Loader2 size={18} className="animate-spin" /> Loading lead…
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-[14px] text-[#dc2626]" style={mont}>Lead not found or access denied.</p>
        <button type="button" onClick={() => router.back()} className="mt-3 text-[13px] text-[#1e4f86] hover:underline" style={mont}>
          Go back
        </button>
      </div>
    );
  }

  const temp = TEMP_BADGE[lead.temperature];
  const lifecycle = LIFECYCLE_BADGE[lead.lifecycleStatus];
  const canUpdate = hasPermission(role, "leads:update") && !lead.isArchived;
  const canArchive = hasPermission(role, "leads:archive");
  const canConvert = hasPermission(role, "leads:convert") && !lead.isArchived && !lead.convertedOpportunityId;

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/leads")}
        className="flex items-center gap-1.5 text-[13px] text-[#6a7282] hover:text-[#0d2138] transition-colors w-fit"
        style={mont}
      >
        <ArrowLeft size={15} />
        All Leads
      </button>

      {/* Header */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>{lead.leadNumber}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium" style={{ backgroundColor: temp.bg, color: temp.text, ...mont }}>
                <Flame size={11} className="mr-1" />{temp.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium" style={{ backgroundColor: lifecycle.bg, color: lifecycle.text, ...mont }}>
                {lifecycle.label}
              </span>
              {lead.isArchived && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium bg-[#f3f4f6] text-[#6b7280]" style={mont}>
                  Archived
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-semibold text-[#0d2138]" style={poppins}>{lead.submittedName}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {(lead.submittedEmail ?? lead.contact.email) && (
                <span className="flex items-center gap-1.5 text-[13px] text-[#6a7282]" style={mont}>
                  <Mail size={13} />{lead.submittedEmail ?? lead.contact.email}
                </span>
              )}
              {(lead.submittedPhone ?? lead.contact.phone) && (
                <span className="flex items-center gap-1.5 text-[13px] text-[#6a7282]" style={mont}>
                  <Phone size={13} />{lead.submittedPhone ?? lead.contact.phone}
                </span>
              )}
              {(lead.submittedLocation ?? lead.contact.location) && (
                <span className="flex items-center gap-1.5 text-[13px] text-[#6a7282]" style={mont}>
                  <MapPin size={13} />{lead.submittedLocation ?? lead.contact.location}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1">
            <div className="size-14 rounded-full border-4 flex items-center justify-center" style={{ borderColor: scoreColor(lead.score) }}>
              <span className="text-[16px] font-bold" style={{ color: scoreColor(lead.score), ...poppins }}>{lead.score}</span>
            </div>
            <span className="text-[11px] text-[#6a7282]" style={mont}>Score</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#f3f4f6]">
          {canConvert && (
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="flex items-center gap-2 h-9 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              <RefreshCw size={14} />
              Convert to Opportunity
            </button>
          )}
          {lead.convertedOpportunityId && (
            <div className="flex items-center gap-2 h-9 px-4 bg-[#d1fae5] text-[#065f46] rounded-[10px] text-[13px] font-medium" style={mont}>
              <ExternalLink size={14} />
              Converted
            </div>
          )}
          {canArchive && !lead.isArchived && (
            <button
              type="button"
              onClick={() => archive.mutate(lead.id)}
              disabled={archive.isPending}
              className="flex items-center gap-2 h-9 px-4 border border-[#e5e7eb] text-[#6a7282] rounded-[10px] text-[13px] font-medium hover:bg-[#f3f4f6] disabled:opacity-50 transition-colors"
              style={mont}
            >
              <Archive size={14} />
              Archive
            </button>
          )}
          {canArchive && lead.isArchived && (
            <button
              type="button"
              onClick={() => restore.mutate(lead.id)}
              disabled={restore.isPending}
              className="flex items-center gap-2 h-9 px-4 border border-[#e5e7eb] text-[#059669] rounded-[10px] text-[13px] font-medium hover:bg-[#f0fdf4] disabled:opacity-50 transition-colors"
              style={mont}
            >
              <ArchiveRestore size={14} />
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Overview */}
          <Section title="Overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Lead Source" value={SOURCE_LABELS[lead.source] ?? lead.source} />
                {lead.sourceDetail && <InfoRow label="Source Detail" value={lead.sourceDetail} />}
                <InfoRow label="Budget" value={formatBudget(lead)} />
                <InfoRow
                  label="Follow-up"
                  value={lead.nextFollowUpAt ? (
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {format(new Date(lead.nextFollowUpAt), "MMM d, yyyy")}
                    </span>
                  ) : null}
                />
                <InfoRow
                  label="Last Contacted"
                  value={lead.lastContactedAt ? format(new Date(lead.lastContactedAt), "MMM d, yyyy") : null}
                />
              </div>
              <div>
                <InfoRow label="Temperature" value={
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium" style={{ backgroundColor: temp.bg, color: temp.text, ...mont }}>
                    {temp.label}
                  </span>
                } />
                <InfoRow label="Status" value={
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium" style={{ backgroundColor: lifecycle.bg, color: lifecycle.text, ...mont }}>
                    {lifecycle.label}
                  </span>
                } />
                <InfoRow label="Assigned Agent" value={lead.assignedAgent?.fullName ?? "—"} />
                <InfoRow label="Created" value={format(new Date(lead.createdAt), "MMM d, yyyy")} />
                <InfoRow label="Updated" value={formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })} />
              </div>
            </div>
            {lead.notes && (
              <div className="mt-3 p-3 bg-[#f9fafb] rounded-[10px]">
                <p className="text-[11px] font-medium text-[#6a7282] mb-1" style={mont}>Initial Notes</p>
                <p className="text-[13px] text-[#0d2138] whitespace-pre-wrap" style={mont}>{lead.notes}</p>
              </div>
            )}
          </Section>

          {/* Property */}
          {lead.primaryListing ? (
            <Section title="Interested Property">
              <div className="flex gap-4 items-start">
                {lead.primaryListing.coverUrl && (
                  <img
                    src={lead.primaryListing.coverUrl}
                    alt={lead.primaryListing.title}
                    className="w-28 h-20 object-cover rounded-[8px] shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1e4f86]" style={mont}>{lead.primaryListing.listingId}</p>
                  <p className="text-[14px] font-semibold text-[#0d2138] mt-0.5" style={mont}>{lead.primaryListing.title}</p>
                  <p className="text-[12px] text-[#6a7282] mt-0.5 flex items-center gap-1" style={mont}>
                    <MapPin size={11} />{lead.primaryListing.location}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[12px] px-2 py-0.5 bg-[#f3f4f6] rounded-[6px] text-[#6a7282]" style={mont}>
                      {lead.primaryListing.type}
                    </span>
                    <span className="text-[12px] px-2 py-0.5 bg-[#f3f4f6] rounded-[6px] text-[#6a7282]" style={mont}>
                      {lead.primaryListing.status}
                    </span>
                    {lead.primaryListing.salePrice && (
                      <span className="text-[12px] font-medium text-[#0d2138] flex items-center gap-1" style={mont}>
                        <DollarSign size={11} />
                        {lead.primaryListing.salePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <a
                    href={`/dashboard/listings/${lead.primaryListing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-[12px] text-[#1e4f86] hover:underline w-fit"
                    style={mont}
                  >
                    <ExternalLink size={12} />
                    Open Listing
                  </a>
                </div>
              </div>
            </Section>
          ) : (
            <Section title="Interested Property">
              <p className="text-[13px] text-[#6a7282]" style={mont}>No property linked to this lead.</p>
            </Section>
          )}

          {/* Notes */}
          <Section title="Notes">
            <NotesSection leadId={leadId} role={role} isArchived={lead.isArchived} />
          </Section>

          {/* Activity */}
          {hasPermission(role, "leads:view_activity") && (
            <Section title="Activity History">
              <ActivityFeed leadId={leadId} />
            </Section>
          )}
        </div>

        {/* Right (1/3) */}
        <div className="flex flex-col gap-5">
          {/* Contact */}
          <Section title="Contact">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0">
                  <User size={16} className="text-[#4f46e5]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{lead.contact.fullName}</p>
                  <p className="text-[12px] text-[#6a7282]" style={mont}>{lead.contact.contactId}</p>
                </div>
              </div>
              {lead.contact.email && (
                <div className="flex items-center gap-2 text-[12px] text-[#6a7282]" style={mont}>
                  <Mail size={12} /> {lead.contact.email}
                </div>
              )}
              {lead.contact.phone && (
                <div className="flex items-center gap-2 text-[12px] text-[#6a7282]" style={mont}>
                  <Phone size={12} /> {lead.contact.phone}
                </div>
              )}
              {lead.contact.location && (
                <div className="flex items-center gap-2 text-[12px] text-[#6a7282]" style={mont}>
                  <MapPin size={12} /> {lead.contact.location}
                </div>
              )}
              <a
                href={`/dashboard/contacts/${lead.contactId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-[#1e4f86] hover:underline w-fit mt-1"
                style={mont}
              >
                <ExternalLink size={12} />
                Open Contact
              </a>
            </div>
          </Section>

          {/* Assigned Agent */}
          <Section title="Assigned Agent">
            {lead.assignedAgent ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {lead.assignedAgent.avatarUrl ? (
                    <img src={lead.assignedAgent.avatarUrl} alt={lead.assignedAgent.fullName ?? ""} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="size-10 rounded-full bg-[#e0f2fe] flex items-center justify-center shrink-0">
                      <User size={16} className="text-[#0284c7]" />
                    </div>
                  )}
                  <div>
                    <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{lead.assignedAgent.fullName ?? "—"}</p>
                    <p className="text-[12px] text-[#6a7282]" style={mont}>{lead.assignedAgent.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-[#6a7282]" style={mont}>No agent assigned.</p>
              </div>
            )}
          </Section>

          {/* Quick facts */}
          <Section title="Quick Facts">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6a7282]" style={mont}>Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${lead.score}%`, backgroundColor: scoreColor(lead.score) }} />
                  </div>
                  <span className="text-[12px] font-medium text-[#0d2138]" style={mont}>{lead.score}/100</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6a7282]" style={mont}>Budget</span>
                <span className="text-[12px] font-medium text-[#0d2138]" style={mont}>{formatBudget(lead)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6a7282]" style={mont}>Source</span>
                <span className="text-[12px] font-medium text-[#0d2138]" style={mont}>{SOURCE_LABELS[lead.source] ?? lead.source}</span>
              </div>
            </div>
          </Section>

          {/* Opportunity */}
          <Section title="Opportunity">
            {lead.convertedOpportunityId ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#059669]">
                  <Building2 size={14} />
                  <span className="text-[13px] font-medium" style={mont}>Converted</span>
                </div>
                <p className="text-[12px] text-[#6a7282]" style={mont}>
                  Converted {lead.convertedAt ? format(new Date(lead.convertedAt), "MMM d, yyyy") : ""}
                </p>
                <a
                  href={`/dashboard/opportunities/${lead.convertedOpportunityId}`}
                  className="flex items-center gap-1.5 text-[12px] text-[#1e4f86] hover:underline w-fit"
                  style={mont}
                >
                  <ExternalLink size={12} />
                  Open Opportunity
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-[#6a7282]" style={mont}>Not yet converted.</p>
                {canConvert && (
                  <button
                    type="button"
                    onClick={() => setShowConvert(true)}
                    className="flex items-center gap-1.5 text-[12px] text-[#1e4f86] hover:underline w-fit"
                    style={mont}
                  >
                    <RefreshCw size={12} />
                    Convert to Opportunity
                  </button>
                )}
              </div>
            )}
          </Section>

          {/* Update score / temperature quick panel */}
          {canUpdate && (
            <Section title="Update Lead">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Score (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={lead.score}
                    onBlur={(e) => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value)));
                      if (val !== lead.score) update.mutate({ score: val });
                    }}
                    className="h-9 px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86]"
                    style={mont}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Status</label>
                  <select
                    defaultValue={lead.lifecycleStatus}
                    onChange={(e) => update.mutate({ lifecycleStatus: e.target.value as LeadLifecycleStatus })}
                    className="h-9 px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-white outline-none focus:border-[#1e4f86] cursor-pointer"
                    style={mont}
                  >
                    {Object.entries(LIFECYCLE_BADGE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Temperature</label>
                  <select
                    defaultValue={lead.temperature}
                    onChange={(e) => update.mutate({ temperature: e.target.value as LeadTemperature })}
                    className="h-9 px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-white outline-none focus:border-[#1e4f86] cursor-pointer"
                    style={mont}
                  >
                    {Object.entries(TEMP_BADGE).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937] flex items-center gap-1.5" style={mont}>
                    <Calendar size={12} /> Follow-up Date
                  </label>
                  <input
                    type="date"
                    defaultValue={lead.nextFollowUpAt ? format(new Date(lead.nextFollowUpAt), "yyyy-MM-dd") : ""}
                    onBlur={(e) => {
                      const val = e.target.value;
                      update.mutate({ nextFollowUpAt: val ? new Date(val).toISOString() : null });
                    }}
                    className="h-9 px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-white outline-none focus:border-[#1e4f86]"
                    style={mont}
                  />
                </div>
                {update.isPending && (
                  <p className="text-[11px] text-[#6a7282] flex items-center gap-1" style={mont}>
                    <Loader2 size={11} className="animate-spin" /> Saving…
                  </p>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {showConvert && (
        <ConvertModal
          leadId={leadId}
          leadName={lead.submittedName}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}
