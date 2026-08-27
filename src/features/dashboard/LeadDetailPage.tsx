"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Target,
  User,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import {
  LeadLifecycleStatus,
  LeadSource,
  LeadTemperature,
} from "@/generated/prisma/enums";
import {
  useLeadActivitiesQuery,
  useLeadDetailQuery,
  useLeadNotesQuery,
} from "@/hooks/queries/useDashboardLeadsQuery";
import {
  useAddLeadNoteMutation,
  useArchiveLeadMutation,
  useConvertLeadMutation,
  useRestoreLeadMutation,
  useUpdateLeadMutation,
} from "@/hooks/mutations/useLeadMutations";
import { useCreateOpportunityMutation } from "@/hooks/mutations/useCrmMutations";
import type {
  LeadActivityDto,
  LeadDto,
  OpportunityDto,
} from "@/features/crm/types/crm-dto";
import { scoreColor } from "./LeadsPage";
import { LeadTourSection } from "./components/LeadTourSection";
import { SearchableSelect } from "./components/SearchableSelect";
import { AddOpportunityModal, type OpportunityFormValues, type OpportunityPrefill } from "./components/AddOpportunityModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const TEMP_BADGE: Record<
  LeadTemperature,
  { bg: string; text: string; label: string }
> = {
  COLD: { bg: "#e0f2fe", text: "#0284c7", label: "Cold" },
  WARM: { bg: "#fef3c7", text: "#d97706", label: "Warm" },
  HOT: { bg: "#fee2e2", text: "#dc2626", label: "Hot" },
};

const LIFECYCLE_BADGE: Record<
  LeadLifecycleStatus,
  { bg: string; text: string; label: string }
> = {
  NEW: { bg: "#e0e7ff", text: "#4f46e5", label: "New" },
  CONTACTED: {
    bg: "#d1fae5",
    text: "#059669",
    label: "Contacted",
  },
  FOLLOW_UP: {
    bg: "#fef3c7",
    text: "#d97706",
    label: "Follow Up",
  },
  QUALIFIED: {
    bg: "#dcfce7",
    text: "#16a34a",
    label: "Qualified",
  },
  UNQUALIFIED: {
    bg: "#f3f4f6",
    text: "#6b7280",
    label: "Unqualified",
  },
  CONVERTED: {
    bg: "#d1fae5",
    text: "#065f46",
    label: "Converted",
  },
  CLOSED: { bg: "#fee2e2", text: "#dc2626", label: "Closed" },
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
  ZONAPROP: "Zonaprop",
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
  LEAD_SOURCE_CHANGED: "Source changed",
  LEAD_FOLLOW_UP_CHANGED: "Follow-up date set",
  LEAD_NOTE_ADDED: "Note added",
  LEAD_NOTE_UPDATED: "Note updated",
  LEAD_INQUIRY_RECEIVED: "Inquiry received",
  LEAD_TOUR_LINKED: "Tour linked",
  LEAD_CONVERTED: "Converted to Opportunity",
  LEAD_ARCHIVED: "Lead archived",
  LEAD_RESTORED: "Lead restored",
};

type ContactSummary = {
  id?: string;
  contactId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
};

type AgentSummary = {
  id?: string;
  fullName?: string | null;
  email?: string | null;
};

type LeadDetailView = Omit<LeadDto, "contact" | "assignedAgent"> & {
  contact?: ContactSummary | null;
  assignedAgent?: AgentSummary | null;
  sourceDetail?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  convertedOpportunity?: {
    id?: string;
    title?: string | null;
  } | null;
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[#f3f4f6] bg-white">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-4 py-4 sm:px-5">
        {icon}
        <h3
          className="text-[14px] font-semibold text-[#0d2138]"
          style={mont}
        >
          {title}
        </h3>
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#f3f4f6] py-3 last:border-b-0 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3">
      <span
        className="text-[14px] font-medium text-[#6a7282]"
        style={mont}
      >
        {label}
      </span>
      <span
        className="min-w-0 break-words text-[14px] text-[#0d2138]"
        style={mont}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function Badge({
  label,
  background,
  color,
}: {
  label: string;
  background: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[7px] px-3 text-[14px] font-medium"
      style={{ backgroundColor: background, color, ...mont }}
    >
      {label}
    </span>
  );
}

function formatBudget(
  lead: Pick<LeadDto, "budgetMin" | "budgetMax" | "currency">,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!lead.budgetMin && !lead.budgetMax) return "—";

  const formatAmount = (value: number) => {
    if (value >= 1_000_000) {
      return `${lead.currency} ${(value / 1_000_000).toFixed(1)}M`;
    }

    return `${lead.currency} ${(value / 1_000).toFixed(0)}K`;
  };

  if (lead.budgetMin && lead.budgetMax) {
    return `${formatAmount(lead.budgetMin)} – ${formatAmount(
      lead.budgetMax,
    )}`;
  }

  if (lead.budgetMax) return t("detail.budgetUpTo", { amount: formatAmount(lead.budgetMax) });
  return t("detail.budgetFrom", { amount: formatAmount(lead.budgetMin!) });
}

function formatDateValue(
  value: string | Date | null | undefined,
  pattern = "MMM d, yyyy",
): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return format(date, pattern);
}

