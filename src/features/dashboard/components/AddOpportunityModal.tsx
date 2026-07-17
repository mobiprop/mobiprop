"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, UserPlus, Users, Calendar, Trash2, AlertTriangle, Home, FileSignature, Send, Link2Off, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
import { ContractSourcePicker, type ContractSelection, type Source as ContractSourcePickerSource } from "./ContractSourcePicker";

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

const COMMISSION_UNIT_OPTIONS = [
  { value: "%", label: "%" },
  { value: "$", label: "$" },
];
const STAGE_VALUES: OpportunityStage[] = [
  OpportunityStage.QUALIFICATION,
  OpportunityStage.VISITATION,
  OpportunityStage.OFFER,
  OpportunityStage.NEGOTIATION,
  OpportunityStage.CLOSING,
];
const STATUS_VALUES: OpportunityStatus[] = [
  OpportunityStatus.OPEN,
  OpportunityStatus.CLOSED_WON,
  OpportunityStatus.CLOSED_LOST,
];
const ROLE_VALUES = ["BUYER", "SELLER", "AGENCY"] as const;

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
  const { t } = useTranslation("opportunities");
  const ROLE_LABELS: Record<OpportunityParticipantRole, string> = {
    BUYER: t("addModal.participantsSection.roles.BUYER"),
    SELLER: t("addModal.participantsSection.roles.SELLER"),
    AGENCY: t("addModal.participantsSection.roles.AGENCY"),
  };
  const ROLE_OPTIONS = ROLE_VALUES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));
  const CONTACT_ROLE_OPTIONS = ROLE_OPTIONS.filter((o) => o.value !== "AGENCY");
  const DEAL_TYPE_OPTIONS: { value: "Rent" | "Sale"; label: string }[] = [
    { value: "Rent", label: t("addModal.dealTypeOptions.RENT") },
    { value: "Sale", label: t("addModal.dealTypeOptions.SALE") },
  ];
  const STAGE_OPTIONS = STAGE_VALUES.map((value) => ({ value, label: t(`dashboard:status.${value}`) }));
  const STATUS_OPTIONS = STATUS_VALUES.map((value) => ({ value, label: t(`dashboard:status.${value}`) }));

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
  // Mirrors ContractSourcePicker's internal tab — lets handleSubmit tell the
  // difference between "user chose No Contract" (fine to submit) and "user
  // picked a source but never finished it" (block — otherwise the contract
  // silently never gets sent and the user has no idea why).
  const [contractSource, setContractSource] = useState<ContractSourcePickerSource>("NONE");
  const [contractError, setContractError] = useState<string | null>(null);
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
      toast.success(t("addModal.contractsSection.toasts.attached"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.contractsSection.toasts.attachFailed"));
    }
  }

  async function detachEnvelope(envelopeId: string) {
    if (!initial) return;
    try {
      await detachMutation.mutateAsync({ opportunityId: initial.id, envelopeId });
      toast.success(t("addModal.contractsSection.toasts.detached"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.contractsSection.toasts.detachFailed"));
    }
  }

  async function voidLinkedEnvelope(envelopeId: string) {
    const reason = window.prompt(t("addModal.contractsSection.voidReasonPrompt"));
    if (!reason) return;
    try {
      await voidMutation.mutateAsync({ id: envelopeId, reason });
      toast.success(t("addModal.contractsSection.toasts.voided"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.contractsSection.toasts.voidFailed"));
    }
  }

  async function resendLinkedEnvelope(envelopeId: string) {
    try {
      await resendMutation.mutateAsync(envelopeId);
      toast.success(t("addModal.contractsSection.toasts.reminderSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.contractsSection.toasts.resendFailed"));
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
        toast.error(t("addModal.participantsSection.companyNameRequired"));
        return;
      }
      setParticipants((rows) => [...rows, {
        key: newRowKey(), role: "AGENCY", contactId: "", contactLabel: "",
        contactEmail: existingCompanyEmail.trim(), companyName: existingCompanyName.trim(), companyEmail: existingCompanyEmail.trim(),
      }]);
    } else {
      if (!existingContactId) {
        toast.error(t("addModal.participantsSection.selectContactRequired"));
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
      toast.error(t("addModal.participantsSection.newPanel.nameRequired"));
      return;
    }
    if (!ncEmail.trim() && !ncPhone.trim()) {
      toast.error(t("addModal.participantsSection.newPanel.emailOrPhoneRequired"));
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
      toast.success(t("addModal.participantsSection.newPanel.contactCreated"));
      if (ncAddAsParticipant) {
        setParticipants((rows) => [...rows, {
          key: newRowKey(), role: ncRole, contactId: contact.id, contactLabel: contact.fullName,
          contactEmail: ncEmail.trim(), companyName: "", companyEmail: "",
        }]);
        setParticipantsError(null);
      }
      closeParticipantPanel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.participantsSection.newPanel.createFailed"));
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
      setParticipantsError(t("addModal.participantsRequired"));
      return;
    }
    // A source was picked (document/template) but never finished (no
    // confirmed signer) — block instead of silently creating a
    // contract-less Opportunity with no indication anything went wrong.
    if (mode === "create" && contractSource !== "NONE" && !contractSelection) {
      setContractError(
        contractSource === "TEMPLATE"
          ? t("addModal.contractIncompleteTemplate")
          : t("addModal.contractIncompleteUpload"),
      );
      return;
    }
    setContractError(null);

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
          toast.success(t("addModal.toasts.createdAndSent"));
        } catch {
          toast.error(t("addModal.toasts.sendFailed"));
          onClose();
          return;
        }
      } else {
        toast.success(mode === "edit" ? t("addModal.toasts.updated") : t("addModal.toasts.created"));
      }

      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addModal.toasts.saveFailed"));
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
            {mode === "edit" ? t("addModal.editTitle") : t("addModal.newTitle")}
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
                  <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>{t("addModal.discardConfirm.title")}</p>
                  <p className="text-[13px] leading-5 text-[#6a7282]" style={mont}>
                    {t("addModal.discardConfirm.message")}
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
                  {t("addModal.discardConfirm.keepEditing")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-[10px] bg-[#fb2c36] text-[13px] font-medium text-white transition-colors hover:bg-[#e0262f]"
                  style={mont}
                >
                  {t("addModal.discardConfirm.discard")}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          {/* Opportunity name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("addModal.name")}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("addModal.namePlaceholder")} className={inputClass} style={mont} />
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>{t("addModal.participantsSection.title")}</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>{t("addModal.participantsSection.subtitle")}</p>

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
                          {row.role === "AGENCY" ? row.companyName || t("addModal.participantsSection.untitledCompany") : row.contactLabel || t("addModal.participantsSection.untitledContact")}
                        </span>
                        <span className="truncate text-[11px] text-[#6a7282]" style={mont}>{ROLE_LABELS[row.role]}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParticipant(row.key)}
                      title={t("addModal.participantsSection.removeAria")}
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
                <Plus size={14} /> {t("addModal.participantsSection.addContact")}
              </button>
              <button
                type="button"
                onClick={() => (participantPanel === "existing" ? closeParticipantPanel() : openExistingPanel())}
                className="h-9 px-3 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                style={mont}
              >
                <UserPlus size={14} /> {t("addModal.participantsSection.addParticipant")}
              </button>
            </div>

            {participantsError && <p className="text-[11px] text-[#dc2626]" style={mont}>{participantsError}</p>}

            {/* Add Existing Contact as Participant */}
            {participantPanel === "existing" && (
              <div className="flex flex-col gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-3.5">
                <p className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{t("addModal.participantsSection.existingPanel.title")}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{existingRole === "AGENCY" ? t("addModal.participantsSection.existingPanel.companyName") : t("addModal.participantsSection.existingPanel.selectContact")}</label>
                    {existingRole === "AGENCY" ? (
                      <input
                        value={existingCompanyName}
                        onChange={(e) => setExistingCompanyName(e.target.value)}
                        placeholder={t("addModal.participantsSection.existingPanel.companyNamePlaceholder")}
                        className={inputClass}
                        style={mont}
                      />
                    ) : (
                      <ContactPicker
                        value={existingContactId}
                        label={existingContactLabel}
                        onSelect={(id, lbl, email) => { setExistingContactId(id); setExistingContactLabel(lbl); setExistingContactEmail(email ?? ""); }}
                        placeholder={t("addModal.participantsSection.existingPanel.contactSearchPlaceholder")}
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.existingPanel.role")}</label>
                    <SearchableSelect
                      size="sm"
                      searchable={false}
                      value={existingRole}
                      onChange={(next) => setExistingRole(next as OpportunityParticipantRole)}
                      options={ROLE_OPTIONS}
                      placeholder={t("addModal.participantsSection.existingPanel.selectRole")}
                    />
                  </div>
                </div>
                {existingRole === "AGENCY" && (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.existingPanel.companyEmail")}</label>
                    <input
                      type="email"
                      value={existingCompanyEmail}
                      onChange={(e) => setExistingCompanyEmail(e.target.value)}
                      placeholder={t("addModal.participantsSection.existingPanel.companyEmailPlaceholder")}
                      className={inputClass}
                      style={mont}
                    />
                    <p className="text-[11px] text-[#9ca3af]" style={mont}>{t("addModal.participantsSection.existingPanel.companyEmailHint")}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addExistingParticipant}
                    className="h-9 px-4 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <UserPlus size={14} /> {t("addModal.participantsSection.existingPanel.addToOpportunity")}
                  </button>
                  <button
                    type="button"
                    onClick={closeParticipantPanel}
                    className="h-9 px-4 rounded-[8px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    {t("addModal.participantsSection.existingPanel.cancel")}
                  </button>
                </div>
              </div>
            )}

            {/* Add Contact */}
            {participantPanel === "new" && (
              <div className="flex flex-col gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-3.5">
                <p className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{t("addModal.participantsSection.newPanel.title")}</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.firstName")}</label>
                    <input value={ncFirstName} onChange={(e) => setNcFirstName(e.target.value)} placeholder={t("addModal.participantsSection.newPanel.firstNamePlaceholder")} className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.lastName")}</label>
                    <input value={ncLastName} onChange={(e) => setNcLastName(e.target.value)} placeholder={t("addModal.participantsSection.newPanel.lastNamePlaceholder")} className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.email")}</label>
                    <input type="email" value={ncEmail} onChange={(e) => setNcEmail(e.target.value)} placeholder={t("addModal.participantsSection.newPanel.emailPlaceholder")} className={inputClass} style={mont} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.phone")}</label>
                    <input type="tel" value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} placeholder={t("addModal.participantsSection.newPanel.phonePlaceholder")} className={inputClass} style={mont} />
                  </div>
                </div>
                {!ncEmail.trim() && !ncPhone.trim() && (
                  <p className="text-[11px] text-[#b45309]" style={mont}>{t("addModal.participantsSection.newPanel.emailOrPhoneRequired")}</p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.contactType")}</label>
                  <SearchableSelect
                    size="sm"
                    searchable={false}
                    value={ncType}
                    onChange={(next) => setNcType(next as ContactType)}
                    options={[
                      { value: ContactType.BUYER, label: t("addModal.participantsSection.newPanel.contactTypeOptions.BUYER") },
                      { value: ContactType.SELLER, label: t("addModal.participantsSection.newPanel.contactTypeOptions.SELLER") },
                      { value: ContactType.BOTH, label: t("addModal.participantsSection.newPanel.contactTypeOptions.BOTH") },
                    ]}
                    placeholder={t("addModal.participantsSection.newPanel.selectContactType")}
                    ariaLabel={t("addModal.participantsSection.newPanel.contactTypeAria")}
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3">
                  <span className="flex flex-col">
                    <span className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("addModal.participantsSection.newPanel.addAsParticipant")}</span>
                    <span className="text-[11px] text-[#6a7282]" style={mont}>{t("addModal.participantsSection.newPanel.addAsParticipantHint")}</span>
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
                    <label className={labelClass} style={mont}>{t("addModal.participantsSection.newPanel.role")}</label>
                    <SearchableSelect
                      size="sm"
                      searchable={false}
                      value={ncRole}
                      onChange={(next) => setNcRole(next as OpportunityParticipantRole)}
                      options={CONTACT_ROLE_OPTIONS}
                      placeholder={t("addModal.participantsSection.newPanel.selectRole")}
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
                    <UserPlus size={14} /> {createContactMutation.isPending ? t("addModal.participantsSection.newPanel.creating") : t("addModal.participantsSection.newPanel.createAndAdd")}
                  </button>
                  <button
                    type="button"
                    onClick={closeParticipantPanel}
                    className="h-9 px-4 rounded-[8px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    {t("addModal.participantsSection.newPanel.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Property Listings */}
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <Home size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>{t("addModal.listingsSection.title")}</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>{t("addModal.listingsSection.subtitle")}</p>

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
                    placeholder={t("addModal.listingsSection.selectPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => removeListingRow(row.key)}
                    disabled={listingRows.length === 1}
                    title={t("addModal.listingsSection.removeAria")}
                    aria-label={t("addModal.listingsSection.removeAria")}
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
              {t("addModal.listingsSection.addListing")}
            </button>
          </div>

          {/* Deal type / size */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.dealType")}</label>
              <SearchableSelect
                size="sm"
                searchable={false}
                value={dealType}
                onChange={(next) => setDealType(next as "Rent" | "Sale")}
                options={DEAL_TYPE_OPTIONS}
                placeholder={t("addModal.selectType")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.dealSize")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input required type="number" value={dealSize} onChange={(e) => setDealSize(e.target.value)} placeholder={t("addModal.dealSizePlaceholder")} className="h-10 w-full pl-7 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              </div>
            </div>
          </div>

          {/* Rental contract period — only for rentals */}
          {isRental && (
            <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#1e4f86]" />
                <p className="text-[12px] font-medium text-[#1e4f86]" style={mont}>{t("addModal.rentalPeriod.title")}</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>{t("addModal.rentalPeriod.startDate")}</label>
                  <DatePickerField required value={contractStart} onChange={setContractStart} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>{t("addModal.rentalPeriod.endDate")}</label>
                  <DatePickerField required value={contractEnd} onChange={setContractEnd} />
                </div>
              </div>
            </div>
          )}

          {/* Commission amount / payment terms */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.commissionAmount")}</label>
              <div className="flex items-center gap-2">
                <input value={commission} onChange={(e) => setCommission(e.target.value)} placeholder={t("addModal.commissionPlaceholder")} className={`flex-1 ${inputClass}`} style={mont} />
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
                <p className="text-[11px] text-[#6a7282]" style={mont}>{t("addModal.commissionPreview", { amount: commissionPreview })}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.paymentTerms")}</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder={t("addModal.paymentTermsPlaceholder")} className={inputClass} style={mont} />
            </div>
          </div>

          {/* Probability slider */}
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>{t("addModal.probability", { value: probability })}</label>
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
              <label className={labelClass} style={mont}>{t("addModal.stage")}</label>
              <SearchableSelect
                size="sm"
                searchable={false}
                value={stage}
                onChange={(next) => setStage(next as OpportunityStage)}
                options={STAGE_OPTIONS}
                placeholder={t("addModal.selectStage")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.expectedCloseDate")}</label>
              <DatePickerField required value={expectedCloseAt} onChange={setExpectedCloseAt} />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("addModal.status")}</label>
            <SearchableSelect
              size="sm"
              searchable={false}
              value={status}
              onChange={(next) => setStatus(next as OpportunityStatus)}
              options={STATUS_OPTIONS}
              placeholder={t("addModal.selectStatus")}
            />
          </div>

          {/* Agent / agent commission */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.agent")}</label>
              <AgentSelect value={assignedAgentId} onChange={setAssignedAgentId} placeholder={t("addModal.selectAgentPlaceholder")} lockedAgent={lockedAgent} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("addModal.agentCommission")}</label>
              <div className="flex items-center gap-2">
                <input value={agentCommissionValue} onChange={(e) => setAgentCommissionValue(e.target.value)} placeholder={t("addModal.commissionPlaceholder")} className={`flex-1 ${inputClass}`} style={mont} />
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
                <p className="text-[11px] text-[#6a7282]" style={mont}>{t("addModal.agentCommissionPreview", { amount: agentCommissionPreview })}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("addModal.description")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("addModal.descriptionPlaceholder")} rows={3} className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none" style={mont} />
          </div>

          {/* Contracts & Signatures */}
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2">
              <FileSignature size={15} className="shrink-0 text-[#1a5ea8]" />
              <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>{t("addModal.contractsSection.title")}</p>
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
              {t("addModal.contractsSection.subtitle")}
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
                                  {e.source === EnvelopeSource.CUSTOM_UPLOAD ? t("addModal.contractsSection.customDocumentBadge") : t("addModal.contractsSection.templateBadge")}
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium" style={{ backgroundColor: badge.bg, color: badge.text }}>
                                  <span className="size-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
                                  {t(`dashboard:envelopeStatus.${e.status}`, { defaultValue: badge.label })}
                                </span>
                              </div>
                              <span className="truncate text-[11px] text-[#6a7282]" style={mont}>
                                {e.recipientName}{e.recipients.length > 1 ? t("addModal.contractsSection.moreRecipients", { count: e.recipients.length - 1 }) : ""}
                                {e.propertyReference ? ` · ${e.propertyReference}` : ""} · {t("addModal.contractsSection.updated", { date: fmtDate(e.updatedAt) })}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {e.documentUrl && (
                                <a href={e.documentUrl} target="_blank" rel="noopener noreferrer" title={t("addModal.contractsSection.viewAria")} className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              {canResendEnvelope && isPending && (
                                <button type="button" onClick={() => resendLinkedEnvelope(e.id)} title={t("addModal.contractsSection.resendAria")} className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                                  <RefreshCw size={14} />
                                </button>
                              )}
                              {canVoidEnvelope && isPending && (
                                <button type="button" onClick={() => voidLinkedEnvelope(e.id)} title={t("addModal.contractsSection.voidAria")} className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]">
                                  <XCircle size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => detachEnvelope(e.id)}
                                disabled={detachMutation.isPending}
                                title={t("addModal.contractsSection.detachAria")}
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
                        placeholder={t("addModal.contractsSection.attachPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={attachSelectedEnvelope}
                        disabled={!selectedEnvelopeId || attachMutation.isPending}
                        className="h-9 px-3 rounded-[8px] border border-[#1a5ea8] bg-white flex items-center gap-1.5 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={mont}
                      >
                        {t("addModal.contractsSection.attach")}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSendModal(true)}
                    className="h-9 px-3 rounded-[8px] bg-[#1e4f86] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <Send size={14} /> {t("addModal.contractsSection.addOrSend")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ContractSourcePicker
                  allowNone
                  disabled={submitting || isSaving}
                  participants={participants.map((p) => ({
                    name: (p.role === "AGENCY" ? p.companyName : p.contactLabel).trim() || "Unknown",
                    email: p.contactEmail || null,
                    role: p.role,
                  }))}
                  templates={templatesData?.templates ?? []}
                  onSelectionChange={(selection) => { setContractSelection(selection); if (selection) setContractError(null); }}
                  onSourceChange={setContractSource}
                />
                {contractError && <p className="text-[11px] text-[#dc2626]" style={mont}>{contractError}</p>}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-[#e5e7eb] pt-4">
            <button type="button" onClick={requestClose} disabled={submitting || isSaving} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors disabled:cursor-not-allowed disabled:opacity-60" style={mont}>
              {t("addModal.cancel")}
            </button>
            <button type="submit" disabled={submitting || isSaving} className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={mont}>
              {submitting || isSaving
                ? t("addModal.saving")
                : mode === "edit"
                  ? t("addModal.saveChanges")
                  : contractSelection
                    ? t("addModal.createAndSend")
                    : t("addModal.create")}
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
