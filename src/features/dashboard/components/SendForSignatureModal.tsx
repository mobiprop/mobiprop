"use client";

import { useState } from "react";
import { X, Check, ShieldCheck, FileText, Upload, Plus, Trash2, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import type { DocusignTemplateSummary } from "@/lib/docusign";
import { EnvelopeRecipientRole } from "@/generated/prisma/enums";
import { useSendForSignatureMutation } from "@/hooks/mutations/useDocusignMutations";
import { uploadDocusignDocument } from "@/lib/client-upload";
import { SearchableSelect } from "./SearchableSelect";
import { ListingPicker } from "./ListingPicker";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const EXPIRY_VALUES = [7, 14, 30];
const ROLE_VALUES = [
  EnvelopeRecipientRole.BUYER,
  EnvelopeRecipientRole.SELLER,
  EnvelopeRecipientRole.AGENT,
  EnvelopeRecipientRole.THIRD_PARTY,
  EnvelopeRecipientRole.OTHER,
];

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Source = "TEMPLATE" | "CUSTOM_UPLOAD";
type Step = 0 | 1 | 2 | 3 | 4;

type CustomRecipient = {
  key: string;
  name: string;
  email: string;
  role: EnvelopeRecipientRole;
  roleLabel: string;
};

function newRecipient(): CustomRecipient {
  return { key: crypto.randomUUID(), name: "", email: "", role: EnvelopeRecipientRole.BUYER, roleLabel: "" };
}

type InitialParticipant = { name: string; email: string; role: "BUYER" | "SELLER" | "AGENCY" };

const PARTICIPANT_ROLE_TO_RECIPIENT_ROLE: Record<InitialParticipant["role"], EnvelopeRecipientRole> = {
  BUYER: EnvelopeRecipientRole.BUYER,
  SELLER: EnvelopeRecipientRole.SELLER,
  AGENCY: EnvelopeRecipientRole.THIRD_PARTY,
};

type SendForSignatureModalProps = {
  templates: DocusignTemplateSummary[];
  onClose: () => void;
  onSent: () => void;
  /** Pre-fills recipient/property fields — e.g. launched from an Opportunity. */
  initial?: {
    opportunityId?: string;
    recipientName?: string;
    recipientEmail?: string;
    propertyReference?: string;
    /** Opportunity Participants with a known email — offered as one-click recipients in the custom-upload flow instead of retyping. */
    participants?: InitialParticipant[];
  };
  /** Pre-select a template — e.g. launched via "Use Template" on the Templates tab. */
  initialTemplateId?: string;
};

export function SendForSignatureModal({ templates, onClose, onSent, initial, initialTemplateId }: SendForSignatureModalProps) {
  const { t } = useTranslation("docusign");
  const ROLE_OPTIONS = ROLE_VALUES.map((value) => ({ value, label: t(`sendModal.roleOptions.${value}`) }));
  const [source, setSource] = useState<Source | null>(initialTemplateId ? "TEMPLATE" : null);
  const [step, setStep] = useState<Step>(initialTemplateId ? 1 : 0);

  // Template-flow state
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [recipientEmail, setRecipientEmail] = useState(initial?.recipientEmail ?? "");

  // Custom-upload-flow state. The chosen file is staged in memory and only
  // uploaded to storage inside handleSend — cancelling or abandoning the
  // modal can never leave an orphaned file behind.
  const [file, setFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<CustomRecipient[]>([newRecipient()]);
  const [submitting, setSubmitting] = useState(false);

  // Shared state
  const [propertyReference, setPropertyReference] = useState(initial?.propertyReference ?? "");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [message, setMessage] = useState("");

  const sendMutation = useSendForSignatureMutation();

  const selectedTemplate = templates.find((t) => t.templateId === templateId) ?? null;
  const totalSteps = source === "CUSTOM_UPLOAD" ? 4 : 3;

  function chooseSource(next: Source) {
    setSource(next);
    setStep(1);
  }

  function goToTemplateSelect() {
    if (!templateId) {
      toast.error(t("sendModal.templateFlow.selectTemplateRequired"));
      return;
    }
    setStep(2);
  }

  function goToTemplateRecipient() {
    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error(t("sendModal.templateFlow.recipientRequired"));
      return;
    }
    setStep(3);
  }

  function handleFileSelected(files: FileList | File[]) {
    const next = Array.from(files)[0];
    if (!next) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(next.type)) {
      toast.error(t("sendModal.toasts.fileTypeError"));
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      toast.error(t("sendModal.toasts.fileSizeError"));
      return;
    }
    setFile(next);
  }

  function goToRecipients() {
    if (!file) {
      toast.error(t("sendModal.uploadFlow.documentRequired"));
      return;
    }
    setStep(2);
  }

  function addRecipient() {
    setRecipients((r) => [...r, newRecipient()]);
  }

  function removeRecipient(key: string) {
    setRecipients((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }

  function updateRecipient(key: string, patch: Partial<CustomRecipient>) {
    setRecipients((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  /** Fills the first blank row with this participant, or appends a new one — never duplicates an already-added email. */
  function addParticipantAsRecipient(p: InitialParticipant) {
    setRecipients((rows) => {
      if (rows.some((r) => r.email.trim().toLowerCase() === p.email.toLowerCase())) return rows;
      const filled: CustomRecipient = {
        key: crypto.randomUUID(),
        name: p.name,
        email: p.email,
        role: PARTICIPANT_ROLE_TO_RECIPIENT_ROLE[p.role],
        roleLabel: "",
      };
      const blankIdx = rows.findIndex((r) => !r.name.trim() && !r.email.trim());
      if (blankIdx >= 0) {
        const next = [...rows];
        next[blankIdx] = { ...filled, key: rows[blankIdx].key };
        return next;
      }
      return [...rows, filled];
    });
  }

  function goToDetails() {
    for (const r of recipients) {
      if (!r.name.trim() || !r.email.trim()) {
        toast.error(t("sendModal.uploadFlow.recipientDetailsRequired"));
        return;
      }
      if (r.role === EnvelopeRecipientRole.OTHER && !r.roleLabel.trim()) {
        toast.error(t("sendModal.uploadFlow.roleLabelRequired"));
        return;
      }
    }
    setStep(3);
  }

  async function handleSend() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (source === "TEMPLATE") {
        if (!selectedTemplate) return;
        await sendMutation.mutateAsync({
          source: "TEMPLATE",
          templateId: selectedTemplate.templateId,
          templateName: selectedTemplate.name,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          propertyReference: propertyReference.trim() || undefined,
          expiresInDays,
          message: message.trim() || undefined,
          opportunityId: initial?.opportunityId,
        });
      } else {
        if (!file) return;
        // Upload only now, at send time — an abandoned modal leaves nothing behind.
        const uploaded = await uploadDocusignDocument(file);
        await sendMutation.mutateAsync({
          source: "CUSTOM_UPLOAD",
          documentStoragePath: uploaded.storagePath,
          documentFileName: uploaded.fileName,
          recipients: recipients.map((r) => ({
            name: r.name.trim(),
            email: r.email.trim(),
            role: r.role,
            roleLabel: r.role === EnvelopeRecipientRole.OTHER ? r.roleLabel.trim() : undefined,
          })),
          propertyReference: propertyReference.trim() || undefined,
          expiresInDays,
          message: message.trim() || undefined,
          opportunityId: initial?.opportunityId,
        });
      }
      toast.success(t("sendModal.toasts.sent"));
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sendModal.toasts.sendFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = (
    source === "CUSTOM_UPLOAD"
      ? t("sendModal.stepLabels.custom", { returnObjects: true })
      : t("sendModal.stepLabels.template", { returnObjects: true })
  ) as unknown as string[];
  const stepLabel = stepLabels[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#e5e7eb] px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>{t("sendModal.title")}</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>
              {step === 0 ? stepLabel : t("sendModal.stepOf", { step, total: totalSteps, label: stepLabel })}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        {step > 0 && (
          <div className="flex shrink-0 items-center gap-2 px-6 py-4 border-b border-[#e5e7eb]">
            {Array.from({ length: totalSteps }, (_, i) => (i + 1) as Step).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    s < step ? "bg-[#00a63e] text-white" : s === step ? "bg-[#1e4f86] text-white" : "bg-[#e5e7eb] text-[#6a7282]"
                  }`}
                  style={mont}
                >
                  {s < step ? <Check size={13} /> : s}
                </span>
                <span className={`text-[12px] font-medium ${s <= step ? "text-[#0d2138]" : "text-[#9ca3af]"}`} style={mont}>
                  {stepLabels[s]}
                </span>
                {i < totalSteps - 1 && <span className={`h-px flex-1 ${s < step ? "bg-[#00a63e]" : "bg-[#e5e7eb]"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 0 — choose method */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.chooseMethod.prompt")}</p>
              <button
                type="button"
                onClick={() => chooseSource("TEMPLATE")}
                className="flex items-start gap-3 rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-4 text-left transition-colors hover:border-[#1e4f86] hover:bg-[#eff6ff]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[#1e4f86]"><FileText size={18} /></span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{t("sendModal.chooseMethod.templateTitle")}</span>
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.chooseMethod.templateDescription")}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => chooseSource("CUSTOM_UPLOAD")}
                className="flex items-start gap-3 rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-4 text-left transition-colors hover:border-[#1e4f86] hover:bg-[#eff6ff]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eff6ff] text-[#1e4f86]"><FileSignature size={18} /></span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{t("sendModal.chooseMethod.uploadTitle")}</span>
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.chooseMethod.uploadDescription")}</span>
                </span>
              </button>
            </div>
          )}

          {/* Template flow */}
          {source === "TEMPLATE" && step === 1 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.templateFlow.chooseTemplate")}</p>
              {templates.length === 0 && (
                <p className="rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-6 text-center text-[12px] text-[#6a7282]" style={mont}>
                  {t("sendModal.templateFlow.noTemplates")}
                </p>
              )}
              {templates.map((t) => (
                <button
                  key={t.templateId}
                  type="button"
                  onClick={() => setTemplateId(t.templateId)}
                  className={`flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
                    templateId === t.templateId ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-white hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>{t.name}</span>
                    {t.description && <span className="truncate text-[11px] text-[#6a7282]" style={mont}>{t.description}</span>}
                  </div>
                  {templateId === t.templateId && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-white">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {source === "TEMPLATE" && step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.templateFlow.enterDetails")}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("sendModal.templateFlow.recipientName")}</label>
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={t("sendModal.templateFlow.recipientNamePlaceholder")} className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("sendModal.templateFlow.recipientEmail")}</label>
                  <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder={t("sendModal.templateFlow.recipientEmailPlaceholder")} className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                </div>
              </div>
              <PropertyAndExpiry
                propertyReference={propertyReference}
                setPropertyReference={setPropertyReference}
                expiresInDays={expiresInDays}
                setExpiresInDays={setExpiresInDays}
                message={message}
                setMessage={setMessage}
              />
            </div>
          )}

          {source === "TEMPLATE" && step === 3 && selectedTemplate && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.prompt")}</p>
              <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb]">
                {[
                  [t("sendModal.review.template"), selectedTemplate.name],
                  [t("sendModal.review.recipient"), recipientName],
                  [t("sendModal.review.email"), recipientEmail],
                  [t("sendModal.review.property"), propertyReference || "—"],
                  [t("sendModal.review.expiresIn"), t("sendModal.review.expiresInDays", { count: expiresInDays })],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                    <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                  </div>
                ))}
              </div>
              <DisclosureBox />
            </div>
          )}

          {/* Custom-upload flow */}
          {source === "CUSTOM_UPLOAD" && step === 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.uploadFlow.uploadPrompt")}</p>

              {file && (
                <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 text-[#0d2138]">
                    <FileText size={16} className="shrink-0 text-[#1e4f86]" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={mont}>{file.name}</span>
                    <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtBytes(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    title={t("sendModal.uploadFlow.removeAria")}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#fb2c36]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {!file && (
                <div className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-[#e5e7eb] bg-[#fafbfc] px-4 py-8 text-center transition-colors">
                  <Upload size={24} className="text-[#9ca3af]" />
                  <label className="cursor-pointer text-[13px] font-medium text-[#6b7280]" style={mont}>
                    {t("sendModal.uploadFlow.dragDrop")}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) handleFileSelected(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>{t("sendModal.uploadFlow.uploadHint")}</p>
                </div>
              )}
            </div>
          )}

          {source === "CUSTOM_UPLOAD" && step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.uploadFlow.addSigners")}</p>

              {initial?.participants && initial.participants.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-[10px] bg-[#f8fafc] p-3">
                  <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>{t("sendModal.uploadFlow.fromOpportunity")}</span>
                  <div className="flex flex-wrap gap-2">
                    {initial.participants.map((p) => {
                      const added = recipients.some((r) => r.email.trim().toLowerCase() === p.email.toLowerCase());
                      return (
                        <button
                          key={p.email}
                          type="button"
                          disabled={added}
                          onClick={() => addParticipantAsRecipient(p)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                            added
                              ? "cursor-default border-[#e5e7eb] bg-white text-[#9ca3af]"
                              : "border-[#c2dcff] bg-white text-[#1e4f86] hover:bg-[#eff6ff]"
                          }`}
                          style={mont}
                        >
                          {added ? <Check size={12} /> : <Plus size={12} />} {p.name} · {t(`sendModal.uploadFlow.roleLabels.${p.role}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recipients.map((r, i) => (
                <div key={r.key} className="flex flex-col gap-2.5 rounded-[10px] border border-[#e5e7eb] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>{t("sendModal.uploadFlow.recipientLabel", { index: i + 1 })}</span>
                    {recipients.length > 1 && (
                      <button type="button" onClick={() => removeRecipient(r.key)} title={t("sendModal.uploadFlow.removeRecipientAria")} className="flex size-7 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-red-50 hover:text-[#fb2c36]">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={r.name} onChange={(e) => updateRecipient(r.key, { name: e.target.value })} placeholder={t("sendModal.uploadFlow.namePlaceholder")} className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                    <input type="email" value={r.email} onChange={(e) => updateRecipient(r.key, { email: e.target.value })} placeholder={t("sendModal.uploadFlow.emailPlaceholder")} className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SearchableSelect
                      size="sm"
                      searchable={false}
                      value={r.role}
                      onChange={(next) => updateRecipient(r.key, { role: next as EnvelopeRecipientRole })}
                      options={ROLE_OPTIONS}
                      placeholder={t("sendModal.uploadFlow.rolePlaceholder")}
                    />
                    {r.role === EnvelopeRecipientRole.OTHER && (
                      <input value={r.roleLabel} onChange={(e) => updateRecipient(r.key, { roleLabel: e.target.value })} placeholder={t("sendModal.uploadFlow.roleLabelPlaceholder")} className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addRecipient}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#c2dcff] bg-[#f5f9ff] px-4 py-2.5 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] transition-colors"
                style={mont}
              >
                <Plus size={14} /> {t("sendModal.uploadFlow.addRecipient")}
              </button>
            </div>
          )}

          {source === "CUSTOM_UPLOAD" && step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.uploadFlow.optionalMessageAndExpiry")}</p>
              <PropertyAndExpiry
                propertyReference={propertyReference}
                setPropertyReference={setPropertyReference}
                expiresInDays={expiresInDays}
                setExpiresInDays={setExpiresInDays}
                message={message}
                setMessage={setMessage}
              />
            </div>
          )}

          {source === "CUSTOM_UPLOAD" && step === 4 && file && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.prompt")}</p>
              <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.document")}</span>
                  <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{file.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.property")}</span>
                  <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{propertyReference || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.expiresIn")}</span>
                  <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{t("sendModal.review.expiresInDays", { count: expiresInDays })}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-[#6a7282]" style={mont}>{t("sendModal.review.recipients")}</span>
                <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb]">
                  {recipients.map((r) => (
                    <div key={r.key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{r.name}</span>
                        <span className="text-[11px] text-[#9ca3af]" style={mont}>{r.email}</span>
                      </div>
                      <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-medium text-[#1e4f86]" style={mont}>
                        {r.role === EnvelopeRecipientRole.OTHER ? r.roleLabel || t("sendModal.uploadFlow.otherFallback") : ROLE_OPTIONS.find((o) => o.value === r.role)?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <DisclosureBox />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-[#e5e7eb] px-6 py-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={submitting}
              className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              style={mont}
            >
              {t("sendModal.back")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
            style={mont}
          >
            {t("sendModal.cancel")}
          </button>
          <div className="flex-1" />
          {step > 0 && step < totalSteps && (
            <button
              type="button"
              onClick={
                source === "TEMPLATE"
                  ? step === 1 ? goToTemplateSelect : goToTemplateRecipient
                  : step === 1 ? goToRecipients : step === 2 ? goToDetails : () => setStep(4)
              }
              disabled={source === "CUSTOM_UPLOAD" && step === 1 && !file}
              className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
              style={mont}
            >
              {t("sendModal.continue")}
            </button>
          )}
          {step === totalSteps && step > 0 && (
            <button
              type="button"
              onClick={handleSend}
              disabled={submitting}
              className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
              style={mont}
            >
              {submitting ? t("sendModal.sending") : t("sendModal.send")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyAndExpiry({
  propertyReference,
  setPropertyReference,
  expiresInDays,
  setExpiresInDays,
  message,
  setMessage,
}: {
  propertyReference: string;
  setPropertyReference: (v: string) => void;
  expiresInDays: number;
  setExpiresInDays: (v: number) => void;
  message: string;
  setMessage: (v: string) => void;
}) {
  const { t } = useTranslation("docusign");
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("sendModal.propertyAndExpiry.propertyReference")}</label>
        <ListingPicker
          tone="neutral"
          value={propertyReference ? "selected" : ""}
          label={propertyReference}
          onSelect={(_id, label) => setPropertyReference(label)}
          placeholder={t("sendModal.propertyAndExpiry.propertySearchPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("sendModal.propertyAndExpiry.expiryPeriod")}</label>
        <SearchableSelect
          size="sm"
          searchable={false}
          value={String(expiresInDays)}
          onChange={(next) => setExpiresInDays(Number(next))}
          options={EXPIRY_VALUES.map((value) => ({ value: String(value), label: t(`sendModal.expiryOptions.${value}`) }))}
          placeholder={t("sendModal.propertyAndExpiry.expiryPeriod")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("sendModal.propertyAndExpiry.personalMessage")}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("sendModal.propertyAndExpiry.messagePlaceholder")}
          rows={3}
          className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] resize-none"
          style={mont}
        />
      </div>
    </>
  );
}

function DisclosureBox() {
  const { t } = useTranslation("docusign");
  return (
    <div className="flex items-start gap-2.5 rounded-[10px] bg-[#eff6ff] px-4 py-3">
      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#1e4f86]" />
      <p className="text-[12px] leading-5 text-[#1e4f86]" style={mont}>
        {t("sendModal.disclosure")}
      </p>
    </div>
  );
}
