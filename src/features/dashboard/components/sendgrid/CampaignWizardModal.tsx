"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, Mail, Loader2, Send, Eye, Code, ShieldCheck, AlertTriangle, Home } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import type { EmailCampaignDto, EmailListDto } from "@/features/integrations/sendgrid-actions";
import {
  MARKETING_TEMPLATES,
  PROPERTIES_BLOCK_RE,
  parsePropertiesBlockIds,
  replacePropertiesBlock,
  parseMessageText,
  replaceMessageBlock,
  parseImageUrl,
  replaceImageBlock,
  parseCta,
  replaceCtaBlock,
  type EmailListingCard,
} from "@/features/integrations/email-marketing-templates";
import { useSendgridListsQuery } from "@/hooks/queries/useSendgridQuery";
import {
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
  useSendTestEmailMutation,
} from "@/hooks/mutations/useSendgridMutations";
import { ListingPicker } from "@/features/dashboard/components/ListingPicker";
import { SearchableSelect } from "@/features/dashboard/components/SearchableSelect";

async function fetchListingCards(ids: string[]): Promise<EmailListingCard[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/api/dashboard/sendgrid/listing-cards?ids=${ids.join(",")}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load properties");
  return data.cards as EmailListingCard[];
}

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
  const { t } = useTranslation("sendgrid");
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
  // "Simple" is a plain-text-box editor (message, banner image link, CTA
  // button) for non-technical staff; "html" is the original raw editor.
  // Only offered when the template carries the marker blocks simple mode
  // reads/writes — hand-written HTML without them just gets the raw editor.
  const [editorMode, setEditorMode] = useState<"simple" | "html">("simple");
  const [testEmails, setTestEmails] = useState("");
  const [savedId, setSavedId] = useState<string | null>(campaign?.id ?? null);
  const [confirm, setConfirm] = useState<{ recipientCount: number; listName: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Listings featured in the email's PROPERTIES block (dynamic template content).
  const [featured, setFeatured] = useState<EmailListingCard[]>([]);
  // Starts true when an opened draft has featured ids to rehydrate (the effect
  // below fetches them), so the section shows its loading row immediately.
  const [featuredLoading, setFeaturedLoading] = useState<boolean>(() =>
    Boolean(campaign && (parsePropertiesBlockIds(campaign.htmlBody)?.length ?? 0) > 0),
  );

  const listsQuery = useSendgridListsQuery();
  const createMutation = useCreateCampaignMutation();
  const updateMutation = useUpdateCampaignMutation();
  const sendMutation = useSendCampaignMutation();
  const testMutation = useSendTestEmailMutation();

  const lists = useMemo(() => listsQuery.data?.lists ?? [], [listsQuery.data]);
  const selectedList: EmailListDto | undefined = lists.find((l) => l.id === listId);
  const subscribedCount = selectedList ? selectedList.memberCount - selectedList.unsubscribedCount - selectedList.bouncedCount : 0;

  const busy = createMutation.isPending || updateMutation.isPending || sendMutation.isPending;

  const hasPropertiesBlock = PROPERTIES_BLOCK_RE.test(htmlBody);
  const messageText = parseMessageText(htmlBody);
  const imageUrl = parseImageUrl(htmlBody);
  const cta = parseCta(htmlBody);
  const hasSimpleFields = messageText !== null;

  function updateMessage(text: string) {
    setHtmlBody((body) => replaceMessageBlock(body, text));
  }
  function updateImageUrl(url: string) {
    setHtmlBody((body) => replaceImageBlock(body, url));
  }
  function updateCtaLabel(label: string) {
    setHtmlBody((body) => replaceCtaBlock(body, label, cta?.url ?? ""));
  }
  function updateCtaUrl(url: string) {
    setHtmlBody((body) => replaceCtaBlock(body, cta?.label ?? "", url));
  }

  // Reopening a draft: the featured-listing ids ride in the PROPERTIES marker —
  // rehydrate the picker chips (and refresh the cards' data) from them.
  useEffect(() => {
    const ids = campaign ? parsePropertiesBlockIds(campaign.htmlBody) : null;
    if (!ids || ids.length === 0) return;
    fetchListingCards(ids)
      .then((cards) => setFeatured(cards))
      .catch(() => toast.error("Could not load this campaign's featured properties"))
      .finally(() => setFeaturedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per opened campaign
  }, [campaign?.id]);

  /** Re-renders the PROPERTIES block in the body for a new selection. */
  async function updateFeatured(ids: string[]) {
    setFeaturedLoading(true);
    try {
      const cards = await fetchListingCards(ids);
      setFeatured(cards);
      setHtmlBody((body) => replacePropertiesBlock(body, cards));
    } catch {
      toast.error(t("wizard.toasts.updatePropertiesFailed"));
    } finally {
      setFeaturedLoading(false);
    }
  }

  /** True when a field still holds another template's pristine value (or is
   *  empty) — safe to overwrite when the user picks a different template. */
  const isPristine = {
    subject: !subject || MARKETING_TEMPLATES.some((t) => t.subject === subject),
    previewText: !previewText || MARKETING_TEMPLATES.some((t) => t.previewText === previewText),
    htmlBody: !htmlBody || MARKETING_TEMPLATES.some((t) => t.html === htmlBody),
  };

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const template = MARKETING_TEMPLATES.find((t) => t.key === key);
    if (!template) return;
    // Overwrite untouched fields so switching templates in step 1 really
    // switches the email; hand-edited content is never clobbered.
    if (isPristine.subject) setSubject(template.subject);
    if (isPristine.previewText) setPreviewText(template.previewText);
    if (isPristine.htmlBody) {
      setHtmlBody(template.html);
      setFeatured([]);
    }
  }

  function validateConfigure(): string | null {
    if (!name.trim()) return t("wizard.validation.nameRequired");
    if (!subject.trim()) return t("wizard.validation.subjectRequired");
    if (!listId) return t("wizard.validation.selectAudience");
    if (!htmlBody.trim()) return t("wizard.validation.contentEmpty");
    if (hasPropertiesBlock && (parsePropertiesBlockIds(htmlBody)?.length ?? 0) === 0) {
      return t("wizard.validation.selectProperty");
    }
    if (selectedList && subscribedCount <= 0) return t("wizard.validation.noSubscribedRecipients");
    if (scheduleMode === "later") {
      if (!scheduleDate || !scheduleTime) return t("wizard.validation.pickDateTime");
      if (new Date(`${scheduleDate}T${scheduleTime}`).getTime() < Date.now() + 60_000) {
        return t("wizard.validation.scheduleInFuture");
      }
    }
    return null;
  }

  /** Creates or updates the draft and returns its id. */
  async function saveDraft(): Promise<string | null> {
    if (!name.trim()) {
      setValidationError(t("wizard.validation.nameRequired"));
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
    } catch {
      toast.error(t("wizard.toasts.saveFailed"));
      return null;
    }
  }

  async function handleSaveDraft() {
    const id = await saveDraft();
    if (id) {
      toast.success(t("wizard.toasts.draftSaved"));
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
      toast.error(t("wizard.toasts.enterTestEmail"));
      return;
    }
    const id = await saveDraft();
    if (!id) return;
    try {
      const result = await testMutation.mutateAsync({ id, emails });
      toast.success(t("wizard.toasts.testSent", { emails: result.sentTo.join(", ") }));
    } catch {
      toast.error(t("wizard.toasts.testSendFailed"));
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
      if (!res.ok) throw new Error(data.error ?? t("wizard.toasts.verifyFailed"));
      if (!data.ready) {
        setValidationError(data.reason ?? t("wizard.validation.notReady"));
        return;
      }
      setConfirm({ recipientCount: data.recipientCount, listName: data.listName ?? selectedList?.name ?? "—" });
    } catch {
      toast.error(t("wizard.toasts.verifyFailed"));
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
          ? t("wizard.toasts.scheduledFor", { date: new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString() })
          : t("wizard.toasts.sentTo", { count: result.totalRecipients }),
      );
      onClose();
    } catch {
      setConfirm(null);
      setValidationError(t("wizard.toasts.sendFailed"));
    }
  }

  const stepTitle = step === 1 ? t("wizard.stepLabels.selectTemplate") : step === 2 ? t("wizard.stepLabels.configure") : t("wizard.stepLabels.reviewSend");

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
                {isEdit ? t("wizard.editTitle") : t("wizard.newTitle")}
              </p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {t("wizard.stepOf", { step, label: stepTitle })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("wizard.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <StepIndicator step={1} current={step} label={t("wizard.stepLabels.selectTemplate")} />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepIndicator step={2} current={step} label={t("wizard.stepLabels.configure")} />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepIndicator step={3} current={step} label={t("wizard.stepLabels.reviewSend")} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                {t("wizard.step1.prompt")}
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
                        {template.subject || t("wizard.step1.emptyLayout")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-semibold text-[#1e4f86]" style={mont}>
                      {t("wizard.step1.marketingBadge")}
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
                {t("wizard.step2.prompt")}
              </p>

              <Field label={t("wizard.step2.campaignName")} required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("wizard.step2.campaignNamePlaceholder")} className={inputCls} style={mont} />
              </Field>

              <Field label={t("wizard.step2.subjectLine")} required>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("wizard.step2.subjectLinePlaceholder")} className={inputCls} style={mont} />
              </Field>

              <Field label={t("wizard.step2.previewText")}>
                <input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder={t("wizard.step2.previewTextPlaceholder")}
                  className={inputCls}
                  style={mont}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("wizard.step2.fromName")}>
                  <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputCls} style={mont} />
                </Field>
                <Field label={t("wizard.step2.fromEmail")}>
                  <input
                    value={NEWSLETTER_SENDER}
                    disabled
                    className={`${inputCls} cursor-not-allowed opacity-70`}
                    style={mont}
                    title={t("wizard.step2.fromEmailTitle")}
                  />
                </Field>
              </div>

              <Field label={t("wizard.step2.audienceList")} required>
                <SearchableSelect
                  searchable={false}
                  value={listId}
                  onChange={setListId}
                  placeholder={t("wizard.step2.audiencePlaceholder")}
                  options={lists.map((list) => ({
                    value: list.id,
                    label: `${list.name} (${list.memberCount - list.unsubscribedCount - list.bouncedCount} ${t("wizard.step2.audienceOptionSubscribed")})`,
                  }))}
                />
              </Field>

              <Field label={t("wizard.step2.emailContent")} required>
                <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
                  <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafbfc] px-3 py-2">
                    {hasSimpleFields && !showPreview ? (
                      <div className="flex items-center gap-1 rounded-[8px] bg-[#f3f4f6] p-0.5">
                        {(["simple", "html"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setEditorMode(mode)}
                            className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              editorMode === mode ? "bg-white text-[#1e4f86] shadow-sm" : "text-[#6a7282]"
                            }`}
                            style={mont}
                          >
                            {mode === "simple" ? t("wizard.step2.simple") : t("wizard.step2.html")}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#6a7282]" style={mont}>
                        {t("wizard.step2.htmlNote")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPreview((v) => !v)}
                      className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-medium text-[#1e4f86] hover:bg-[#eff6ff]"
                      style={mont}
                    >
                      {showPreview ? <Code size={12} /> : <Eye size={12} />}
                      {showPreview ? (editorMode === "simple" && hasSimpleFields ? t("wizard.step2.editContent") : t("wizard.step2.editHtml")) : t("wizard.step2.preview")}
                    </button>
                  </div>
                  {showPreview ? (
                    <iframe
                      title={t("wizard.step2.emailPreviewTitle")}
                      sandbox=""
                      srcDoc={htmlBody.replace(/%first_name%/g, "María").replace(/%unsubscribe_url%/g, "#")}
                      className="h-[420px] w-full bg-white"
                    />
                  ) : hasSimpleFields && editorMode === "simple" ? (
                    <div className="flex flex-col gap-4 bg-white p-3.5">
                      <Field label={t("wizard.step2.messageLabel")}>
                        <textarea
                          value={messageText ?? ""}
                          onChange={(e) => updateMessage(e.target.value)}
                          rows={4}
                          className="w-full resize-y rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3 text-[13px] leading-5 text-[#0d2138] focus:border-[#1e4f86] focus:outline-none"
                          style={mont}
                          placeholder={t("wizard.step2.messagePlaceholder")}
                        />
                      </Field>
                      <Field label={t("wizard.step2.bannerImageLabel")}>
                        <input
                          value={imageUrl ?? ""}
                          onChange={(e) => updateImageUrl(e.target.value)}
                          placeholder={t("wizard.step2.bannerImagePlaceholder")}
                          className={inputCls}
                          style={mont}
                        />
                      </Field>
                      {cta && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label={t("wizard.step2.buttonText")}>
                            <input
                              value={cta.label}
                              onChange={(e) => updateCtaLabel(e.target.value)}
                              className={inputCls}
                              style={mont}
                            />
                          </Field>
                          <Field label={t("wizard.step2.buttonLink")}>
                            <input
                              value={cta.url}
                              onChange={(e) => updateCtaUrl(e.target.value)}
                              placeholder={t("wizard.step2.buttonLinkPlaceholder")}
                              className={inputCls}
                              style={mont}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
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

              {hasPropertiesBlock && (
                <Field label={t("wizard.step2.featuredProperties")}>
                  <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] p-3.5">
                    <p className="text-[11px] text-[#6a7282]" style={mont}>
                      {t("wizard.step2.featuredPropertiesHint")}
                    </p>
                    <ListingPicker
                      value=""
                      label=""
                      tone="neutral"
                      placeholder={t("wizard.step2.featuredSearchPlaceholder")}
                      excludeIds={featured.map((c) => c.id)}
                      disabled={featuredLoading || featured.length >= 12}
                      onSelect={(id) => void updateFeatured([...featured.map((c) => c.id), id])}
                    />
                    {featuredLoading && (
                      <span className="flex items-center gap-1.5 text-[11px] text-[#6a7282]" style={mont}>
                        <Loader2 size={11} className="animate-spin" /> {t("wizard.step2.updatingProperties")}
                      </span>
                    )}
                    {featured.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {featured.map((card) => (
                          <div key={card.id} className="flex items-center gap-2.5 rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2">
                            <Home size={13} className="shrink-0 text-[#1e4f86]" />
                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0d2138]" style={mont}>
                              {card.listingId} — {card.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-[#6a7282]" style={mont}>{card.priceLabel}</span>
                            <button
                              type="button"
                              aria-label={t("wizard.step2.removeAria", { title: card.title })}
                              onClick={() => void updateFeatured(featured.filter((c) => c.id !== card.id).map((c) => c.id))}
                              className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[#9ca3af] hover:bg-[#fff1f2] hover:text-[#dc2626]"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !featuredLoading && (
                        <span className="text-[11px] text-[#9ca3af]" style={mont}>
                          {t("wizard.step2.noPropertiesSelected")}
                        </span>
                      )
                    )}
                  </div>
                </Field>
              )}

              <Field label={t("wizard.step2.sendSchedule")}>
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
                      {mode === "now" ? t("wizard.step2.sendNow") : t("wizard.step2.scheduleForLater")}
                    </button>
                  ))}
                </div>
              </Field>

              {scheduleMode === "later" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t("wizard.step2.date")} required>
                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className={inputCls} style={mont} />
                  </Field>
                  <Field label={t("wizard.step2.time")} required>
                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className={inputCls} style={mont} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                {t("wizard.step3.prompt")}
              </p>

              <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb]">
                {[
                  [t("wizard.step3.campaign"), name],
                  [t("wizard.step3.template"), MARKETING_TEMPLATES.find((tpl) => tpl.key === templateKey)?.name ?? t("wizard.step3.templateCustom")],
                  [t("wizard.step3.subject"), subject],
                  [t("wizard.step3.from"), `${fromName} <${NEWSLETTER_SENDER}>`],
                  [t("wizard.step3.audience"), selectedList ? `${selectedList.name} (${subscribedCount} ${t("wizard.step2.audienceOptionSubscribed")})` : "—"],
                  ...(hasPropertiesBlock
                    ? [[t("wizard.step3.properties"), featured.length > 0 ? featured.map((c) => c.listingId).join(", ") : t("wizard.step3.noneSelected")] as [string, string]]
                    : []),
                  [
                    t("wizard.step3.schedule"),
                    scheduleMode === "now"
                      ? t("wizard.step3.sendImmediately")
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
                  {t("wizard.step3.disclosure", { sender: NEWSLETTER_SENDER })}
                </p>
              </div>

              {/* Test send */}
              <div className="flex flex-col gap-2 rounded-[12px] border border-[#e5e7eb] p-4">
                <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{t("wizard.step3.sendTestFirst")}</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={testEmails}
                    onChange={(e) => setTestEmails(e.target.value)}
                    placeholder={t("wizard.step3.testEmailsPlaceholder")}
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
                    {t("wizard.step3.sendTest")}
                  </button>
                </div>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>
                  {t("wizard.step3.testNote")}
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
              {t("wizard.back")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
            style={mont}
          >
            {t("wizard.cancel")}
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
              {createMutation.isPending || updateMutation.isPending ? t("wizard.saving") : t("wizard.saveDraft")}
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (!templateKey) {
                  setValidationError(t("wizard.validation.selectTemplate"));
                  return;
                }
                setValidationError(null);
                setStep(2);
              }}
              className="min-h-[42px] rounded-[10px] bg-[#1e4f86] px-8 text-[13px] font-medium text-white hover:bg-[#1b487a]"
              style={mont}
            >
              {t("wizard.continue")}
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
              {t("wizard.continue")}
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
              {scheduleMode === "later" ? t("wizard.scheduleCampaign") : t("wizard.sendCampaign")}
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
              {scheduleMode === "later" ? t("wizard.confirm.scheduleTitle") : t("wizard.confirm.sendTitle")}
            </p>
            <div className="flex flex-col gap-2 rounded-[10px] bg-[#f8fafc] p-4">
              {[
                [t("wizard.confirm.audience"), confirm.listName],
                [t("campaigns.columns.recipients"), t("wizard.confirm.recipients", { count: confirm.recipientCount })],
                [t("wizard.confirm.sender"), `${fromName} <${NEWSLETTER_SENDER}>`],
                [t("wizard.confirm.subject"), subject],
                ...(scheduleMode === "later" ? [[t("wizard.confirm.scheduledFor"), `${scheduleDate} at ${scheduleTime}`] as [string, string]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{label}</span>
                  <span className="min-w-0 break-words text-right text-[12px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
              {t("wizard.confirm.undoNote", { suffix: scheduleMode === "later" ? t("wizard.confirm.undoNoteScheduled") : "" })}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={sendMutation.isPending}
                className="min-h-[40px] rounded-[10px] border border-[#e5e7eb] px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
                style={mont}
              >
                {t("wizard.confirm.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmedSend}
                disabled={sendMutation.isPending}
                className="flex min-h-[40px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-5 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60"
                style={mont}
              >
                {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sendMutation.isPending ? t("wizard.confirm.sending") : scheduleMode === "later" ? t("wizard.confirm.confirmSchedule") : t("wizard.confirm.confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
