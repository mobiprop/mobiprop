"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, UserPlus, Users, Calendar, Trash2, AlertTriangle, Home, FileSignature, Send, Link2Off, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { ContactType, OpportunityStage, OpportunityStatus, EnvelopeStatus, EnvelopeSource } from "@/generated/prisma/enums";
import type { OpportunityDto, OpportunityParticipantRole } from "@/features/crm/types/crm-dto";
import { computeCommissionAmount } from "@/lib/commission";
import { hasPermission, type Role } from "@/lib/permissions";
import { useCreateContactMutation } from "@/hooks/mutations/useCrmMutations";
import { useDocusignEnvelopesQuery, useDocusignTemplatesQuery } from "@/hooks/queries/useDocusignQuery";
import {
  useAttachEnvelopeMutation,
  useDetachEnvelopeMutation,
  useVoidEnvelopeMutation,
  useResendEnvelopeMutation,
  useSendForSignatureMutation,
} from "@/hooks/mutations/useDocusignMutations";
import { uploadDocusignDocument } from "@/lib/client-upload";
import { SearchableSelect } from "./SearchableSelect";
import { ContactPicker } from "./ContactPicker";
import { ListingPicker } from "./ListingPicker";
import { AgentSelect } from "./AgentSelect";
import { DatePickerField } from "./DatePickerField";
import { SendOpportunityContractModal } from "./SendOpportunityContractModal";
import { ContractSourcePicker, type ContractSelection } from "./ContractSourcePicker";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ParticipantFormRow = {
  /** Local-only React key — never sent to the server. */
  key: string;
  role: OpportunityParticipantRole;
  contactId: string;
  contactLabel: string;
  /** BUYER/SELLER: the linked Contact's email. AGENCY: companyEmail below. Used to offer this participant as a contract signer. */
  contactEmail: string;
  /** AGENCY rows only — free text, no Contact record. */
  companyName: string;
  /** AGENCY rows only — lets the agency be picked as a DocuSign signer. */
  companyEmail: string;
};

type ListingFormRow = {
  /** Local-only React key — never sent to the server. */
  key: string;
  propertyId: string;
  propertyLabel: string;
};

export type OpportunityFormValues = {
  title: string;
  participants: ParticipantFormRow[];
  dealType: "Rent" | "Sale";
  dealSize: string;
  contractStart: string;
  contractEnd: string;
  commission: string;
  commissionUnit: "%" | "$";
  paymentTerms: string;
  probability: number;
  stage: OpportunityStage;
  expectedCloseAt: string;
  propertyIds: string[];
  status: OpportunityStatus;
  assignedAgentId: string;
  agentCommissionValue: string;
  agentCommissionUnit: "%" | "$";
  notes: string;
};

type AddOpportunityModalProps = {
  mode?: "create" | "edit";
  initial?: OpportunityDto;
  onClose: () => void;
  /**
   * Saves the opportunity and resolves to the persisted record (or null on
   * failure). The modal needs the saved id to apply staged document
   * uploads/removals AFTER the opportunity exists — so a cancelled form
   * never leaves orphaned files in storage.
   */
  onSubmit: (values: OpportunityFormValues) => Promise<OpportunityDto | null>;
  isSaving?: boolean;
  /** When set (AGENT logged in), the Assigned Agent field is locked to self. */
  lockedAgent?: { id: string; name: string } | null;
  /** Gates Resend/Void actions on linked envelopes (docusign:resend/docusign:void). */
  role: Role;
};

const inputClass =
  "h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

const DEAL_TYPE_OPTIONS = ["Rent", "Sale"].map((v) => ({ value: v, label: v }));
const COMMISSION_UNIT_OPTIONS = [
  { value: "%", label: "%" },
  { value: "$", label: "$" },
];
const STAGE_OPTIONS: { value: OpportunityStage; label: string }[] = [
  { value: OpportunityStage.QUALIFICATION, label: "Qualification" },
  { value: OpportunityStage.VISITATION, label: "Visitation" },
  { value: OpportunityStage.OFFER, label: "Offer" },
  { value: OpportunityStage.NEGOTIATION, label: "Negotiation" },
  { value: OpportunityStage.CLOSING, label: "Closing" },
];
const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: OpportunityStatus.OPEN, label: "Open" },
  { value: OpportunityStatus.CLOSED_WON, label: "Closed Won" },
  { value: OpportunityStatus.CLOSED_LOST, label: "Closed Lost" },
];