function ActivityFeed({ leadId }: { leadId: string }) {
  const { t } = useTranslation("leads");
  const { data: activities, isLoading } =
    useLeadActivitiesQuery(leadId);

  if (isLoading) {
    return (
      <p className="py-2 text-[14px] text-[#6a7282]" style={mont}>
        {t("detail.activityFeed.loading")}
      </p>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="py-2 text-[14px] text-[#6a7282]" style={mont}>
        {t("detail.activityFeed.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity: LeadActivityDto) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e0e7ff]">
            <Activity size={14} className="text-[#4f46e5]" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="break-words text-[14px] text-[#0d2138]"
              style={mont}
            >
              {t(`activity.${activity.type}`, { defaultValue: ACTIVITY_LABELS[activity.type] ?? activity.type })}
              {activity.actorName && (
                <span className="text-[#6a7282]">
                  {t("detail.activityFeed.by", { name: activity.actorName })}
                </span>
              )}
            </p>

            <p className="mt-0.5 text-[11px] text-[#99a1af]" style={mont}>
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesSection({
  leadId,
  role,
  isArchived,
}: {
  leadId: string;
  role: Role;
  isArchived: boolean;
}) {
  const { t } = useTranslation("leads");
  const { data: notes, isLoading } = useLeadNotesQuery(leadId);
  const addNote = useAddLeadNoteMutation(leadId);
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canAdd =
    hasPermission(role, "leads:add_note") && !isArchived;

  async function handleAdd() {
    if (!content.trim()) return;

    await addNote.mutateAsync({ content: content.trim() });
    setContent("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <p className="text-[14px] text-[#6a7282]" style={mont}>
          {t("detail.notesSection.loading")}
        </p>
      )}

      {notes?.map((note) => (
        <div key={note.id} className="rounded-[10px] bg-[#f9fafb] p-3">
          <p
            className="whitespace-pre-wrap break-words text-[14px] text-[#0d2138]"
            style={mont}
          >
            {note.content}
          </p>
          <p className="mt-1.5 text-[11px] text-[#99a1af]" style={mont}>
            {note.authorName ?? t("detail.notesSection.unknownAuthor")} ·{" "}
            {format(
              new Date(note.createdAt),
              "MMM d, yyyy 'at' h:mm a",
            )}
          </p>
        </div>
      ))}

      {!notes?.length && !isLoading && (
        <p className="text-[14px] text-[#6a7282]" style={mont}>
          {t("detail.notesSection.empty")}
        </p>
      )}

      {canAdd &&
        (showForm ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("detail.notesSection.placeholder")}
              rows={3}
              maxLength={5000}
              className="w-full resize-none rounded-[10px] border border-[#e5e7eb] px-3 py-2.5 text-[14px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86]"
              style={mont}
            />

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => {
                  setContent("");
                  setShowForm(false);
                }}
                className="h-9 rounded-[8px] border border-[#e5e7eb] px-4 text-[14px] text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
                style={mont}
              >
                {t("detail.notesSection.cancel")}
              </button>

              <button
                type="button"
                onClick={handleAdd}
                disabled={addNote.isPending || !content.trim()}
                className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#1e4f86] px-4 text-[14px] text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60"
                style={mont}
              >
                {addNote.isPending && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                {t("detail.notesSection.saveNote")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-9 w-fit items-center gap-2 rounded-[8px] border border-dashed border-[#d1d5db] px-3 text-[14px] text-[#6a7282] transition-colors hover:border-[#1e4f86] hover:text-[#1e4f86]"
            style={mont}
          >
            <Plus size={13} />
            {t("detail.notesSection.addNote")}
          </button>
        ))}
    </div>
  );
}

// Lead → Opportunity conversion. The Opportunity is built with the same full
// creation form used on the Opportunities page — a lead's prospect isn't a
// Contact yet, so the form's "Add Contact" panel is pre-opened with the
// lead's submitted info, and staff confirm/create it as a real Contact there.
// Only once that Opportunity exists does the Lead get linked + marked converted.
function ConvertToOpportunityModal({
  lead,
  role,
  lockedAgent,
  onClose,
}: {
  lead: LeadDetailView;
  role: Role;
  lockedAgent: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("leads");
  const createOpportunity = useCreateOpportunityMutation();
  const linkConversion = useConvertLeadMutation(lead.id);

  const prefill: OpportunityPrefill = useMemo(() => {
    const contact = lead.contact;
    const nameParts = lead.submittedName.trim().split(/\s+/);
    return {
      title: t("detail.convertModal.defaultTitle", { name: lead.submittedName }),
      assignedAgentId: lead.assignedAgentId ?? undefined,
      notes: lead.notes ?? undefined,
      propertyId: lead.primaryListing?.id,
      propertyLabel: lead.primaryListing?.title ?? undefined,
      existingContact: contact?.id
        ? {
            id: contact.id,
            label: contact.fullName ?? [contact.firstName, contact.lastName].filter(Boolean).join(" "),
            email: contact.email ?? undefined,
          }
        : undefined,
      newContact: contact?.id
        ? undefined
        : {
            firstName: nameParts[0] ?? lead.submittedName,
            lastName: nameParts.slice(1).join(" "),
            email: lead.submittedEmail ?? undefined,
            phone: lead.submittedPhone ?? undefined,
          },
    };
  }, [lead, t]);

  async function handleSubmit(values: OpportunityFormValues): Promise<OpportunityDto | null> {
    const payload = {
      title: values.title || "Untitled Opportunity",
      participants: values.participants.map((row) =>
        row.role === "AGENCY"
          ? { role: row.role, companyName: row.companyName.trim() }
          : { role: row.role, contactId: row.contactId },
      ),
      propertyIds: values.propertyIds,
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

    let opportunity: OpportunityDto;
    try {
      const result = await createOpportunity.mutateAsync(payload);
      opportunity = result.opportunity;
    } catch {
      toast.error(t("detail.convertModal.convertError"));
      return null;
    }

    try {
      await linkConversion.mutateAsync({ opportunityId: opportunity.id });
    } catch {
      // The Opportunity already exists at this point — surface the link
      // failure separately instead of losing it or duplicating the Opportunity
      // on retry.
      toast.error(t("detail.convertModal.linkFailed"));
    }

    return opportunity;
  }

  return (
    <AddOpportunityModal
      mode="create"
      prefill={prefill}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSaving={createOpportunity.isPending || linkConversion.isPending}
      lockedAgent={lockedAgent}
      role={role}
    />
  );
}

type LeadDetailPageProps = {
  leadId: string;
  role: Role;
  currentUserId: string;
  currentUserName: string;
};

export function LeadDetailPage({
  leadId,
  role,
  currentUserId,
  currentUserName,
}: LeadDetailPageProps) {
  const { t } = useTranslation("leads");
  const router = useRouter();
  const { data: leadData, isLoading, isError } =
    useLeadDetailQuery(leadId);
  const update = useUpdateLeadMutation(leadId);
  const archive = useArchiveLeadMutation();
  const restore = useRestoreLeadMutation();
  const [showConvert, setShowConvert] = useState(false);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-2 px-4 py-12 text-[#6a7282] sm:px-6"
        style={mont}
      >
        <Loader2 size={18} className="animate-spin" />
        {t("detail.loading")}
      </div>
    );
  }

  if (isError || !leadData) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <p className="text-[14px] text-[#dc2626]" style={mont}>
          {t("detail.notFound")}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 text-[14px] text-[#1e4f86] hover:underline"
          style={mont}
        >
          {t("detail.goBack")}
        </button>
      </div>
    );
  }

  const lead = leadData as LeadDetailView;
  const temperature = TEMP_BADGE[lead.temperature];
  const lifecycle = LIFECYCLE_BADGE[lead.lifecycleStatus];
  const temperatureLabel = t(`temperature.${lead.temperature}`, { defaultValue: temperature.label });
  const lifecycleLabel = t(`lifecycleStatus.${lead.lifecycleStatus}`, { defaultValue: lifecycle.label });
  const score = Math.max(0, Math.min(100, lead.score ?? 0));
  const listing = lead.primaryListing;
  const contactName =
    lead.contact?.fullName ??
    [lead.contact?.firstName, lead.contact?.lastName]
      .filter(Boolean)
      .join(" ");

  const canUpdate =
    hasPermission(role, "leads:update") && !lead.isArchived;
  const canArchive = hasPermission(role, "leads:archive");
  const canConvert =
    hasPermission(role, "leads:convert") &&
    hasPermission(role, "opportunities:create") &&
    !lead.isArchived &&
    !lead.convertedOpportunityId;
  // Roles without agents:view (AGENT) can't pick another agent — matches
  // AddOpportunityModal's own lockedAgent convention on the Opportunities page.
  const lockedAgent = hasPermission(role, "agents:view")
    ? null
    : { id: currentUserId, name: currentUserName };

  function updateTemperature(value: LeadTemperature) {
    update.mutate(
      { temperature: value } as Parameters<typeof update.mutate>[0],
    );
  }

  function updateLifecycle(value: LeadLifecycleStatus) {
    update.mutate(
      { lifecycleStatus: value } as Parameters<typeof update.mutate>[0],
    );
  }

  function updateSource(value: LeadSource) {
    update.mutate(
      { source: value } as Parameters<typeof update.mutate>[0],
    );
  }

  function handleArchiveToggle() {
    if (lead.isArchived) {
      restore.mutate(lead.id);
      return;
    }

    archive.mutate(lead.id);
  }

  const archivePending = archive.isPending || restore.isPending;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex w-fit items-center gap-2 text-[14px] font-medium text-[#6a7282] transition-colors hover:text-[#1e4f86]"
        style={mont}
      >
        <ArrowLeft size={16} />
        {t("detail.backToLeads")}
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#f3f4f6] bg-white p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#e0e7ff] sm:size-12">
            <User size={21} className="text-[#4f46e5]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="min-w-0 break-words text-[20px] font-semibold leading-7 text-[#0d2138] sm:text-[22px]"
                style={poppins}
              >
                {lead.submittedName || contactName || t("detail.unnamedLead")}
              </h1>

              {lead.isArchived && (
                <span
                  className="rounded-[6px] bg-[#f3f4f6] px-2 py-1 text-[11px] font-medium text-[#6b7280]"
                  style={mont}
                >
                  {t("detail.archived")}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="text-[14px] font-medium text-[#1e4f86]"
                style={mont}
              >
                {lead.leadNumber}
              </span>
              <span className="text-[14px] text-[#6a7282]" style={mont}>
                {t(`source.${lead.source}`, { defaultValue: SOURCE_LABELS[lead.source] ?? lead.source })}
              </span>
              <span className="text-[14px] text-[#6a7282]" style={mont}>
                {t("detail.createdOn", { date: formatDateValue(lead.createdAt) })}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                label={lifecycleLabel}
                background={lifecycle.bg}
                color={lifecycle.text}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
          {canConvert && (
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a]"
              style={mont}
            >
              <ExternalLink size={15} />
              {t("detail.convert")}
            </button>
          )}

          {canArchive && (
            <button
              type="button"
              onClick={handleArchiveToggle}
              disabled={archivePending}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[14px] font-medium text-[#6a7282] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60"
              style={mont}
            >
              {archivePending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : lead.isArchived ? (
                <ArchiveRestore size={15} />
              ) : (
                <Archive size={15} />
              )}
              {lead.isArchived ? t("detail.restore") : t("detail.archive")}
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[14px] border border-[#f3f4f6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] text-[#6a7282]" style={mont}>
                {t("detail.summary.leadScore")}
              </p>
              <p
                className="mt-2 text-[22px] font-semibold text-[#0d2138]"
                style={mont}
              >
                {score}/100
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#e0f2fe]">
              <Target size={18} className="text-[#0284c7]" />
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${score}%`,
                backgroundColor: scoreColor(score),
              }}
            />
          </div>
        </div>

        <div className="rounded-[14px] border border-[#f3f4f6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] text-[#6a7282]" style={mont}>
                {t("detail.summary.budget")}
              </p>
              <p
                className="mt-2 truncate text-[16px] font-semibold text-[#0d2138]"
                style={mont}
              >
                {formatBudget(lead, t)}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#d1fae5]">
              <DollarSign size={18} className="text-[#059669]" />
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#f3f4f6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] text-[#6a7282]" style={mont}>
                {t("detail.summary.temperature")}
              </p>
              <p
                className="mt-2 text-[16px] font-semibold"
                style={{ color: temperature.text, ...mont }}
              >
                {temperatureLabel}
              </p>
            </div>
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: temperature.bg }}
            >
              <Flame size={18} style={{ color: temperature.text }} />
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-[#f3f4f6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] text-[#6a7282]" style={mont}>
                {t("detail.summary.followUp")}
              </p>
              <p
                className="mt-2 truncate text-[16px] font-semibold text-[#0d2138]"
                style={mont}
              >
                {formatDateValue(lead.nextFollowUpAt)}
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fef3c7]">
              <Calendar size={18} className="text-[#d97706]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Section
            title={t("detail.sections.contactInformation")}
            icon={<User size={16} className="text-[#1e4f86]" />}
          >
            <InfoRow
              label={t("detail.fields.fullName")}
              value={lead.submittedName || contactName}
            />
            <InfoRow
              label={t("detail.fields.email")}
              value={
                lead.submittedEmail ?? lead.contact?.email ?? "—"
              }
            />
            <InfoRow
              label={t("detail.fields.phone")}
              value={
                lead.submittedPhone ?? lead.contact?.phone ?? "—"
              }
            />
            <InfoRow
              label={t("detail.fields.location")}
              value={
                lead.submittedLocation ??
                lead.contact?.location ??
                "—"
              }
            />
            <InfoRow
              label={t("detail.fields.linkedContact")}
              value={
                lead.contact?.contactId ??
                lead.contact?.id ??
                t("detail.fields.notLinked")
              }
            />
          </Section>

          <Section
            title={t("detail.sections.leadDetails")}
            icon={<Building2 size={16} className="text-[#1e4f86]" />}
          >
            <InfoRow
              label={t("detail.fields.source")}
              value={
                canUpdate ? (
                  <SearchableSelect
                    size="sm"
                    searchable={false}
                    value={lead.source}
                    disabled={update.isPending}
                    onChange={(next) => updateSource(next as LeadSource)}
                    options={Object.values(LeadSource).map((value) => ({
                      value,
                      label: t(`source.${value}`, { defaultValue: SOURCE_LABELS[value] ?? value }),
                    }))}
                    placeholder={t("detail.fields.source")}
                    ariaLabel={t("detail.fields.source")}
                  />
                ) : (
                  t(`source.${lead.source}`, { defaultValue: SOURCE_LABELS[lead.source] ?? lead.source })
                )
              }
            />
            <InfoRow label={t("detail.fields.sourceDetail")} value={lead.sourceDetail} />
            <InfoRow label={t("detail.fields.budget")} value={formatBudget(lead, t)} />
            <InfoRow
              label={t("detail.fields.assignedAgent")}
              value={
                lead.assignedAgent?.fullName ??
                lead.assignedAgent?.email ??
                t("detail.fields.unassigned")
              }
            />
            <InfoRow
              label={t("detail.fields.created")}
              value={formatDateValue(
                lead.createdAt,
                "MMM d, yyyy 'at' h:mm a",
              )}
            />
            <InfoRow
              label={t("detail.fields.lastUpdated")}
              value={formatDateValue(
                lead.updatedAt,
                "MMM d, yyyy 'at' h:mm a",
              )}
            />
          </Section>

          {listing && (
            <Section
              title={t("detail.sections.interestedProperty")}
              icon={<Building2 size={16} className="text-[#1e4f86]" />}
            >
              <div className="flex flex-col gap-3 rounded-[10px] bg-[#f9fafb] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p
                    className="text-[14px] font-semibold text-[#0d2138]"
                    style={mont}
                  >
                    {listing.title ?? t("detail.propertyFallback")}
                  </p>
                  <p
                    className="mt-1 text-[14px] text-[#1e4f86]"
                    style={mont}
                  >
                    {listing.listingId ?? "—"}
                  </p>
                  {listing.location && (
                    <p
                      className="mt-1 flex items-center gap-1 text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      <MapPin size={12} />
                      {listing.location}
                    </p>
                  )}
                </div>

                {listing.id && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/listings/${listing.id}`)
                    }
                    className="flex h-9 items-center justify-center gap-2 rounded-[9px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f3f4f6]"
                    style={mont}
                  >
                    {t("detail.viewListing")}
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </Section>
          )}

          <Section
            title={t("detail.sections.scheduledTour")}
            icon={<Calendar size={16} className="text-[#1e4f86]" />}
          >
            <LeadTourSection lead={lead} role={role} />
          </Section>

          <Section
            title={t("detail.sections.notes")}
            icon={<MessageSquare size={16} className="text-[#1e4f86]" />}
          >
            <NotesSection
              leadId={lead.id}
              role={role}
              isArchived={lead.isArchived}
            />
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Section
            title={t("detail.sections.statusAndAssignment")}
            icon={<Target size={16} className="text-[#1e4f86]" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[14px] font-medium text-[#6a7282]"
                  style={mont}
                >
                  {t("detail.temperatureLabel")}
                </label>
                <SearchableSelect
                  searchable={false}
                  value={lead.temperature}
                  disabled={!canUpdate || update.isPending}
                  onChange={(next) => updateTemperature(next as LeadTemperature)}
                  options={Object.values(LeadTemperature).map((value) => ({
                    value,
                    label: t(`temperature.${value}`, { defaultValue: TEMP_BADGE[value].label }),
                  }))}
                  placeholder={t("detail.selectTemperature")}
                  ariaLabel={t("detail.temperatureLabel")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[14px] font-medium text-[#6a7282]"
                  style={mont}
                >
                  {t("detail.lifecycleStatusLabel")}
                </label>
                <SearchableSelect
                  searchable={false}
                  value={lead.lifecycleStatus}
                  disabled={!canUpdate || update.isPending}
                  onChange={(next) => updateLifecycle(next as LeadLifecycleStatus)}
                  options={Object.values(LeadLifecycleStatus).map((value) => ({
                    value,
                    label: t(`lifecycleStatus.${value}`, { defaultValue: LIFECYCLE_BADGE[value].label }),
                  }))}
                  placeholder={t("detail.selectStatus")}
                  ariaLabel={t("detail.lifecycleStatusLabel")}
                />
              </div>

              {update.isPending && (
                <p
                  className="flex items-center gap-1.5 text-[11px] text-[#6a7282]"
                  style={mont}
                >
                  <Loader2 size={12} className="animate-spin" />
                  {t("detail.savingChanges")}
                </p>
              )}
            </div>
          </Section>

          <Section
            title={t("detail.sections.quickContact")}
            icon={<Phone size={16} className="text-[#1e4f86]" />}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {(lead.submittedEmail ?? lead.contact?.email) && (
                <a
                  href={`mailto:${
                    lead.submittedEmail ?? lead.contact?.email
                  }`}
                  className="flex h-10 items-center gap-2 rounded-[9px] border border-[#e5e7eb] px-3 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f3f4f6]"
                  style={mont}
                >
                  <Mail size={15} />
                  {t("detail.emailLead")}
                </a>
              )}

              {(lead.submittedPhone ?? lead.contact?.phone) && (
                <a
                  href={`tel:${lead.submittedPhone ?? lead.contact?.phone}`}
                  className="flex h-10 items-center gap-2 rounded-[9px] border border-[#e5e7eb] px-3 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f3f4f6]"
                  style={mont}
                >
                  <Phone size={15} />
                  {t("detail.callLead")}
                </a>
              )}
            </div>
          </Section>

          <Section
            title={t("detail.sections.timeline")}
            icon={<Clock size={16} className="text-[#1e4f86]" />}
          >
            <ActivityFeed leadId={lead.id} />
          </Section>
        </aside>
      </div>

      {showConvert && (
        <ConvertToOpportunityModal
          lead={lead}
          role={role}
          lockedAgent={lockedAgent}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}