"use client";

import { useMemo, useState } from "react";
import { X, Plus, Calendar, Trash2 } from "lucide-react";

import { OpportunityStage, OpportunityStatus } from "@/generated/prisma/enums";
import type { OpportunityDto, OpportunityParticipantRole } from "@/features/crm/types/crm-dto";
import { computeCommissionAmount } from "@/lib/commission";
import { QuickAddContactModal } from "./QuickAddContactModal";
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
const ROLE_BADGE_CLASS: Record<OpportunityParticipantRole, string> = {
  BUYER: "bg-[#eff6ff] text-[#1e4f86] border-[#bfdbfe]",
  SELLER: "bg-[#fdf4ff] text-[#a21caf] border-[#f3e8ff]",
  AGENCY: "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]",
};

let rowKeySeq = 0;
function newRowKey() {
  rowKeySeq += 1;
  return `participant-${rowKeySeq}`;
}

function emptyParticipantRow(role: OpportunityParticipantRole): ParticipantFormRow {
  return { key: newRowKey(), role, contactId: "", contactLabel: "", companyName: "" };
}

function participantsFromInitial(initial?: OpportunityDto): ParticipantFormRow[] {
  if (!initial || initial.participants.length === 0) {
    return [emptyParticipantRow("BUYER")];
  }
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
  const [addContactForKey, setAddContactForKey] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
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

  function addParticipant(role: OpportunityParticipantRole) {
    setParticipants((rows) => [...rows, emptyParticipantRow(role)]);
    setParticipantsError(null);
  }

  function removeParticipant(key: string) {
    setParticipants((rows) => rows.filter((r) => r.key !== key));
  }

  function updateParticipant(key: string, patch: Partial<ParticipantFormRow>) {
    setParticipants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setParticipantsError(null);
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
    const incomplete = participants.some((r) =>
      r.role === "AGENCY" ? !r.companyName.trim() : !r.contactId,
    );
    if (incomplete) {
      setParticipantsError("Fill in every participant row, or remove the empty one.");
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
        className="relative bg-white rounded-[16px] w-full max-w-[700px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
            {mode === "edit" ? "Edit Opportunity" : "New Opportunity"}
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* Opportunity name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Opportunity Name *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter opportunity name" className={inputClass} style={mont} />
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-2.5">
            <label className={labelClass} style={mont}>Participants *</label>

            <div className="flex flex-col gap-2.5">
              {participants.map((row) => (
                <div key={row.key} className="flex items-center gap-2">
                  <span
                    className={`shrink-0 rounded-[8px] border px-2.5 py-2 text-[11px] font-medium ${ROLE_BADGE_CLASS[row.role]}`}
                    style={mont}
                  >
                    {ROLE_LABELS[row.role]}
                  </span>

                  {row.role === "AGENCY" ? (
                    <input
                      value={row.companyName}
                      onChange={(e) => updateParticipant(row.key, { companyName: e.target.value })}
                      placeholder="Real estate company name"
                      className={`flex-1 ${inputClass}`}
                      style={mont}
                    />
                  ) : (
                    <>
                      <ContactPicker
                        className="flex-1"
                        value={row.contactId}
                        label={row.contactLabel}
                        onSelect={(id, lbl) => updateParticipant(row.key, { contactId: id, contactLabel: lbl })}
                        placeholder="Search and select contact…"
                      />
                      <button
                        type="button"
                        onClick={() => setAddContactForKey(row.key)}
                        title="Add new contact"
                        className="h-10 px-3 bg-[#1e4f86] rounded-[8px] flex items-center gap-1.5 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors shrink-0"
                        style={mont}
                      >
                        <Plus size={16} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeParticipant(row.key)}
                    disabled={participants.length === 1}
                    title="Remove participant"
                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6a7282]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["BUYER", "SELLER", "AGENCY"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => addParticipant(role)}
                  className="h-9 px-3 rounded-[8px] border border-[#e5e7eb] bg-white flex items-center gap-1.5 text-[12px] font-medium text-[#1f2937] hover:bg-[#f9fafb] transition-colors"
                  style={mont}
                >
                  <Plus size={14} />
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>

            {participantsError && (
              <p className="text-[11px] text-[#dc2626]" style={mont}>{participantsError}</p>
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
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={mont}>
              {isSaving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>

      {addContactForKey && (
        <QuickAddContactModal
          onClose={() => setAddContactForKey(null)}
          onCreate={(c) => {
            if (c.fullName) {
              updateParticipant(addContactForKey, { contactId: c.id, contactLabel: c.fullName });
            }
            setAddContactForKey(null);
          }}
        />
      )}
    </div>
  );
}
