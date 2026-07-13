"use client";

import { useState } from "react";
import { X, Check, FileText, Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { DocusignTemplateSummary } from "@/lib/docusign";
import { EnvelopeRecipientRole } from "@/generated/prisma/enums";
import { useSendForSignatureMutation } from "@/hooks/mutations/useDocusignMutations";
import { uploadDocusignDocument } from "@/lib/client-upload";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type Source = "TEMPLATE" | "CUSTOM_UPLOAD";

type OpportunityParticipantOption = {
  name: string;
  email: string | null;
  role: "BUYER" | "SELLER" | "AGENCY";
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
  /** Auto-derived from the Opportunity's first linked listing — never asked for. */
  propertyReference: string | null;
  participants: OpportunityParticipantOption[];
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
 */
export function SendOpportunityContractModal({
  opportunityId,
  propertyReference,
  participants,
  templates,
  onClose,
  onSent,
}: SendOpportunityContractModalProps) {
  const [source, setSource] = useState<Source>("TEMPLATE");
  const [templateId, setTemplateId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [document, setDocument] = useState<{ storagePath: string; fileName: string; size: number } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState(""); // TEMPLATE — single
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set()); // CUSTOM_UPLOAD — multi

  const sendMutation = useSendForSignatureMutation();

  const eligibleParticipants = participants.filter((p) => p.email);
  const selectedTemplate = templates.find((t) => t.templateId === templateId) ?? null;

  function switchSource(next: Source) {
    if (next === source) return;
    setSource(next);
    setTemplateId("");
    setDocument(null);
    setSelectedEmail("");
    setSelectedEmails(new Set());
  }

  async function handleFileSelected(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, DOC, and DOCX files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadDocusignDocument(file);
      setDocument({ storagePath: uploaded.storagePath, fileName: uploaded.fileName, size: file.size });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  function toggleParticipant(email: string) {
    setSelectedEmails((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  const documentReady = source === "TEMPLATE" ? Boolean(selectedTemplate) : Boolean(document);
  const signersReady = source === "TEMPLATE" ? Boolean(selectedEmail) : selectedEmails.size > 0;
  const canSend = documentReady && signersReady && !sendMutation.isPending;

  async function handleSend() {
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
        if (!document) return;
        const recipients = eligibleParticipants
          .filter((p) => p.email && selectedEmails.has(p.email))
          .map((p) => ({ name: p.name, email: p.email as string, role: PARTICIPANT_ROLE_TO_RECIPIENT_ROLE[p.role] }));
        if (recipients.length === 0) return;
        await sendMutation.mutateAsync({
          source: "CUSTOM_UPLOAD",
          documentStoragePath: document.storagePath,
          documentFileName: document.fileName,
          recipients,
          propertyReference: propertyReference ?? undefined,
          opportunityId,
        });
      }
      toast.success("Envelope sent successfully");
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send envelope");
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
          {/* Source */}
          <div className="flex rounded-[10px] bg-[#f3f4f6] p-1">
            {([
              ["TEMPLATE", "DocuSign Template"],
              ["CUSTOM_UPLOAD", "Upload Custom Contract"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchSource(value)}
                className={`flex-1 rounded-[8px] py-2 text-[12px] font-medium transition-colors ${
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
            ) : document ? (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 text-[#0d2138]">
                  <FileText size={16} className="shrink-0 text-[#1e4f86]" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={mont}>{document.fileName}</span>
                  <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtBytes(document.size)}</span>
                </div>
                <button type="button" onClick={() => setDocument(null)} title="Remove" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-6 text-center transition-colors">
                {uploading ? <Loader2 size={22} className="animate-spin text-[#1e4f86]" /> : <Upload size={22} className="text-[#9ca3af]" />}
                <label className="cursor-pointer text-[12px] font-medium text-[#6b7280]" style={mont}>
                  Click to upload or drag and drop
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => { if (e.target.files?.length) handleFileSelected(e.target.files); e.target.value = ""; }}
                  />
                </label>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>PDF, DOC, DOCX up to 10MB</p>
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
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-[#e5e7eb] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={sendMutation.isPending}
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
            {sendMutation.isPending ? "Sending…" : "Send for Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
