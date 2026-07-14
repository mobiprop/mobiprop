"use client";

import { useState } from "react";
import { X, Check, FileText, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import type { DocusignTemplateSummary } from "@/lib/docusign";
import { EnvelopeRecipientRole } from "@/generated/prisma/enums";
import { useSendForSignatureMutation } from "@/hooks/mutations/useDocusignMutations";
import { uploadDocusignDocument } from "@/lib/client-upload";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type Source = "TEMPLATE" | "CUSTOM_UPLOAD" | "SUPPORTING_DOC";

type OpportunityParticipantOption = {
  name: string;
  email: string | null;
  role: "BUYER" | "SELLER" | "AGENCY";
};

type SupportingDocumentOption = {
  id: string;
  fileName: string;
  sizeBytes: number;
};

const PARTICIPANT_ROLE_TO_RECIPIENT_ROLE: Record<OpportunityParticipantOption["role"], EnvelopeRecipientRole> = {
  BUYER: EnvelopeRecipientRole.BUYER,
  SELLER: EnvelopeRecipientRole.SELLER,
  AGENCY: EnvelopeRecipientRole.THIRD_PARTY,
};

const PARTICIPANT_ROLE_LABEL: Record<OpportunityParticipantOption["role"], string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  AGENCY: "Agency",
};

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SendOpportunityContractModalProps = {
  opportunityId: string;
  /** Human-readable label for the review summary, e.g. "OPP-0042 — Beach house sale". */
  opportunityLabel: string;
  /** Auto-derived from the Opportunity's first linked listing — never asked for. */
  propertyReference: string | null;
  participants: OpportunityParticipantOption[];
  /** Already-saved supporting documents — offered as a send source when present. */
  supportingDocuments: SupportingDocumentOption[];
  /** True when another envelope on this opportunity is still awaiting signature — shows a warning, never blocks. */
  hasActiveEnvelope: boolean;
  templates: DocusignTemplateSummary[];
  onClose: () => void;
  onSent: () => void;
};

/**
 * Simplified, single-screen "Send for Signature" for use from inside an
 * Opportunity — no wizard, no re-typing recipient/property details the
 * Opportunity already has. Distinct from SendForSignatureModal (the
 * standalone DocuSign-page flow, which has no Opportunity to derive
 * participants/listings from and keeps the full multi-step form).
 *
 * A custom document is staged in memory and only uploaded to storage when
 * Send is clicked, so cancelling the modal never leaves an orphaned file.
 */
