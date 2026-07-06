"use client";

import { useMemo, useState } from "react";
import { X, Plus, UserPlus, Users, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ContactType, OpportunityStage, OpportunityStatus } from "@/generated/prisma/enums";
import type { OpportunityDto, OpportunityParticipantRole } from "@/features/crm/types/crm-dto";
import { computeCommissionAmount } from "@/lib/commission";
import { useCreateContactMutation } from "@/hooks/mutations/useCrmMutations";
import { SearchableSelect } from "./SearchableSelect";
import { ContactPicker } from "./ContactPicker";
import { ListingPicker } from "./ListingPicker";
import { AgentSelect } from "./AgentSelect";
import { DatePickerField } from "./DatePickerField";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ParticipantFormRow = {
  /** Local-only React key — never sent to the server. */
  key: string;
  role: OpportunityParticipantRole;
  contactId: string;
  contactLabel: string;
  /** AGENCY rows only — free text, no Contact record. */
  companyName: string;
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
  propertyId: string;
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
  onSubmit: (values: OpportunityFormValues) => void;
  isSaving?: boolean;
  /** When set (AGENT logged in), the Assigned Agent field is locked to self. */
  lockedAgent?: { id: string; name: string } | null;
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
    companyName: p.companyName ?? "",
  }));
}

function fmtPreview(amount: number | null) {
  if (amount === null) return null;
  return `≈ $${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AddOpportunityModal({ mode = "create", initial, onClose, onSubmit, isSaving, lockedAgent }: AddOpportunityModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [participants, setParticipants] = useState<ParticipantFormRow[]>(() => participantsFromInitial(initial));
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [participantPanel, setParticipantPanel] = useState<"none" | "existing" | "new">("none");

  // "Add Existing Contact as Participant" panel
  const [existingRole, setExistingRole] = useState<OpportunityParticipantRole>("BUYER");
  const [existingContactId, setExistingContactId] = useState("");
  const [existingContactLabel, setExistingContactLabel] = useState("");
  const [existingCompanyName, setExistingCompanyName] = useState("");

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
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? "");
  const [propertyLabel, setPropertyLabel] = useState(initial?.propertyTitle ?? "");
  const [status, setStatus] = useState<OpportunityStatus>(initial?.status ?? OpportunityStatus.OPEN);
  const [assignedAgentId, setAssignedAgentId] = useState(initial?.assignedAgentId ?? lockedAgent?.id ?? "");
  const [agentCommissionValue, setAgentCommissionValue] = useState(
    initial?.agentCommissionValue != null ? String(initial.agentCommissionValue) : "",
  );
  const [agentCommissionUnit, setAgentCommissionUnit] = useState<"%" | "$">(
    (initial?.agentCommissionUnit as "%" | "$") ?? "%",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

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
    setExistingCompanyName("");
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
      setParticipants((rows) => [...rows, { key: newRowKey(), role: "AGENCY", contactId: "", contactLabel: "", companyName: existingCompanyName.trim() }]);
    } else {
      if (!existingContactId) {
        toast.error("Select a contact.");
        return;
      }
      setParticipants((rows) => [...rows, { key: newRowKey(), role: existingRole, contactId: existingContactId, contactLabel: existingContactLabel, companyName: "" }]);
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
        setParticipants((rows) => [...rows, { key: newRowKey(), role: ncRole, contactId: contact.id, contactLabel: contact.fullName, companyName: "" }]);
        setParticipantsError(null);
      }
      closeParticipantPanel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const hasBuyerOrSeller = participants.some(
      (r) => (r.role === "BUYER" || r.role === "SELLER") && r.contactId,
    );
    if (!hasBuyerOrSeller) {
      setParticipantsError("At least one Buyer or Seller contact is required.");
      return;
    }

    onSubmit({
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
      propertyId,
      status,
      assignedAgentId,
      agentCommissionValue,
      agentCommissionUnit,
      notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

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
                        onSelect={(id, lbl) => { setExistingContactId(id); setExistingContactLabel(lbl); }}
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

          {/* Associated property / status */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Associated Property</label>
              <ListingPicker
                tone="neutral"
                value={propertyId}
                label={propertyLabel}
                onSelect={(id, lbl) => { setPropertyId(id); setPropertyLabel(lbl); }}
                placeholder="Select Property"
              />
            </div>
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

          {/* Actions */}
          <div className="flex gap-3 border-t border-[#e5e7eb] pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={mont}>
              {isSaving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
