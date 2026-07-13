"use client";

import { useMemo, useState } from "react";
import { X, Check, Mail, Loader2, Send, Eye, Code, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import type { EmailCampaignDto, EmailListDto } from "@/features/integrations/sendgrid-actions";
import { MARKETING_TEMPLATES } from "@/features/integrations/email-marketing-templates";
import { useSendgridListsQuery } from "@/hooks/queries/useSendgridQuery";
import {
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
  useSendTestEmailMutation,
} from "@/hooks/mutations/useSendgridMutations";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const NEWSLETTER_SENDER = "mailing@ulrichpropiedades.com";

type WizardStep = 1 | 2 | 3;

type CampaignWizardModalProps = {
  /** Existing draft to edit; null/undefined for a brand-new campaign. */
  campaign?: EmailCampaignDto | null;
  /** Preselect a template (Templates tab → "Use Template"). */
  initialTemplateKey?: string;
  canSend: boolean;
  onClose: () => void;
};

function StepIndicator({ step, current, label }: { step: WizardStep; current: WizardStep; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
          done ? "bg-[#16a34a] text-white" : active ? "bg-[#1e4f86] text-white" : "bg-[#f3f4f6] text-[#9ca3af]"
        }`}
        style={mont}
      >
        {done ? <Check size={14} /> : step}
      </span>
      <span
        className={`truncate text-[13px] font-medium ${active || done ? (done ? "text-[#374151]" : "text-[#1e4f86]") : "text-[#9ca3af]"}`}
        style={mont}
      >
        {label}
      </span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>
        {label}
        {required && <span className="text-[#dc2626]"> *</span>}
      </span>
      {children}
    </div>
  );
}

const inputCls =
  "w-full min-h-[42px] rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none";

export function CampaignWizardModal({ campaign, initialTemplateKey, canSend, onClose }: CampaignWizardModalProps) {
  const isEdit = Boolean(campaign);
  // "Use Template" entry point: the template's content must be applied
  // immediately, not only when the card is re-clicked in step 1.
  const initialTemplate = !campaign && initialTemplateKey ? MARKETING_TEMPLATES.find((t) => t.key === initialTemplateKey) : undefined;
  const [step, setStep] = useState<WizardStep>(isEdit ? 2 : 1);
  const [templateKey, setTemplateKey] = useState<string>(campaign?.templateKey ?? initialTemplateKey ?? "");
  const [name, setName] = useState(campaign?.name ?? "");
  const [subject, setSubject] = useState(campaign?.subject ?? initialTemplate?.subject ?? "");
  const [previewText, setPreviewText] = useState(campaign?.previewText ?? initialTemplate?.previewText ?? "");
  const [fromName, setFromName] = useState(campaign?.fromName ?? "Ulrich Propiedades");
  const [listId, setListId] = useState(campaign?.listId ?? "");
  const [htmlBody, setHtmlBody] = useState(campaign?.htmlBody ?? initialTemplate?.html ?? "");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">(campaign?.scheduledAt ? "later" : "now");
  const [scheduleDate, setScheduleDate] = useState(campaign?.scheduledAt ? campaign.scheduledAt.slice(0, 10) : "");
  const [scheduleTime, setScheduleTime] = useState(campaign?.scheduledAt ? campaign.scheduledAt.slice(11, 16) : "");
  const [showPreview, setShowPreview] = useState(false);
  const [testEmails, setTestEmails] = useState("");
  const [savedId, setSavedId] = useState<string | null>(campaign?.id ?? null);
  const [confirm, setConfirm] = useState<{ recipientCount: number; listName: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const listsQuery = useSendgridListsQuery();
  const createMutation = useCreateCampaignMutation();
  const updateMutation = useUpdateCampaignMutation();
  const sendMutation = useSendCampaignMutation();
  const testMutation = useSendTestEmailMutation();

  const lists = useMemo(() => listsQuery.data?.lists ?? [], [listsQuery.data]);
  const selectedList: EmailListDto | undefined = lists.find((l) => l.id === listId);
  const subscribedCount = selectedList ? selectedList.memberCount - selectedList.unsubscribedCount - selectedList.bouncedCount : 0;

  const busy = createMutation.isPending || updateMutation.isPending || sendMutation.isPending;

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const template = MARKETING_TEMPLATES.find((t) => t.key === key);
    if (!template) return;
    // Only prefill fields the user hasn't already typed into.
    if (!subject) setSubject(template.subject);
    if (!previewText) setPreviewText(template.previewText);
    if (!htmlBody) setHtmlBody(template.html);
  }

  function validateConfigure(): string | null {
    if (!name.trim()) return "Campaign name is required.";
    if (!subject.trim()) return "Subject line is required.";
    if (!listId) return "Select an audience list.";
    if (!htmlBody.trim()) return "Email content is empty.";
    if (selectedList && subscribedCount <= 0) return "The selected audience has no subscribed recipients.";
    if (scheduleMode === "later") {
      if (!scheduleDate || !scheduleTime) return "Pick a date and time to schedule the send.";
      if (new Date(`${scheduleDate}T${scheduleTime}`).getTime() < Date.now() + 60_000) {
        return "Schedule time must be in the future.";
      }
    }
    return null;
  }

  /** Creates or updates the draft and returns its id. */
  async function saveDraft(): Promise<string | null> {
    if (!name.trim()) {
      setValidationError("Campaign name is required.");
      return null;
    }
    const input = {
      name,
      subject,
      previewText: previewText || null,
      fromName,
      htmlBody,
      templateKey: templateKey || null,
      listId: listId || null,
    };
    try {
      if (savedId) {
        await updateMutation.mutateAsync({ id: savedId, ...input });
        return savedId;
      }
      const created = await createMutation.mutateAsync(input);
      setSavedId(created.campaign.id);
      return created.campaign.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save campaign");
      return null;
    }
  }

  async function handleSaveDraft() {
    const id = await saveDraft();
    if (id) {
      toast.success("Draft saved");
      onClose();
    }
  }

  async function handleContinueFromConfigure() {
    const error = validateConfigure();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setStep(3);
  }

  async function handleSendTest() {
    const emails = testEmails.split(/[\s,;]+/).filter(Boolean);
    if (emails.length === 0) {
      toast.error("Enter at least one test email address");
      return;
    }
    const id = await saveDraft();
    if (!id) return;
    try {
      const result = await testMutation.mutateAsync({ id, emails });
      toast.success(`Test email sent to ${result.sentTo.join(", ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test send failed");
    }
  }

  async function handleSendClicked() {
    const error = validateConfigure();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    const id = await saveDraft();
    if (!id) return;

    // Server-side precheck: recipient count, sender/config readiness,
    // already-sent guard — surfaced before the human confirmation.
    try {
      const res = await fetch(`/api/dashboard/sendgrid/campaigns/${id}/precheck`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not verify campaign");
      if (!data.ready) {
        setValidationError(data.reason ?? "Campaign is not ready to send.");
        return;
      }
      setConfirm({ recipientCount: data.recipientCount, listName: data.listName ?? selectedList?.name ?? "—" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify campaign");
    }
  }

  async function handleConfirmedSend() {
    if (!savedId || sendMutation.isPending) return;
    const scheduleAt =
      scheduleMode === "later" ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : undefined;
    try {
      const result = await sendMutation.mutateAsync({ id: savedId, scheduleAt });
      toast.success(
        result.status === "SCHEDULED"
          ? `Campaign scheduled for ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}`
          : `Campaign sent to ${result.totalRecipients} recipient${result.totalRecipients === 1 ? "" : "s"}`,
      );
      onClose();
    } catch (err) {
      setConfirm(null);
      setValidationError(err instanceof Error ? err.message : "Send failed");
    }
  }

  const stepTitle = step === 1 ? "Select Template" : step === 2 ? "Configure Campaign" : "Review & Send";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>
                {isEdit ? "Edit Campaign" : "New Campaign"}
              </p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                Step {step} of 3 — {stepTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <StepIndicator step={1} current={step} label="Select Template" />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepIndicator step={2} current={step} label="Configure" />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepIndicator step={3} current={step} label="Review & Send" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                Choose an email template for this campaign
              </p>
              {MARKETING_TEMPLATES.map((template) => {
                const selected = templateKey === template.key;
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => applyTemplate(template.key)}
                    className={`flex items-center gap-4 rounded-[12px] border p-4 text-left transition-colors ${
                      selected ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-white hover:border-[#c9d6e5]"
                    }`}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                      <Mail size={18} className={selected ? "text-[#1e4f86]" : "text-[#6a7282]"} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={`text-[14px] font-semibold ${selected ? "text-[#1e4f86]" : "text-[#0d2138]"}`} style={mont}>
                        {template.name}
                      </span>
                      <span className="truncate text-[12px] text-[#6a7282]" style={mont}>
                        {template.subject || "Start from an empty layout"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-semibold text-[#1e4f86]" style={mont}>
                      Marketing
                    </span>
                    {selected && <Check size={18} className="shrink-0 text-[#1e4f86]" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                Configure your campaign settings and schedule
              </p>

              <Field label="Campaign Name" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. April New Listings Newsletter" className={inputCls} style={mont} />
              </Field>

              <Field label="Subject Line" required>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New Property Available" className={inputCls} style={mont} />
              </Field>

              <Field label="Preview Text">
                <input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short text shown after the subject in the inbox"
                  className={inputCls}
                  style={mont}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="From Name">
                  <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputCls} style={mont} />
                </Field>
                <Field label="From Email">
                  <input
                    value={NEWSLETTER_SENDER}
                    disabled
                    className={`${inputCls} cursor-not-allowed opacity-70`}
                    style={mont}
                    title="Campaigns always send from the dedicated marketing address"
                  />
                </Field>
              </div>

              <Field label="Audience List" required>
                <select value={listId} onChange={(e) => setListId(e.target.value)} className={inputCls} style={mont}>
                  <option value="">Select an audience…</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.memberCount - list.unsubscribedCount - list.bouncedCount} subscribed)
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Email Content" required>
                <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
                  <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafbfc] px-3 py-2">
                    <span className="text-[11px] text-[#6a7282]" style={mont}>
                      HTML — %first_name% is replaced per recipient; the unsubscribe footer is added automatically
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPreview((v) => !v)}
                      className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-medium text-[#1e4f86] hover:bg-[#eff6ff]"
                      style={mont}
                    >
                      {showPreview ? <Code size={12} /> : <Eye size={12} />}
                      {showPreview ? "Edit HTML" : "Preview"}
                    </button>
                  </div>
                  {showPreview ? (
                    <iframe
                      title="Email preview"
                      sandbox=""
                      srcDoc={htmlBody.replace(/%first_name%/g, "María")}
                      className="h-[320px] w-full bg-white"
                    />
                  ) : (
                    <textarea
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                      rows={12}
                      spellCheck={false}
                      className="w-full resize-y bg-white px-3.5 py-3 font-mono text-[12px] leading-5 text-[#0d2138] focus:outline-none"
                      placeholder="<table>…your email HTML…</table>"
                    />
                  )}
                </div>
              </Field>

              <Field label="Send Schedule">
                <div className="grid grid-cols-2 gap-3">
                  {(["now", "later"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScheduleMode(mode)}
                      className={`min-h-[46px] rounded-[10px] border px-4 text-left text-[13px] font-medium transition-colors ${
                        scheduleMode === mode ? "border-[#1e4f86] bg-[#eff6ff] text-[#1e4f86]" : "border-[#e5e7eb] bg-white text-[#374151]"
                      }`}
                      style={mont}
                    >
                      {mode === "now" ? "Send now" : "Schedule for later"}
                    </button>
                  ))}
                </div>
              </Field>

              {scheduleMode === "later" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Date" required>
                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={inputCls} style={mont} />
                  </Field>
                  <Field label="Time" required>
                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className={inputCls} style={mont} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                Review the details before sending
              </p>

              <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb]">
                {[
                  ["Campaign", name],
                  ["Template", MARKETING_TEMPLATES.find((t) => t.key === templateKey)?.name ?? "Custom"],
                  ["Subject", subject],
                  ["From", `${fromName} <${NEWSLETTER_SENDER}>`],
                  ["Audience", selectedList ? `${selectedList.name} (${subscribedCount} subscribed)` : "—"],
                  [
                    "Schedule",
                    scheduleMode === "now"
                      ? "Send immediately"
                      : scheduleDate && scheduleTime
                        ? `${scheduleDate} at ${scheduleTime}`
                        : "—",
                  ],
                ].map(([label, value], i) => (
                  <div key={label} className={`flex gap-4 px-4 py-3 ${i > 0 ? "border-t border-[#f3f4f6]" : ""}`}>
                    <span className="w-[110px] shrink-0 text-[13px] text-[#6a7282]" style={mont}>{label}</span>
                    <span className="min-w-0 flex-1 break-words text-[13px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-[12px] border border-[#dbeafe] bg-[#eff6ff] p-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1e4f86]" />
                <p className="text-[12px] leading-5 text-[#1e4f86]" style={mont}>
                  This campaign will be sent via SendGrid from {NEWSLETTER_SENDER}. Every recipient gets an
                  unsubscribe link automatically, and unsubscribed or bounced contacts are excluded. A campaign
                  can only be sent once — duplicate it to send again.
                </p>
              </div>

              {/* Test send */}
              <div className="flex flex-col gap-2 rounded-[12px] border border-[#e5e7eb] p-4">
                <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>Send a test first</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={testEmails}
                    onChange={(e) => setTestEmails(e.target.value)}
                    placeholder="you@example.com, colleague@example.com"
                    className={`${inputCls} flex-1`}
                    style={mont}
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testMutation.isPending || busy}
                    className="flex min-h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#1e4f86] px-4 text-[13px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50"
                    style={mont}
                  >
                    {testMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send Test
                  </button>
                </div>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>
                  Test emails are marked [Test], don&apos;t count toward metrics and don&apos;t mark the campaign as sent. Max 5 addresses.
                </p>
              </div>
            </div>
          )}

          {validationError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#dc2626]" />
              <p className="text-[12px] leading-5 text-[#dc2626]" style={mont}>{validationError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-[#e5e7eb] px-5 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as WizardStep)}
              disabled={busy}
              className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
              style={mont}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
            style={mont}
          >
            Cancel
          </button>
          <div className="flex-1" />
          {step >= 2 && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={busy}
              className="min-h-[42px] rounded-[10px] border border-[#1e4f86] px-5 text-[13px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] disabled:opacity-50"
              style={mont}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save Draft"}
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (!templateKey) {
                  setValidationError("Select a template to continue.");
                  return;
                }
                setValidationError(null);
                setStep(2);
              }}
              className="min-h-[42px] rounded-[10px] bg-[#1e4f86] px-8 text-[13px] font-medium text-white hover:bg-[#1b487a]"
              style={mont}
            >
              Continue
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleContinueFromConfigure}
              disabled={busy}
              className="min-h-[42px] rounded-[10px] bg-[#1e4f86] px-8 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:opacity-50"
              style={mont}
            >
              Continue
            </button>
          )}
          {step === 3 && canSend && (
            <button
              type="button"
              onClick={handleSendClicked}
              disabled={busy}
              className="flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-6 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
              style={mont}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {scheduleMode === "later" ? "Schedule Campaign" : "Send Campaign"}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation modal — the last gate before a real send */}
      {confirm && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => !sendMutation.isPending && setConfirm(null)} />
          <div className="relative z-10 flex w-full max-w-[440px] flex-col gap-4 rounded-[14px] bg-white p-6 shadow-xl">
            <p className="text-[16px] font-semibold text-[#0d2138]" style={poppins}>
              {scheduleMode === "later" ? "Schedule this campaign?" : "Send this campaign now?"}
            </p>
            <div className="flex flex-col gap-2 rounded-[10px] bg-[#f8fafc] p-4">
              {[
                ["Audience", confirm.listName],
                ["Recipients", `${confirm.recipientCount} subscribed contact${confirm.recipientCount === 1 ? "" : "s"}`],
                ["Sender", `${fromName} <${NEWSLETTER_SENDER}>`],
                ["Subject", subject],
                ...(scheduleMode === "later" ? [["Scheduled for", `${scheduleDate} at ${scheduleTime}`] as [string, string]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                  <span className="min-w-0 break-words text-right text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
              This action cannot be undone{scheduleMode === "later" ? " once the scheduled time arrives" : ""} — the
              campaign can only be sent once.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={sendMutation.isPending}
                className="min-h-[40px] rounded-[10px] border border-[#e5e7eb] px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
                style={mont}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedSend}
                disabled={sendMutation.isPending}
                className="flex min-h-[40px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-5 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60"
                style={mont}
              >
                {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sendMutation.isPending ? "Sending…" : scheduleMode === "later" ? "Confirm Schedule" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
