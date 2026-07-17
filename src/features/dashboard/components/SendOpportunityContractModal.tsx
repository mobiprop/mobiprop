"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useSendForSignatureMutation } from "@/hooks/mutations/useDocusignMutations";
import { uploadDocusignDocument } from "@/lib/client-upload";
import type { DocusignTemplateSummary } from "@/lib/docusign";
import { ContractSourcePicker, type ContractParticipantOption, type ContractSelection } from "./ContractSourcePicker";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type SendOpportunityContractModalProps = {
  opportunityId: string;
  /** Human-readable label for the review summary, e.g. "OPP-0042 — Beach house sale". */
  opportunityLabel: string;
  /** Auto-derived from the Opportunity's first linked listing — never asked for. */
  propertyReference: string | null;
  participants: ContractParticipantOption[];
  /** True when another envelope on this opportunity is still awaiting signature — shows a warning, never blocks. */
  hasActiveEnvelope: boolean;
  templates: DocusignTemplateSummary[];
  onClose: () => void;
  onSent: () => void;
};

/**
 * Simplified, single-screen "Add Contract / Send for Signature" for use from
 * inside an Opportunity — no wizard, no re-typing recipient/property details
 * the Opportunity already has. Distinct from SendForSignatureModal (the
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
  hasActiveEnvelope,
  templates,
  onClose,
  onSent,
}: SendOpportunityContractModalProps) {
  const { t } = useTranslation("opportunities");
  const [selection, setSelection] = useState<ContractSelection | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sendMutation = useSendForSignatureMutation();

  async function handleSend() {
    if (!selection || submitting) return;
    setSubmitting(true);
    try {
      if (selection.source === "TEMPLATE") {
        await sendMutation.mutateAsync({
          source: "TEMPLATE",
          templateId: selection.templateId,
          templateName: selection.templateName,
          recipientName: selection.recipientName,
          recipientEmail: selection.recipientEmail,
          propertyReference: propertyReference ?? undefined,
          opportunityId,
        });
      } else {
        // Upload only now, at send time — cancelling earlier leaves no file behind.
        const uploaded = await uploadDocusignDocument(selection.file);
        await sendMutation.mutateAsync({
          source: "CUSTOM_UPLOAD",
          documentStoragePath: uploaded.storagePath,
          documentFileName: uploaded.fileName,
          recipients: selection.recipients,
          propertyReference: propertyReference ?? undefined,
          opportunityId,
        });
      }
      toast.success(t("sendContractModal.toasts.sent"));
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sendContractModal.toasts.sendFailed"));
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
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>{t("sendContractModal.title")}</p>
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
                {t("sendContractModal.activeEnvelopeWarning")}
              </p>
            </div>
          )}

          <ContractSourcePicker
            participants={participants}
            templates={templates}
            disabled={submitting}
            onSelectionChange={setSelection}
          />

          {selection && (
            <div className="flex items-start justify-between gap-4 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2.5">
              <span className="shrink-0 text-[12px] text-[#6a7282]" style={mont}>{t("sendContractModal.opportunityLabel")}</span>
              <span className="min-w-0 text-right text-[12px] font-semibold text-[#0d2138]" style={mont}>{opportunityLabel}</span>
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
            {t("sendContractModal.cancel")}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSend}
            disabled={!selection || submitting}
            className="h-10 px-5 rounded-[10px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
            style={mont}
          >
            {submitting ? t("sendContractModal.sending") : t("sendContractModal.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