const ROLE_LABELS: Record<OpportunityParticipantRole, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  AGENCY: "Real Estate Company",
};
const ROLE_OPTIONS = (["BUYER", "SELLER", "AGENCY"] as const).map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const CONTACT_ROLE_OPTIONS = ROLE_OPTIONS.filter((o) => o.value !== "AGENCY");

let rowKeySeq = 0;
function newRowKey() {
  rowKeySeq += 1;
  return `participant-${rowKeySeq}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

function participantsFromInitial(initial?: OpportunityDto): ParticipantFormRow[] {
  if (!initial) return [];
  return initial.participants.map((p) => ({
    key: newRowKey(),
    role: p.role,
    contactId: p.contactId ?? "",
    contactLabel: p.contactName ?? "",
    contactEmail: p.role === "AGENCY" ? (p.companyEmail ?? "") : (p.contactEmail ?? ""),
    companyName: p.companyName ?? "",
    companyEmail: p.companyEmail ?? "",
  }));
}

let listingRowKeySeq = 0;
function newListingRowKey() {
  listingRowKeySeq += 1;
  return `listing-${listingRowKeySeq}`;
}

function listingRowsFromInitial(initial?: OpportunityDto): ListingFormRow[] {
  if (!initial || initial.listings.length === 0) return [{ key: newListingRowKey(), propertyId: "", propertyLabel: "" }];
  return initial.listings.map((l) => ({ key: newListingRowKey(), propertyId: l.propertyId, propertyLabel: l.propertyTitle }));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Mirrors DocuSignPage's STATUS_BADGE — keep in sync if that palette changes.
const ENVELOPE_STATUS_BADGE: Record<EnvelopeStatus, { bg: string; text: string; dot: string; label: string }> = {
  SENT: { bg: "#fef3e2", text: "#b45309", dot: "#f59e0b", label: "Awaiting Signature" },
  DELIVERED: { bg: "#e6fbf8", text: "#0f766e", dot: "#14b8a6", label: "Viewed" },
  COMPLETED: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e", label: "Completed" },
  DECLINED: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444", label: "Declined" },
  VOIDED: { bg: "#f3f4f6", text: "#6a7282", dot: "#9ca3af", label: "Voided" },
};

function fmtPreview(amount: number | null) {
  if (amount === null) return null;
  return `≈ $${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AddOpportunityModal({ mode = "create", initial, onClose, onSubmit, isSaving, lockedAgent, role }: AddOpportunityModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [participants, setParticipants] = useState<ParticipantFormRow[]>(() => participantsFromInitial(initial));
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [participantPanel, setParticipantPanel] = useState<"none" | "existing" | "new">("none");

  // "Add Existing Contact as Participant" panel
  const [existingRole, setExistingRole] = useState<OpportunityParticipantRole>("BUYER");
  const [existingContactId, setExistingContactId] = useState("");
  const [existingContactLabel, setExistingContactLabel] = useState("");
  const [existingContactEmail, setExistingContactEmail] = useState("");
  const [existingCompanyName, setExistingCompanyName] = useState("");
  const [existingCompanyEmail, setExistingCompanyEmail] = useState("");

  // "Add Contact" panel
  const [ncFirstName, setNcFirstName] = useState("");
  const [ncLastName, setNcLastName] = useState("");
  const [ncEmail, setNcEmail] = useState("");
  const [ncPhone, setNcPhone] = useState("");
  const [ncType, setNcType] = useState<ContactType>(ContactType.BUYER);
  const [ncAddAsParticipant, setNcAddAsParticipant] = useState(true);
  const [ncRole, setNcRole] = useState<OpportunityParticipantRole>("BUYER");

  const createContactMutation = useCreateContactMutation();
  const [dealType, setDealType] = useState<"Rent" | "Sale">(initial?.dealType === "Rent" ? "Rent" : "Sale");
  const [dealSize, setDealSize] = useState(initial?.dealSize != null ? String(initial.dealSize) : "");
  const [contractStart, setContractStart] = useState(initial?.contractStart?.slice(0, 10) ?? "");
  const [contractEnd, setContractEnd] = useState(initial?.contractEnd?.slice(0, 10) ?? "");
  const [commission, setCommission] = useState(initial?.commission != null ? String(initial.commission) : "");
  const [commissionUnit, setCommissionUnit] = useState<"%" | "$">((initial?.commissionUnit as "%" | "$") ?? "%");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? "");
  const [probability, setProbability] = useState(initial?.probability ?? 50);
  const [stage, setStage] = useState<OpportunityStage>(initial?.stage ?? OpportunityStage.QUALIFICATION);
  const [expectedCloseAt, setExpectedCloseAt] = useState(initial?.expectedCloseAt?.slice(0, 10) ?? "");
  const [listingRows, setListingRows] = useState<ListingFormRow[]>(() => listingRowsFromInitial(initial));
  const [status, setStatus] = useState<OpportunityStatus>(initial?.status ?? OpportunityStatus.OPEN);
  const [assignedAgentId, setAssignedAgentId] = useState(initial?.assignedAgentId ?? lockedAgent?.id ?? "");
  const [agentCommissionValue, setAgentCommissionValue] = useState(
    initial?.agentCommissionValue != null ? String(initial.agentCommissionValue) : "",
  );
  const [agentCommissionUnit, setAgentCommissionUnit] = useState<"%" | "$">(
    (initial?.agentCommissionUnit as "%" | "$") ?? "%",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);

  // ── Contracts & Signatures ──────────────────────────────────────────────
  // Create mode: the chosen contract action is staged here and only sent
  // after the Opportunity is created (handleSubmit). Edit mode: envelope
  // attach/detach + the "Add Contract / Send for Signature" modal.
  const [contractSelection, setContractSelection] = useState<ContractSelection | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const { data: envelopesData } = useDocusignEnvelopesQuery();
  const { data: templatesData } = useDocusignTemplatesQuery();
  const attachMutation = useAttachEnvelopeMutation();
  const detachMutation = useDetachEnvelopeMutation();
  const voidMutation = useVoidEnvelopeMutation();
  const resendMutation = useResendEnvelopeMutation();
  const sendMutation = useSendForSignatureMutation();
  const allEnvelopes = envelopesData?.envelopes ?? [];
  const linkedEnvelopes = initial ? allEnvelopes.filter((e) => e.opportunityId === initial.id) : [];
  const availableEnvelopes = initial ? allEnvelopes.filter((e) => !e.opportunityId) : [];
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState("");
  const canVoidEnvelope = hasPermission(role, "docusign:void");
  const canResendEnvelope = hasPermission(role, "docusign:resend");

  async function attachSelectedEnvelope() {
    if (!initial || !selectedEnvelopeId) return;
    try {
      await attachMutation.mutateAsync({ opportunityId: initial.id, envelopeId: selectedEnvelopeId });
      setSelectedEnvelopeId("");
      toast.success("Envelope attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach envelope");
    }
  }

  async function detachEnvelope(envelopeId: string) {
    if (!initial) return;
    try {
      await detachMutation.mutateAsync({ opportunityId: initial.id, envelopeId });
      toast.success("Envelope detached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to detach envelope");
    }
  }

  async function voidLinkedEnvelope(envelopeId: string) {
    const reason = window.prompt("Reason for voiding this envelope?");
    if (!reason) return;
    try {
      await voidMutation.mutateAsync({ id: envelopeId, reason });
      toast.success("Envelope voided");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void envelope");
    }
  }

  async function resendLinkedEnvelope(envelopeId: string) {
    try {
      await resendMutation.mutateAsync(envelopeId);
      toast.success("Reminder sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    }
  }

  // Discard-confirmation: any change to a real form field after mount marks
  // the form dirty, so closing (X / backdrop / Cancel / Escape) asks first
  // instead of silently dropping what the user typed.
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setIsDirty(true);
  }, [
    title, participants, dealType, dealSize, contractStart, contractEnd,
    commission, commissionUnit, paymentTerms, probability, stage, expectedCloseAt,
    listingRows, status, assignedAgentId, agentCommissionValue, agentCommissionUnit, notes,
  ]);

  function requestClose() {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (showDiscardConfirm) return;
      if (participantPanel !== "none") {
        closeParticipantPanel();
        return;
      }
      requestClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDiscardConfirm, participantPanel, isDirty]);

  const isRental = dealType === "Rent";

  const commissionAmount = useMemo(
    () => computeCommissionAmount(Number(dealSize) || null, Number(commission) || null, commissionUnit),
    [dealSize, commission, commissionUnit],
  );
  const commissionPreview = useMemo(() => fmtPreview(commissionAmount), [commissionAmount]);
  const agentCommissionPreview = useMemo(
    () => fmtPreview(computeCommissionAmount(commissionAmount, Number(agentCommissionValue) || null, agentCommissionUnit)),
    [commissionAmount, agentCommissionValue, agentCommissionUnit],
  );

  function removeParticipant(key: string) {
    setParticipants((rows) => rows.filter((r) => r.key !== key));
  }

  function resetExistingPanel() {
    setExistingRole("BUYER");
    setExistingContactId("");
    setExistingContactLabel("");
    setExistingContactEmail("");
    setExistingCompanyName("");
    setExistingCompanyEmail("");
  }
  function resetNewContactPanel() {
    setNcFirstName("");
    setNcLastName("");
    setNcEmail("");
    setNcPhone("");
    setNcType(ContactType.BUYER);
    setNcAddAsParticipant(true);
    setNcRole("BUYER");
  }
  function closeParticipantPanel() {
    setParticipantPanel("none");
  }
  function openExistingPanel() {
    resetExistingPanel();
    setParticipantPanel("existing");
  }
  function openNewContactPanel() {
    resetNewContactPanel();
    setParticipantPanel("new");
  }

  function addExistingParticipant() {
    if (existingRole === "AGENCY") {
      if (!existingCompanyName.trim()) {
        toast.error("Enter a company name.");
        return;
      }
      setParticipants((rows) => [...rows, {
        key: newRowKey(), role: "AGENCY", contactId: "", contactLabel: "",
        contactEmail: existingCompanyEmail.trim(), companyName: existingCompanyName.trim(), companyEmail: existingCompanyEmail.trim(),
      }]);
    } else {
      if (!existingContactId) {
        toast.error("Select a contact.");
        return;
      }
      setParticipants((rows) => [...rows, {
        key: newRowKey(), role: existingRole, contactId: existingContactId, contactLabel: existingContactLabel,
        contactEmail: existingContactEmail, companyName: "", companyEmail: "",
      }]);
    }
    setParticipantsError(null);
    closeParticipantPanel();
  }

  async function createAndAddContact() {
    if (!ncFirstName.trim() || !ncLastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!ncEmail.trim() && !ncPhone.trim()) {
      toast.error("Provide at least an email or a phone number.");
      return;
    }
    try {
      const { contact } = await createContactMutation.mutateAsync({
        firstName: ncFirstName.trim(),
        lastName: ncLastName.trim(),
        email: ncEmail.trim(),
        phone: ncPhone.trim(),
        type: ncType,
      });
      toast.success("Contact created");
      if (ncAddAsParticipant) {
        setParticipants((rows) => [...rows, {
          key: newRowKey(), role: ncRole, contactId: contact.id, contactLabel: contact.fullName,
          contactEmail: ncEmail.trim(), companyName: "", companyEmail: "",
        }]);
        setParticipantsError(null);
      }
      closeParticipantPanel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  // ── Property listings ─────────────────────────────────────────────────────

  function updateListingRow(key: string, propertyId: string, propertyLabel: string) {
    setListingRows((rows) => rows.map((r) => (r.key === key ? { ...r, propertyId, propertyLabel } : r)));
  }
  function addListingRow() {
    setListingRows((rows) => [...rows, { key: newListingRowKey(), propertyId: "", propertyLabel: "" }]);
  }
  function removeListingRow(key: string) {
    setListingRows((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || isSaving) return;

    const hasBuyerOrSeller = participants.some(
      (r) => (r.role === "BUYER" || r.role === "SELLER") && r.contactId,
    );
    if (!hasBuyerOrSeller) {
      setParticipantsError("At least one Buyer or Seller contact is required.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await onSubmit({
        title: title.trim(),
        participants,
        dealType,
        dealSize,
        contractStart,
        contractEnd,
        commission,
        commissionUnit,
        paymentTerms,
        probability,
        stage,
        expectedCloseAt,
        propertyIds: listingRows.map((r) => r.propertyId).filter(Boolean),
        status,
        assignedAgentId,
        agentCommissionValue,
        agentCommissionUnit,
        notes: notes.trim(),
      });

      // onSubmit returns null on failure (it already surfaced the error toast) —
      // keep the modal open so the user doesn't lose their input.
      if (!saved) return;

      // Now that the opportunity exists, send the staged contract (create
      // mode only — edit mode sends via its own modal). Never rolls back the
      // opportunity: a send failure just means the user retries from Edit.
      if (mode === "create" && contractSelection) {
        const propertyReference = listingRows[0]?.propertyLabel || undefined;
        try {
          if (contractSelection.source === "TEMPLATE") {
            await sendMutation.mutateAsync({
              source: "TEMPLATE",
              templateId: contractSelection.templateId,
              templateName: contractSelection.templateName,
              recipientName: contractSelection.recipientName,
              recipientEmail: contractSelection.recipientEmail,
              propertyReference,
              opportunityId: saved.id,
            });
          } else {
            const uploaded = await uploadDocusignDocument(contractSelection.file);
            await sendMutation.mutateAsync({
              source: "CUSTOM_UPLOAD",
              documentStoragePath: uploaded.storagePath,
              documentFileName: uploaded.fileName,
              recipients: contractSelection.recipients,
              propertyReference,
              opportunityId: saved.id,
            });
          }
          toast.success("Opportunity created and contract sent");
        } catch {
          toast.error("Opportunity created, but contract sending failed. You can retry from the Opportunity.");
          onClose();
          return;
        }
      } else {
        toast.success(mode === "edit" ? "Opportunity updated" : "Opportunity created");
      }

      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save opportunity");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={requestClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[92vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
            {mode === "edit" ? "Edit Opportunity" : "New Opportunity"}
          </p>
          <button type="button" onClick={requestClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {showDiscardConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDiscardConfirm(false)}>
            <div
              role="alertdialog"
              aria-modal="true"
              className="flex w-full max-w-[380px] flex-col gap-4 rounded-[16px] bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fef3c7]">
                  <AlertTriangle size={18} className="text-[#b45309]" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Discard changes?</p>
                  <p className="text-[13px] leading-5 text-[#6a7282]" style={mont}>
                    You have unsaved changes to this opportunity. Closing now will lose them.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 h-10 rounded-[10px] border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6]"
                  style={mont}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-[10px] bg-[#fb2c36] text-[13px] font-medium text-white transition-colors hover:bg-[#e0262f]"
                  style={mont}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          {/* Opportunity name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Opportunity Name *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter opportunity name" className={inputClass} style={mont} />
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>Participants *</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>Assign people associated with this opportunity.</p>

            {participants.length > 0 && (
              <div className="flex flex-col gap-2">
                {participants.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[12px] font-semibold text-white" style={mont}>
                        {row.role === "AGENCY" ? "RE" : initials(row.contactLabel)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[12px] font-medium text-[#0d2138]" style={mont}>
                          {row.role === "AGENCY" ? row.companyName || "Untitled company" : row.contactLabel || "Untitled contact"}
                        </span>
                        <span className="truncate text-[11px] text-[#6a7282]" style={mont}>{ROLE_LABELS[row.role]}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParticipant(row.key)}
                      title="Remove participant"
                      className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => (participantPanel === "new" ? closeParticipantPanel() : openNewContactPanel())}
                className="h-9 px-3 rounded-[8px] border border-[#1a5ea8] bg-white flex items-center gap-1.5 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] transition-colors"
                style={mont}
              >
                <Plus size={14} /> Add Contact
              </button>
              <button
                type="button"
                onClick={() => (participantPanel === "existing" ? closeParticipantPanel() : openExistingPanel())}
                className="h-9 px-3 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                style={mont}
              >
                <UserPlus size={14} /> Add Participant
              </button>
            </div>

            {participantsError && <p className="text-[11px] text-[#dc2626]" style={mont}>{participantsError}</p>}

            {/* Add Existing Contact as Participant */}
            {participantPanel === "existing" && (
              <div className="flex flex-col gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-3.5">
                <p className="text-[12px] font-semibold text-[#0d2138]" style={mont}>Add Existing Contact as Participant</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{existingRole === "AGENCY" ? "Company Name *" : "Select Contact *"}</label>
                    {existingRole === "AGENCY" ? (
                      <input
                        value={existingCompanyName}
                        onChange={(e) => setExistingCompanyName(e.target.value)}
                        placeholder="Real estate company name"
                        className={inputClass}
                        style={mont}
                      />
                    ) : (
                      <ContactPicker
                        value={existingContactId}
                        label={existingContactLabel}
                        onSelect={(id, lbl, email) => { setExistingContactId(id); setExistingContactLabel(lbl); setExistingContactEmail(email ?? ""); }}
                        placeholder="Search and select contact…"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Role *</label>
                    <SearchableSelect
                      size="sm"
                      searchable={false}
                      value={existingRole}
                      onChange={(next) => setExistingRole(next as OpportunityParticipantRole)}
                      options={ROLE_OPTIONS}
                      placeholder="Select role"
                    />
                  </div>
                </div>
                {existingRole === "AGENCY" && (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Company Email</label>
                    <input
                      type="email"
                      value={existingCompanyEmail}
                      onChange={(e) => setExistingCompanyEmail(e.target.value)}
                      placeholder="contracts@agency.com"
                      className={inputClass}
                      style={mont}
                    />
                    <p className="text-[11px] text-[#9ca3af]" style={mont}>Optional — lets this company be picked as a contract signer.</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addExistingParticipant}
                    className="h-9 px-4 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <UserPlus size={14} /> Add to Opportunity
                  </button>
                  <button
                    type="button"
                    onClick={closeParticipantPanel}
                    className="h-9 px-4 rounded-[8px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add Contact */}
            {participantPanel === "new" && (
              <div className="flex flex-col gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-3.5">
                <p className="text-[12px] font-semibold text-[#0d2138]" style={mont}>New Contact</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>First Name *</label>
                    <input value={ncFirstName} onChange={(e) => setNcFirstName(e.target.value)} placeholder="e.g. Jane" className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Last Name *</label>
                    <input value={ncLastName} onChange={(e) => setNcLastName(e.target.value)} placeholder="e.g. Smith" className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Email Address</label>
                    <input type="email" value={ncEmail} onChange={(e) => setNcEmail(e.target.value)} placeholder="jane@example.com" className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Phone Number</label>
                    <input type="tel" value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} style={mont} />
                  </div>
                </div>
                {!ncEmail.trim() && !ncPhone.trim() && (
                  <p className="text-[11px] text-[#b45309]" style={mont}>Provide at least an email or a phone number.</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contact Type *</label>
                  <SearchableSelect
                    size="sm"
                    searchable={false}
                    value={ncType}
                    onChange={(next) => setNcType(next as ContactType)}
                    options={[
                      { value: ContactType.BUYER, label: "Buyer" },
                      { value: ContactType.SELLER, label: "Seller" },
                      { value: ContactType.BOTH, label: "Both" },
                    ]}
                    placeholder="Select contact type"
                    ariaLabel="Contact type"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3">
                  <span className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#1f2937]" style={mont}>Add as participant</span>
                    <span className="text-[11px] text-[#6a7282]" style={mont}>Link this new contact directly to this opportunity</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={ncAddAsParticipant}
                    onChange={(e) => setNcAddAsParticipant(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#e5e7eb] transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#1e4f86] peer-checked:after:translate-x-5" />
                </label>

                {ncAddAsParticipant && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Role *</label>
                    <SearchableSelect
                      size="sm"
                      searchable={false}
                      value={ncRole}
                      onChange={(next) => setNcRole(next as OpportunityParticipantRole)}
                      options={CONTACT_ROLE_OPTIONS}
                      placeholder="Select role"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={createAndAddContact}
                    disabled={createContactMutation.isPending}
                    className="h-9 px-4 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    style={mont}
                  >
                    <UserPlus size={14} /> {createContactMutation.isPending ? "Creating…" : "Create & Add to Opportunity"}
                  </button>
                  <button
                    type="button"
                    onClick={closeParticipantPanel}
                    className="h-9 px-4 rounded-[8px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Property Listings */}
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <Home size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>Property Listings</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>Assign the properties linked to this opportunity.</p>

            <div className="flex flex-col gap-2.5">
              {listingRows.map((row, index) => (
                <div key={row.key} className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white" style={mont}>
                    {index + 1}
                  </span>
                  <ListingPicker
                    className="min-w-0 flex-1"
                    tone="neutral"
                    value={row.propertyId}
                    label={row.propertyLabel}
                    onSelect={(id, label) => updateListingRow(row.key, id, label)}
                    excludeIds={listingRows.filter((_, i) => i !== index).map((r) => r.propertyId).filter(Boolean)}
                    placeholder="Select a listing…"
                  />
                  <button
                    type="button"
                    onClick={() => removeListingRow(row.key)}
                    disabled={listingRows.length === 1}
                    title="Remove listing"
                    aria-label="Remove listing"
                    className="flex size-9 shrink-0 items-center justify-center text-[#6a7282] transition-colors hover:text-[#fb2c36] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addListingRow}
              className="flex h-9 w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#1a5ea8] px-4 text-[12px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] sm:w-auto sm:self-start"
              style={mont}
            >
              Add Listing
            </button>
          </div>

          {/* Deal type / size */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Deal Type *</label>
              <SearchableSelect
                size="sm"
                searchable={false}
                value={dealType}
                onChange={(next) => setDealType(next as "Rent" | "Sale")}
                options={DEAL_TYPE_OPTIONS}
                placeholder="Select type"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Deal Size *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input required type="number" value={dealSize} onChange={(e) => setDealSize(e.target.value)} placeholder="0.00" className="h-10 w-full pl-7 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              </div>
            </div>
          </div>

          {/* Rental contract period — only for rentals */}
          {isRental && (
            <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#1e4f86]" />
                <p className="text-[12px] font-medium text-[#1e4f86]" style={mont}>Rental contract period</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contract start date *</label>
                  <DatePickerField required value={contractStart} onChange={setContractStart} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contract end date *</label>
                  <DatePickerField required value={contractEnd} onChange={setContractEnd} />
                </div>
              </div>
            </div>
          )}

          {/* Commission amount / payment terms */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Commission Amount</label>
              <div className="flex items-center gap-2">
                <input value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Input the percentage" className={`flex-1 ${inputClass}`} style={mont} />
                <SearchableSelect
                  className="w-[72px] shrink-0"
                  size="sm"
                  searchable={false}
                  value={commissionUnit}
                  onChange={(next) => setCommissionUnit(next as "%" | "$")}
                  options={COMMISSION_UNIT_OPTIONS}
                  placeholder="%"
                />
              </div>
              {commissionPreview && (
                <p className="text-[11px] text-[#6a7282]" style={mont}>{commissionPreview} of deal size — company revenue</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Payment Terms</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, Installments, Cash" className={inputClass} style={mont} />
            </div>
          </div>

          {/* Probability slider */}
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Probability: {probability}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[#1e4f86]"
              style={{ background: `linear-gradient(to right, #1e4f86 ${probability}%, #e5e7eb ${probability}%)` }}
            />
            <div className="flex items-center justify-between text-[12px] text-[#6a7282]" style={mont}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stage / expected close */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Stage *</label>
              <SearchableSelect
                size="sm"
                searchable={false}
                value={stage}
                onChange={(next) => setStage(next as OpportunityStage)}
                options={STAGE_OPTIONS}
                placeholder="Select stage"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Expected Close Date *</label>
              <DatePickerField required value={expectedCloseAt} onChange={setExpectedCloseAt} />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Status *</label>
            <SearchableSelect
              size="sm"
              searchable={false}
              value={status}
              onChange={(next) => setStatus(next as OpportunityStatus)}
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
          </div>

          {/* Agent / agent commission */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Agent *</label>
              <AgentSelect value={assignedAgentId} onChange={setAssignedAgentId} placeholder="Select agent…" lockedAgent={lockedAgent} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Agent Commission</label>
              <div className="flex items-center gap-2">
                <input value={agentCommissionValue} onChange={(e) => setAgentCommissionValue(e.target.value)} placeholder="Input the percentage" className={`flex-1 ${inputClass}`} style={mont} />
                <SearchableSelect
                  className="w-[72px] shrink-0"
                  size="sm"
                  searchable={false}
                  value={agentCommissionUnit}
                  onChange={(next) => setAgentCommissionUnit(next as "%" | "$")}
                  options={COMMISSION_UNIT_OPTIONS}
                  placeholder="%"
                />
              </div>
              {agentCommissionPreview && (
                <p className="text-[11px] text-[#6a7282]" style={mont}>{agentCommissionPreview} — reflected on the agent&apos;s earnings</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Description</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe this opportunity..." rows={3} className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none" style={mont} />
          </div>

          {/* Contracts & Signatures */}
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <FileSignature size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>Contracts &amp; Signatures</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
              Contracts added here are sent through DocuSign and linked to this Opportunity. They will also appear in the dashboard DocuSign page and in the client&apos;s My Contracts area when the client is a recipient.
            </p>

            {initial ? (
              <div className="flex flex-col gap-3">
                {linkedEnvelopes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {linkedEnvelopes.map((e) => {
                      const badge = ENVELOPE_STATUS_BADGE[e.status];
                      const isPending = e.status === EnvelopeStatus.SENT || e.status === EnvelopeStatus.DELIVERED;
                      return (
                        <div key={e.id} className="flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-[12px] font-medium text-[#0d2138]" style={mont}>{e.templateName}</span>
                                <span className="shrink-0 rounded-full bg-[#f3f4f6] px-1.5 py-0.5 text-[9px] font-medium text-[#6a7282]" style={mont}>
                                  {e.source === EnvelopeSource.CUSTOM_UPLOAD ? "Custom Document" : "DocuSign Template"}
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ backgroundColor: badge.bg, color: badge.text }}>
                                  <span className="size-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                                  {badge.label}
                                </span>
                              </div>
                              <span className="truncate text-[11px] text-[#6a7282]" style={mont}>
                                {e.recipientName}{e.recipients.length > 1 ? ` +${e.recipients.length - 1} more` : ""}
                                {e.propertyReference ? ` · ${e.propertyReference}` : ""} · Updated {fmtDate(e.updatedAt)}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {e.documentUrl && (
                                <a href={e.documentUrl} target="_blank" rel="noopener noreferrer" title="View" className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {canResendEnvelope && isPending && (
                                <button type="button" onClick={() => resendLinkedEnvelope(e.id)} title="Resend" className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                                  <RefreshCw size={14} />
                                </button>
                              )}
                              {canVoidEnvelope && isPending && (
                                <button type="button" onClick={() => voidLinkedEnvelope(e.id)} title="Void" className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]">
                                  <XCircle size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => detachEnvelope(e.id)}
                                disabled={detachMutation.isPending}
                                title="Detach from this Opportunity"
                                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]"
                              >
                                <Link2Off size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {availableEnvelopes.length > 0 && (
                    <>
                      <SearchableSelect
                        className="min-w-[220px] flex-1"
                        size="sm"
                        value={selectedEnvelopeId}
                        onChange={(next) => setSelectedEnvelopeId(next)}
                        options={availableEnvelopes.map((e) => ({ value: e.id, label: `${e.templateName} — ${e.recipientName}` }))}
                        placeholder="Attach an existing envelope…"
                      />
                      <button
                        type="button"
                        onClick={attachSelectedEnvelope}
                        disabled={!selectedEnvelopeId || attachMutation.isPending}
                        className="h-9 px-3 rounded-[8px] border border-[#1a5ea8] bg-white flex items-center gap-1.5 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={mont}
                      >
                        Attach
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSendModal(true)}
                    className="h-9 px-3 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <Send size={14} /> Add Contract / Send for Signature
                  </button>
                </div>
              </div>
            ) : (
              <ContractSourcePicker
                allowNone
                disabled={submitting || isSaving}
                participants={participants.map((p) => ({
                  name: (p.role === "AGENCY" ? p.companyName : p.contactLabel).trim() || "Unknown",
                  email: p.contactEmail || null,
                  role: p.role,
                }))}
                templates={templatesData?.templates ?? []}
                onSelectionChange={setContractSelection}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-[#e5e7eb] pt-4">
            <button type="button" onClick={requestClose} disabled={submitting || isSaving} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors disabled:cursor-not-allowed disabled:opacity-60" style={mont}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || isSaving} className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={mont}>
              {submitting || isSaving
                ? "Saving…"
                : mode === "edit"
                  ? "Save Changes"
                  : contractSelection
                    ? "Create Opportunity & Send Contract"
                    : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>

      {showSendModal && initial && (
        <SendOpportunityContractModal
          opportunityId={initial.id}
          opportunityLabel={`${initial.opportunityId} — ${initial.title}`}
          propertyReference={initial.listings[0]?.propertyTitle ?? null}
          participants={initial.participants.map((p) => ({
            name: (p.contactName ?? p.companyName ?? "Unknown").trim(),
            email: p.role === "AGENCY" ? p.companyEmail : p.contactEmail,
            role: p.role,
          }))}
          hasActiveEnvelope={linkedEnvelopes.some(
            (e) => e.status === EnvelopeStatus.SENT || e.status === EnvelopeStatus.DELIVERED,
          )}
          templates={templatesData?.templates ?? []}
          onClose={() => setShowSendModal(false)}
          onSent={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}
