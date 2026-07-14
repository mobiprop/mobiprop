"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { DocusignTemplateSummary } from "@/lib/docusign";
import { EnvelopeRecipientRole } from "@/generated/prisma/enums";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type Source = "NONE" | "TEMPLATE" | "CUSTOM_UPLOAD";

export type ContractParticipantOption = {
  name: string;
  email: string | null;
  role: "BUYER" | "SELLER" | "AGENCY";
};

export type ContractSelection =
  | {
      source: "TEMPLATE";
      templateId: string;
      templateName: string;
      recipientName: string;
      recipientEmail: string;
      documentLabel: string;
      signerLabels: string[];
    }
  | {
      source: "CUSTOM_UPLOAD";
      file: File;
      recipients: { name: string; email: string; role: EnvelopeRecipientRole }[];
      documentLabel: string;
      signerLabels: string[];
    };

const PARTICIPANT_ROLE_TO_RECIPIENT_ROLE: Record<ContractParticipantOption["role"], EnvelopeRecipientRole> = {
  BUYER: EnvelopeRecipientRole.BUYER,
  SELLER: EnvelopeRecipientRole.SELLER,
  AGENCY: EnvelopeRecipientRole.THIRD_PARTY,
};

const PARTICIPANT_ROLE_LABEL: Record<ContractParticipantOption["role"], string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  AGENCY: "Agency",
};

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ContractSourcePickerProps = {
  participants: ContractParticipantOption[];
  templates: DocusignTemplateSummary[];
  disabled?: boolean;
  /** Prepends a "No Contract" tab, selected by default — used in the New Opportunity form. */
  allowNone?: boolean;
  onSelectionChange: (selection: ContractSelection | null) => void;
};

/**
 * Document-source + signer picker shared by SendOpportunityContractModal
 * (edit-mode, sends immediately) and AddOpportunityModal's create-mode
 * inline chooser (stages the choice, sent only after the Opportunity is
 * created). Owns its own source/document/signer state and reports the
 * resolved selection upward on every change — callers decide what to do
 * with it (send now, or defer).
 */
export function ContractSourcePicker({
  participants,
  templates,
  disabled,
  allowNone,
  onSelectionChange,
}: ContractSourcePickerProps) {
  const [source, setSource] = useState<Source>(allowNone ? "NONE" : "TEMPLATE");
  const [templateId, setTemplateId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedEmail, setSelectedEmail] = useState(""); // TEMPLATE — single signer
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set()); // CUSTOM_UPLOAD — multi
  const [isDragOver, setIsDragOver] = useState(false);

  const eligibleParticipants = participants.filter((p) => p.email);
  const selectedTemplate = templates.find((t) => t.templateId === templateId) ?? null;

  const documentName =
    source === "TEMPLATE" ? selectedTemplate?.name ?? null : source === "CUSTOM_UPLOAD" ? file?.name ?? null : null;
  const signerNames =
    source === "TEMPLATE"
      ? eligibleParticipants.filter((p) => p.email === selectedEmail).map((p) => p.name)
      : eligibleParticipants.filter((p) => p.email && selectedEmails.has(p.email)).map((p) => p.name);

  useEffect(() => {
    if (source === "NONE" || !documentName || signerNames.length === 0) {
      onSelectionChange(null);
      return;
    }
    if (source === "TEMPLATE") {
      const recipient = eligibleParticipants.find((p) => p.email === selectedEmail);
      if (!selectedTemplate || !recipient?.email) {
        onSelectionChange(null);
        return;
      }
      onSelectionChange({
        source: "TEMPLATE",
        templateId: selectedTemplate.templateId,
        templateName: selectedTemplate.name,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        documentLabel: documentName,
        signerLabels: signerNames,
      });
      return;
    }
    // CUSTOM_UPLOAD
    if (!file) {
      onSelectionChange(null);
      return;
    }
    const recipients = eligibleParticipants
      .filter((p) => p.email && selectedEmails.has(p.email))
      .map((p) => ({ name: p.name, email: p.email as string, role: PARTICIPANT_ROLE_TO_RECIPIENT_ROLE[p.role] }));
    if (recipients.length === 0) {
      onSelectionChange(null);
      return;
    }
    onSelectionChange({ source: "CUSTOM_UPLOAD", file, recipients, documentLabel: documentName, signerLabels: signerNames });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, templateId, file, selectedEmail, selectedEmails]);

  function switchSource(next: Source) {
    if (next === source) return;
    setSource(next);
    setTemplateId("");
    setFile(null);
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

  const sourceTabs: { value: Source; label: string }[] = [
    ...(allowNone ? [{ value: "NONE" as const, label: "No Contract" }] : []),
    { value: "TEMPLATE", label: "Use DocuSign Template" },
    { value: "CUSTOM_UPLOAD", label: "Upload Custom Contract Document" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Source */}
      <div className="flex rounded-[10px] bg-[#f3f4f6] p-1">
        {sourceTabs.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => switchSource(value)}
            className={`flex-1 rounded-[8px] px-2 py-2 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              source === value ? "bg-white text-[#0d2138] shadow-sm" : "text-[#6a7282] hover:text-[#0d2138]"
            }`}
            style={mont}
          >
            {label}
          </button>
        ))}
      </div>

      {source !== "NONE" && (
        <>
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
                disabled={disabled || templates.length === 0}
              />
            ) : file ? (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 text-[#0d2138]">
                  <FileText size={16} className="shrink-0 text-[#1e4f86]" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={mont}>{file.name}</span>
                  <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtBytes(file.size)}</span>
                </div>
                <button type="button" onClick={() => setFile(null)} disabled={disabled} title="Remove" className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36] disabled:cursor-not-allowed">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length) handleFileSelected(e.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  isDragOver ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-[#fafbfc]"
                }`}
              >
                <Upload size={22} className="text-[#9ca3af]" />
                <label className="cursor-pointer text-[12px] font-medium text-[#6b7280]" style={mont}>
                  Click to upload or drag and drop
                  <input
                    type="file"
                    disabled={disabled}
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleFileSelected(e.target.files); e.target.value = ""; }}
                  />
                </label>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>PDF, DOC, DOCX up to 10MB — uploaded when sent</p>
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
                No participants with an email on file. Add a participant with an email first.
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
                      disabled={!hasEmail || disabled}
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

          {/* Review — Document/Signers rows only; callers add their own context rows */}
          {documentName && signerNames.length > 0 && (
            <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc]">
              {[
                ["Document", documentName],
                ["Signers", signerNames.join(", ")],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <span className="shrink-0 text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                  <span className="min-w-0 text-right text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
