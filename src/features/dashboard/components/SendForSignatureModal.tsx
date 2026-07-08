"use client";

import { useState } from "react";
import { X, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import type { DocusignTemplateSummary } from "@/lib/docusign";
import { useSendForSignatureMutation } from "@/hooks/mutations/useDocusignMutations";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days from today" },
  { value: 14, label: "14 days from today" },
  { value: 30, label: "30 days from today" },
];

type Step = 1 | 2 | 3;

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
  };
  /** Pre-select a template — e.g. launched via "Use Template" on the Templates tab. */
  initialTemplateId?: string;
};

export function SendForSignatureModal({ templates, onClose, onSent, initial, initialTemplateId }: SendForSignatureModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [recipientEmail, setRecipientEmail] = useState(initial?.recipientEmail ?? "");
  const [propertyReference, setPropertyReference] = useState(initial?.propertyReference ?? "");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [message, setMessage] = useState("");

  const sendMutation = useSendForSignatureMutation();

  const selectedTemplate = templates.find((t) => t.templateId === templateId) ?? null;

  function goToStep2() {
    if (!templateId) {
      toast.error("Select a template to continue.");
      return;
    }
    setStep(2);
  }

  function goToStep3() {
    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error("Recipient name and email are required.");
      return;
    }
    setStep(3);
  }

  async function handleSend() {
    if (!selectedTemplate) return;
    try {
      await sendMutation.mutateAsync({
        templateId: selectedTemplate.templateId,
        templateName: selectedTemplate.name,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        propertyReference: propertyReference.trim() || undefined,
        expiresInDays,
        message: message.trim() || undefined,
        opportunityId: initial?.opportunityId,
      });
      toast.success("Envelope sent successfully");
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send envelope");
    }
  }

  const stepLabel = step === 1 ? "Select Template" : step === 2 ? "Recipient Details" : "Review & Send";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#e5e7eb] px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Send for Signature</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>Step {step} of 3 — {stepLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex shrink-0 items-center gap-2 px-6 py-4 border-b border-[#e5e7eb]">
          {([1, 2, 3] as Step[]).map((s, i) => (
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
                {s === 1 ? "Select Template" : s === 2 ? "Recipient Details" : "Review & Send"}
              </span>
              {i < 2 && <span className={`h-px flex-1 ${s < step ? "bg-[#00a63e]" : "bg-[#e5e7eb]"}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[12px] text-[#6a7282]" style={mont}>Choose a template to send for signature</p>
              {templates.length === 0 && (
                <p className="rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-6 text-center text-[12px] text-[#6a7282]" style={mont}>
                  No templates found. Create templates in your DocuSign account first.
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

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>Enter the recipient and property details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Recipient Full Name *</label>
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Carlos Martinez" className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Recipient Email *</label>
                  <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="recipient@email.com" className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Property Reference</label>
                <input value={propertyReference} onChange={(e) => setPropertyReference(e.target.value)} placeholder="e.g. Palermo Alto, Apt 4B" className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86]" style={mont} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Expiry Period</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86] bg-white"
                  style={mont}
                >
                  {EXPIRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Personal Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please review and sign the attached document at your earliest convenience…"
                  rows={3}
                  className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] resize-none"
                  style={mont}
                />
              </div>
            </div>
          )}

          {step === 3 && selectedTemplate && (
            <div className="flex flex-col gap-4">
              <p className="text-[12px] text-[#6a7282]" style={mont}>Review the details before sending</p>
              <div className="flex flex-col divide-y divide-[#e5e7eb] rounded-[10px] border border-[#e5e7eb]">
                {[
                  ["Template", selectedTemplate.name],
                  ["Recipient", recipientName],
                  ["Email", recipientEmail],
                  ["Property", propertyReference || "—"],
                  ["Expires in", `${expiresInDays} days`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                    <span className="text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 rounded-[10px] bg-[#eff6ff] px-4 py-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#1e4f86]" />
                <p className="text-[12px] leading-5 text-[#1e4f86]" style={mont}>
                  This document will be sent via DocuSign. The recipient will receive a secure signing link. You will be notified once all parties have signed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-[#e5e7eb] px-6 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={sendMutation.isPending}
              className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              style={mont}
            >
              Back
            </button>
          )}
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
          {step < 3 ? (
            <button
              type="button"
              onClick={step === 1 ? goToStep2 : goToStep3}
              className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
              style={mont}
            >
              {sendMutation.isPending ? "Sending…" : "Send for Signature"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
