"use client";

import { useState } from "react";
import { X, ChevronDown, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ContractType, ContractStatus } from "@/generated/prisma/enums";
import type { ContractDto } from "@/features/crm/types/crm-dto";
import type { ContractDraft } from "@/features/crm/opportunity-actions";
import {
  useUploadContractDocumentMutation,
  useRemoveContractDocumentMutation,
} from "@/hooks/mutations/useCrmMutations";
import { ContactPicker } from "./ContactPicker";
import { ListingPicker } from "./ListingPicker";
import { AgentSelect } from "./AgentSelect";
import { DatePickerField } from "./DatePickerField";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ContractFormValues = {
  title: string;
  type: ContractType;
  status: ContractStatus;
  contactId: string;
  propertyId: string;
  assignedAgentId: string;
  opportunityId: string;
  value: string;
  startDate: string;
  endDate: string;
  terms: string;
  notes: string;
};

type AddContractModalProps = {
  mode?: "create" | "edit";
  initial?: ContractDto;
  /** Pre-fill from "Create Contract from Won Opportunity" — a human still confirms/saves. */
  draft?: ContractDraft;
  onClose: () => void;
  onSubmit: (values: ContractFormValues) => void;
  isSaving?: boolean;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] text-[#1f2937]";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AddContractModal({ mode = "create", initial, draft, onClose, onSubmit, isSaving }: AddContractModalProps) {
  const [title, setTitle] = useState(initial?.title ?? draft?.title ?? "");
  const [type, setType] = useState<ContractType>(initial?.type ?? draft?.type ?? ContractType.SALE);
  const [status, setStatus] = useState<ContractStatus>(initial?.status ?? ContractStatus.ACTIVE);
  const [contactId, setContactId] = useState(initial?.contactId ?? draft?.contactId ?? "");
  const [contactLabel, setContactLabel] = useState(initial?.contactName ?? "");
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? draft?.propertyId ?? "");
  const [propertyLabel, setPropertyLabel] = useState(initial?.propertyTitle ?? "");
  const [assignedAgentId, setAssignedAgentId] = useState(initial?.assignedAgentId ?? draft?.assignedAgentId ?? "");
  const [opportunityId] = useState(initial?.opportunityId ?? draft?.opportunityId ?? "");
  const [opportunityLabel] = useState(initial?.opportunityNumber ?? "");
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : draft?.value != null ? String(draft.value) : "");
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? draft?.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? draft?.endDate?.slice(0, 10) ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [documents, setDocuments] = useState(initial?.documents ?? []);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadMutation = useUploadContractDocumentMutation();
  const removeMutation = useRemoveContractDocumentMutation();

  const contractId = initial?.id ?? null;

  async function handleFiles(files: FileList | File[]) {
    if (!contractId) {
      toast.error("Save the contract before attaching documents.");
      return;
    }
    for (const file of Array.from(files)) {
      const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: only PDF, DOC, and DOCX files are supported.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: exceeds the 10MB limit.`);
        continue;
      }
      try {
        const doc = await uploadMutation.mutateAsync({ contractId, file });
        setDocuments((prev) => [doc, ...prev]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
  }

  async function handleRemoveDocument(documentId: string) {
    if (!contractId) return;
    try {
      await removeMutation.mutateAsync({ contractId, documentId });
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove document");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      type,
      status,
      contactId,
      propertyId,
      assignedAgentId,
      opportunityId,
      value,
      startDate,
      endDate,
      terms: terms.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-[700px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:max-h-[92vh] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:pb-[21px] sm:pt-5">
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-[15px] font-semibold leading-6 text-[#0d2138] sm:text-[16px]" style={mont}>
              {mode === "edit" ? "Edit Contract" : "New Contract"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#6a7282] sm:text-[12px]" style={mont}>
              {draft ? "Pre-filled from a Closed Won opportunity — review and save" : "Create a new property contract"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
          {/* Basic Information */}
          <div className="flex flex-col gap-4">
            <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Basic Information</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="flex min-w-0 flex-col gap-2">
                <label className={labelClass} style={mont}>Contract Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sale Agreement - Sierra Lakeview Estate"
                  className={`${inputClass} min-w-0`}
                  style={mont}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <label className={labelClass} style={mont}>Contract Type *</label>
                <div className="relative">
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value as ContractType)}
                    className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-3 pr-9 text-[12px] text-[#232323] outline-none transition-colors focus:border-[#1e4f86]"
                    style={mont}
                  >
                    <option value={ContractType.SALE}>Sale</option>
                    <option value={ContractType.RENT}>Rent</option>
                    <option value={ContractType.SALE_AND_RENT}>Sale &amp; Rent</option>
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact / Property / Agent */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Contact *</label>
              <ContactPicker
                value={contactId}
                label={contactLabel}
                onSelect={(id, lbl) => { setContactId(id); setContactLabel(lbl); }}
                placeholder="Search and select contact…"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Property Listing</label>
              <ListingPicker
                tone="neutral"
                value={propertyId}
                label={propertyLabel}
                onSelect={(id, lbl) => { setPropertyId(id); setPropertyLabel(lbl); }}
                placeholder="Select listing…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Assigned Agent</label>
              <AgentSelect value={assignedAgentId} onChange={setAssignedAgentId} placeholder="Select agent…" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Contract Value</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} w-full pl-7`}
                  style={mont}
                />
              </div>
            </div>
          </div>

          {opportunityId && (
            <div className="rounded-[10px] border border-[#c2dcff] bg-[#eff6ff] px-3.5 py-2.5 text-[12px] text-[#1e4f86]" style={mont}>
              Linked to opportunity {opportunityLabel || opportunityId}
            </div>
          )}

          {/* Dates / Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Start Date</label>
              <DatePickerField value={startDate} onChange={setStartDate} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>End Date</label>
              <DatePickerField value={endDate} onChange={setEndDate} />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} style={mont}>Status *</label>
              <div className="relative">
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-3 pr-9 text-[12px] text-[#232323] outline-none transition-colors focus:border-[#1e4f86]"
                  style={mont}
                >
                  <option value={ContractStatus.ACTIVE}>Active</option>
                  <option value={ContractStatus.PENDING}>Pending</option>
                  <option value={ContractStatus.COMPLETED}>Completed</option>
                  <option value={ContractStatus.DRAFT}>Draft</option>
                  <option value={ContractStatus.CANCELLED}>Cancelled</option>
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]" />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="flex flex-col gap-4">
            <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Additional Details</p>

            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Terms &amp; Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter specific contract terms, conditions, and special clauses..."
                rows={4}
                className="w-full resize-none rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86]"
                style={mont}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={2}
                className="w-full resize-none rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86]"
                style={mont}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Contract Documents</label>

              {documents.length > 0 && (
                <div className="flex flex-col gap-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-2.5 text-[#0d2138] hover:text-[#1e4f86]">
                        <FileText size={16} className="shrink-0 text-[#6a7282]" />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={mont}>{doc.fileName}</span>
                        <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtBytes(doc.sizeBytes)}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        disabled={removeMutation.isPending}
                        title="Remove"
                        className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!contractId ? (
                <p className="rounded-[10px] border border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-4 text-center text-[12px] text-[#9ca3af]" style={mont}>
                  Save the contract first, then attach documents from Edit.
                </p>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors ${
                    isDragOver ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-[#fafbfc]"
                  }`}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 size={24} className="animate-spin text-[#1e4f86]" />
                  ) : (
                    <Upload size={24} className="text-[#9ca3af]" />
                  )}
                  <label className="cursor-pointer text-[13px] font-medium text-[#6b7280]" style={mont}>
                    Click to upload or drag and drop
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>PDF, DOC, DOCX up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-[42px] w-full rounded-[10px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] sm:flex-1"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-[42px] w-full rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
              style={mont}
            >
              {isSaving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