export function SendOpportunityContractModal({
  opportunityId,
  opportunityLabel,
  propertyReference,
  participants,
  supportingDocuments,
  hasActiveEnvelope,
  templates,
  onClose,
  onSent,
}: SendOpportunityContractModalProps) {
  const [source, setSource] = useState<Source>("TEMPLATE");
  const [templateId, setTemplateId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [supportingDocId, setSupportingDocId] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(""); // TEMPLATE — single signer
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set()); // document sources — multi
  const [submitting, setSubmitting] = useState(false);

  const sendMutation = useSendForSignatureMutation();

  const eligibleParticipants = participants.filter((p) => p.email);
  const selectedTemplate = templates.find((t) => t.templateId === templateId) ?? null;
  const selectedSupportingDoc = supportingDocuments.find((d) => d.id === supportingDocId) ?? null;

  const sourceTabs: { value: Source; label: string }[] = [
    { value: "TEMPLATE", label: "DocuSign Template" },
    { value: "CUSTOM_UPLOAD", label: "Upload Custom Document" },
    ...(supportingDocuments.length > 0 ? [{ value: "SUPPORTING_DOC" as const, label: "Supporting Document" }] : []),
  ];

  function switchSource(next: Source) {
    if (next === source) return;
    setSource(next);
    setTemplateId("");
    setFile(null);
    setSupportingDocId("");
    setSelectedEmail("");
    setSelectedEmails(new Set());
  }

  function handleFileSelected(files: FileList | File[]) {
    const next = Array.from(files)[0];
    if (!next) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(next.type)) {
      toast.error("Only PDF, DOC, and DOCX files are supported.");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or smaller.");
      return;
    }
    setFile(next);
  }

  function toggleParticipant(email: string) {
    setSelectedEmails((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  const documentName =
    source === "TEMPLATE" ? selectedTemplate?.name ?? null
    : source === "CUSTOM_UPLOAD" ? file?.name ?? null
    : selectedSupportingDoc?.fileName ?? null;
  const signerNames =
    source === "TEMPLATE"
      ? eligibleParticipants.filter((p) => p.email === selectedEmail).map((p) => p.name)
      : eligibleParticipants.filter((p) => p.email && selectedEmails.has(p.email)).map((p) => p.name);
  const canSend = Boolean(documentName) && signerNames.length > 0 && !submitting;

  async function handleSend() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (source === "TEMPLATE") {
        const recipient = eligibleParticipants.find((p) => p.email === selectedEmail);
        if (!selectedTemplate || !recipient?.email) return;
        await sendMutation.mutateAsync({
          source: "TEMPLATE",
          templateId: selectedTemplate.templateId,
          templateName: selectedTemplate.name,
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          propertyReference: propertyReference ?? undefined,
          opportunityId,
        });
      } else {
        const recipients = eligibleParticipants
          .filter((p) => p.email && selectedEmails.has(p.email))
          .map((p) => ({ name: p.name, email: p.email as string, role: PARTICIPANT_ROLE_TO_RECIPIENT_ROLE[p.role] }));
        if (recipients.length === 0) return;

        if (source === "CUSTOM_UPLOAD") {
          if (!file) return;
          // Upload only now, at send time — cancelling earlier leaves no file behind.
          const uploaded = await uploadDocusignDocument(file);
          await sendMutation.mutateAsync({
            source: "CUSTOM_UPLOAD",
            documentStoragePath: uploaded.storagePath,
            documentFileName: uploaded.fileName,
            recipients,
            propertyReference: propertyReference ?? undefined,
            opportunityId,
          });
        } else {
          if (!selectedSupportingDoc) return;
          await sendMutation.mutateAsync({
            source: "CUSTOM_UPLOAD",
            opportunityDocumentId: selectedSupportingDoc.id,
            recipients,
            propertyReference: propertyReference ?? undefined,
            opportunityId,
          });
        }
      }
      toast.success("Envelope sent successfully");
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send envelope");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-6 py-5">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Send for Signature</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {hasActiveEnvelope && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#b45309]" />
              <p className="text-[12px] leading-5 text-[#92400e]" style={mont}>
                Another document on this opportunity is still awaiting signature. You can still send a new one — both will be tracked separately.
              </p>
            </div>
          )}

          {/* Source */}
          <div className="flex rounded-[10px] bg-[#f3f4f6] p-1">
            {sourceTabs.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => switchSource(value)}
                className={`flex-1 rounded-[8px] px-2 py-2 text-[12px] font-medium transition-colors ${
                  source === value ? "bg-white text-[#0d2138] shadow-sm" : "text-[#6a7282] hover:text-[#0d2138]"
                }`}
                style={mont}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Document */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Document</label>
            {source === "TEMPLATE" ? (
              <SearchableSelect
                size="sm"
                value={templateId}
                onChange={setTemplateId}
                options={templates.map((t) => ({ value: t.templateId, label: t.name }))}
                placeholder={templates.length ? "Select a template…" : "No templates found"}
                disabled={templates.length === 0}
              />
            ) : source === "SUPPORTING_DOC" ? (
              <>
                <SearchableSelect
                  size="sm"
                  value={supportingDocId}
                  onChange={setSupportingDocId}
                  options={supportingDocuments.map((d) => ({ value: d.id, label: `${d.fileName} (${fmtBytes(d.sizeBytes)})` }))}
                  placeholder="Select a supporting document…"
                />
                <p className="text-[11px] text-[#9ca3af]" style={mont}>
                  The selected file stays attached to this opportunity — sending creates a tracked DocuSign envelope from it.
                </p>
              </>
            ) : file ? (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 text-[#0d2138]">
                  <FileText size={16} className="shrink-0 text-[#1e4f86]" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={mont}>{file.name}</span>
                  <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtBytes(file.size)}</span>
                </div>
                <button type="button" onClick={() => setFile(null)} title="Remove" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-6 text-center transition-colors">
                <Upload size={22} className="text-[#9ca3af]" />
                <label className="cursor-pointer text-[12px] font-medium text-[#6b7280]" style={mont}>
                  Click to upload or drag and drop
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleFileSelected(e.target.files); e.target.value = ""; }}
                  />
                </label>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>PDF, DOC, DOCX up to 10MB — uploaded when you send</p>
              </div>
            )}
          </div>

          {/* Signers */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>
              {source === "TEMPLATE" ? "Signer" : "Signers"}
            </label>
            <p className="text-[11px] text-[#9ca3af]" style={mont}>
              {source === "TEMPLATE" ? "A DocuSign Template can only go to one signer." : "Select everyone who needs to sign."}
            </p>

            {eligibleParticipants.length === 0 ? (
              <p className="rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-4 text-[12px] text-[#6a7282]" style={mont}>
                No participants with an email on file. Add a participant with an email first, or send from the DocuSign page instead.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {participants.map((p, i) => {
                  const hasEmail = Boolean(p.email);
                  const selected = source === "TEMPLATE" ? selectedEmail === p.email : Boolean(p.email && selectedEmails.has(p.email));
                  return (
                    <button
                      key={`${p.email ?? "no-email"}-${i}`}
                      type="button"
                      disabled={!hasEmail}
                      onClick={() => {
                        if (!p.email) return;
                        if (source === "TEMPLATE") setSelectedEmail(p.email);
                        else toggleParticipant(p.email);
                      }}
                      className={`flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
                        !hasEmail
                          ? "cursor-not-allowed border-[#e5e7eb] bg-[#f8fafc] opacity-60"
                          : selected
                            ? "border-[#1e4f86] bg-[#eff6ff]"
                            : "border-[#e5e7eb] bg-white hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>{p.name}</span>
                        <span className="truncate text-[11px] text-[#6a7282]" style={mont}>
                          {p.email ?? "No email on file"} · {PARTICIPANT_ROLE_LABEL[p.role]}
                        </span>
                      </div>
                      {selected && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review — everything chosen, one last look before sending */}
          {documentName && signerNames.length > 0 && (
            <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc]">
              {[
                ["Document", documentName],
                ["Signers", signerNames.join(", ")],
                ["Opportunity", opportunityLabel],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <span className="shrink-0 text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                  <span className="min-w-0 text-right text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
            style={mont}
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
            style={mont}
          >
            {submitting ? "Sending…" : "Send for Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
