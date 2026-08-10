"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileSignature, FileText, Clock, CheckCircle2, XCircle, Send, RefreshCw,
  Search, Plus, Settings as SettingsIcon, LayoutGrid, Loader2, MoreVertical, Copy, PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { EnvelopeStatus, EnvelopeSource } from "@/generated/prisma/enums";
import type { DocusignEnvelopeDto } from "@/features/integrations/docusign-actions";
import type { DocusignTemplateSummary } from "@/lib/docusign";
import {
  useDocusignEnvelopesQuery,
  useDocusignTemplatesQuery,
  useDocusignSettingsQuery,
  useDocusignStatusQuery,
} from "@/hooks/queries/useDocusignQuery";
import {
  useVoidEnvelopeMutation,
  useResendEnvelopeMutation,
  useUpdateDocusignSettingsMutation,
} from "@/hooks/mutations/useDocusignMutations";
import { SendForSignatureModal } from "./components/SendForSignatureModal";
import { Toggle } from "./components/settings/Toggle";
import { SearchableSelect } from "./components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type DocuSignTab = "overview" | "envelopes" | "templates" | "settings";

// Page accent — the app's standard theme blue (client asked the earlier
// DocuSign-purple accent to be replaced with the house colour).
const DS_ACCENT = "#1e4f86";
const DS_ACCENT_SOFT = "#eff6ff";

const STATUS_BADGE: Record<EnvelopeStatus, { bg: string; text: string; dot: string }> = {
  SENT: { bg: "#fef3e2", text: "#b45309", dot: "#f59e0b" },
  DELIVERED: { bg: "#e6fbf8", text: "#0f766e", dot: "#14b8a6" },
  COMPLETED: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e" },
  DECLINED: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
  VOIDED: { bg: "#f3f4f6", text: "#6a7282", dot: "#9ca3af" },
};

function StatCard({ label, value, sub, iconBg, iconColor, accent, icon }: {
  label: string; value: number; sub: string; iconBg: string; iconColor: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[12px] p-[18px] flex flex-col gap-6"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-7">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</span>
        <p className="text-[12px] font-medium text-[#6a7282]" style={mont}>{sub}</p>
      </div>
    </div>
  );
}

/** A small 4-block "flag" mark echoing DocuSign's own multi-colour brand mark. */
function DocuSignMark({ size = 20 }: { size?: number }) {
  const s = size / 2 - 1;
  return (
    <span className="grid grid-cols-2 gap-[2px]" style={{ width: size, height: size }}>
      <span className="rounded-[2px]" style={{ width: s, height: s, backgroundColor: "#F5A623" }} />
      <span className="rounded-[2px]" style={{ width: s, height: s, backgroundColor: "#14B8A6" }} />
      <span className="rounded-[2px]" style={{ width: s, height: s, backgroundColor: "#EF4444" }} />
      <span className="rounded-[2px]" style={{ width: s, height: s, backgroundColor: DS_ACCENT }} />
    </span>
  );
}
function MultiColorPlus({ size = 34 }: { size?: number }) {
  const bar = Math.max(3, size * 0.12);

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* vertical line */}
      <span
        className="absolute rounded-full"
        style={{
          width: bar,
          height: size,
          background:
            "linear-gradient(180deg, #F5A623 0%, #14B8A6 50%, #1e4f86 100%)",
        }}
      />

      {/* horizontal line */}
      <span
        className="absolute rounded-full"
        style={{
          width: size,
          height: bar,
          background:
            "linear-gradient(90deg, #EF4444 0%, #F5A623 33%, #14B8A6 66%, #1e4f86 100%)",
        }}
      />
    </span>
  );
}
// Each template gets a stable accent + layout variant derived from its id, so
// the gallery reads varied and colourful (Google-Docs-style) without any extra
// DocuSign API calls. Palette echoes the DocuSign brand mark + theme blue.
const PREVIEW_ACCENTS = ["#1e4f86", "#0f9e8e", "#e0940f", "#e05252", "#16a34a"];

function templateHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function MockLines({ widths, tone = "#e9edf2" }: { widths: number[]; tone?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {widths.map((w, i) => (
        <span key={i} className="h-0.75 rounded-full" style={{ width: `${w}%`, backgroundColor: tone }} />
      ))}
    </div>
  );
}

function SignatureField({ accent, label }: { accent: string; label?: string }) {
  const { t } = useTranslation("docusign");
  const resolvedLabel = label ?? t("page.preview.signHere");
  return (
    <div
      className="flex min-w-0 items-center gap-1 rounded-sm border border-dashed px-1.5 py-1"
      style={{ borderColor: `${accent}80`, backgroundColor: `${accent}0f` }}
    >
      <PenLine size={8} className="shrink-0" style={{ color: accent }} />
      <span className="truncate text-[7px] font-medium text-[#6a7282]" style={mont}>{resolvedLabel}</span>
    </div>
  );
}

/** Stylised page-preview thumbnail — one of four mock-document layouts, Google-Docs-gallery style. */
function TemplatePreview({ name, templateId }: { name: string; templateId: string }) {
  const { t } = useTranslation("docusign");
  const hash = templateHash(templateId);
  const accent = PREVIEW_ACCENTS[hash % PREVIEW_ACCENTS.length];
  const variant = hash % 4;

  if (variant === 0) {
    // Cover page — bold colour block with geometric shapes
    return (
      <div className="flex h-full w-full flex-col bg-white">
        <div
          className="relative flex h-[42%] shrink-0 flex-col justify-end overflow-hidden px-4 pb-3"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}c9 100%)` }}
        >
          <span className="absolute -right-4 -top-6 size-16 rounded-full bg-white/15" />
          <span className="absolute right-7 top-9 size-5 rotate-45 bg-white/20" />
          <p className="line-clamp-2 text-[10px] font-semibold leading-3.25 text-white" style={poppins}>{name}</p>
          <span className="mt-1.5 h-0.75 w-8 rounded-full bg-white/70" />
        </div>
        <div className="flex flex-1 flex-col px-4 pb-3 pt-2">
          <div className="flex flex-1 flex-col justify-evenly">
            <MockLines widths={[96, 88, 92, 70]} />
            <MockLines widths={[58, 84, 76, 90]} />
            <MockLines widths={[100, 72, 86]} />
          </div>
          <SignatureField accent={accent} />
        </div>
      </div>
    );
  }

  if (variant === 1) {
    // Letter — logo block + dense paragraphs
    return (
      <div className="flex h-full w-full flex-col bg-white px-4 pb-3 pt-3.5">
        <div className="flex items-start justify-between">
          <span className="flex size-5 items-center justify-center rounded-[5px]" style={{ backgroundColor: accent }}>
            <FileSignature size={11} className="text-white" />
          </span>
          <div className="w-1/4"><MockLines widths={[100, 78]} /></div>
        </div>
        <p className="mt-2 truncate text-[9px] font-semibold leading-3 text-[#0d2138]" style={poppins}>{name}</p>
        <span className="mb-1.5 mt-1 h-0.75 w-7 rounded-full" style={{ backgroundColor: accent }} />
        <div className="flex flex-1 flex-col justify-evenly">
          <MockLines widths={[100, 92, 96, 84, 90, 62]} />
          <MockLines widths={[88, 96, 100, 54]} />
          <MockLines widths={[94, 68, 82]} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="w-2/5"><MockLines widths={[100, 66]} /></div>
          <SignatureField accent={accent} />
        </div>
      </div>
    );
  }

  if (variant === 2) {
    // Report — hero placeholder + two-column body
    return (
      <div className="flex h-full w-full flex-col bg-white px-4 pb-3 pt-3.5">
        <p className="truncate text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-[#0d2138]" style={poppins}>{name}</p>
        <span className="mx-auto mb-2 mt-1 h-0.75 w-10 rounded-full" style={{ backgroundColor: accent }} />
        <div className="flex h-[26%] shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}1a` }}>
          <FileText size={16} style={{ color: accent }} />
        </div>
        <div className="flex flex-1 flex-col justify-evenly">
          <div className="grid grid-cols-2 gap-2">
            <MockLines widths={[100, 88, 94, 70, 96, 82]} />
            <MockLines widths={[92, 100, 80, 60, 88, 74]} />
          </div>
          <MockLines widths={[100, 86, 64]} />
        </div>
        <SignatureField accent={accent} />
      </div>
    );
  }

  // Agreement — clause table + dual signature boxes
  return (
    <div className="flex h-full w-full flex-col bg-white px-4 pb-3 pt-3.5">
      <p className="truncate text-[9px] font-semibold leading-3 text-[#0d2138]" style={poppins}>{name}</p>
      <span className="mb-1.5 mt-1 h-0.75 w-7 rounded-full" style={{ backgroundColor: accent }} />
      <div className="overflow-hidden rounded-sm border border-[#e9edf2]">
        {[82, 64, 74, 58].map((w, i) => (
          <div key={i} className={`flex items-center gap-2 px-1.5 py-1 ${i > 0 ? "border-t border-[#e9edf2]" : ""}`}>
            <span className="h-0.75 w-1/4 shrink-0 rounded-full" style={{ backgroundColor: `${accent}59` }} />
            <span className="h-0.75 rounded-full bg-[#e9edf2]" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col justify-evenly">
        <MockLines widths={[96, 84, 90, 72]} />
        <MockLines widths={[88, 100, 58]} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <SignatureField accent={accent} label={t("page.preview.partyA")} />
        <SignatureField accent={accent} label={t("page.preview.partyB")} />
      </div>
    </div>
  );
}

/** Real page-1 thumbnail from DocuSign, falling back to the generated mock layout if the template has no renderable page (e.g. no document uploaded yet). */
function TemplateThumbnail({ template }: { template: DocusignTemplateSummary }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <TemplatePreview name={template.name} templateId={template.templateId} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- proxied binary image from DocuSign, not a static asset
    <img
      src={`/api/dashboard/docusign/templates/${template.templateId}/preview`}
      alt={template.name}
      className="h-full w-full object-cover object-top"
      onError={() => setFailed(true)}
    />
  );
}

function TemplateCard({ template, usedCount, canSend, onUse }: {
  template: DocusignTemplateSummary; usedCount: number; canSend: boolean; onUse: () => void;
}) {
  const { t } = useTranslation("docusign");
  return (
    <div className="group flex flex-col gap-2">
      <button
        type="button"
        onClick={canSend ? onUse : undefined}
        disabled={!canSend}
        className="relative aspect-3/4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white text-left shadow-[0_1px_3px_rgba(13,33,56,0.06)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_20px_rgba(13,33,56,0.12)] enabled:cursor-pointer enabled:hover:border-[#1e4f86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
      >
        <TemplateThumbnail template={template} />
        {canSend && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1.5 rounded-full bg-[#1e4f86] px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md" style={mont}>
              <Send size={11} /> {t("page.templates.useTemplate")}
            </span>
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>{template.name}</span>
        <span className="truncate text-[11px] text-[#6a7282]" style={mont}>
          {template.description || t("page.templates.descriptionFallback")} · {t("page.templates.usedCount", { count: usedCount })}
        </span>
      </div>
    </div>
  );
}

/** Leading "create" tile — templates themselves are authored in the DocuSign console, so this links out. */
function NewTemplateCard({ authServer }: { authServer?: string }) {
  const { t } = useTranslation("docusign");
  const consoleUrl = authServer?.startsWith("account-d")
    ? "https://apps-d.docusign.com/templates"
    : "https://apps.docusign.com/templates";
  return (
    <div className="flex flex-col gap-2">
      <a
        href={consoleUrl}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-3/4 items-center justify-center rounded-[10px] border border-dashed border-[#c9d6e5] bg-white transition-all hover:border-[#1e4f86] hover:shadow-[0_6px_16px_rgba(13,33,56,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
      >
        <MultiColorPlus size={34} />
      </a>
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{t("page.templates.newTemplate")}</span>
        <span className="text-[11px] text-[#6a7282]" style={mont}>{t("page.templates.createInConsole")}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EnvelopeStatus }) {
  const { t } = useTranslation("docusign");
  const s = STATUS_BADGE[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {t(`page.statusBadge.${status}`)}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocuSignPage({ role }: { role: Role }) {
  const { t } = useTranslation("docusign");
  const [activeTab, setActiveTab] = useState<DocuSignTab>("overview");
  const [showSendModal, setShowSendModal] = useState(false);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EnvelopeStatus>("ALL");

  const { data: statusData } = useDocusignStatusQuery();
  const { data, isLoading, isError } = useDocusignEnvelopesQuery();
  const { data: templatesData, isLoading: templatesLoading } = useDocusignTemplatesQuery();

  const canSend = hasPermission(role, "docusign:send");
  const canVoid = hasPermission(role, "docusign:void");
  const canResend = hasPermission(role, "docusign:resend");
  const canManageSettings = hasPermission(role, "docusign:manageSettings");

  const envelopes = useMemo(() => data?.envelopes ?? [], [data]);
  const stats = data?.stats;
  const templates = templatesData?.templates ?? [];
  const usedCounts = templatesData?.usedCounts ?? {};
  const connected = statusData?.connected ?? false;

  const filteredEnvelopes = useMemo(() => {
    const q = search.toLowerCase();
    return envelopes.filter((e) => {
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchesSearch =
        !q ||
        e.templateName.toLowerCase().includes(q) ||
        e.recipientName.toLowerCase().includes(q) ||
        e.recipientEmail.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [envelopes, search, statusFilter]);

  const recentActivity = useMemo(() => [...envelopes].slice(0, 6), [envelopes]);

  function openSendModal(templateId?: string) {
    setPreselectedTemplateId(templateId);
    setShowSendModal(true);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: `linear-gradient(135deg, ${DS_ACCENT} 0%, #1a5ea8 100%)`, color: "white" }}
          >
            <FileSignature size={20} />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>{t("page.title")}</h1>
              <DocuSignMark size={16} />
            </div>
            <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>{t("page.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium ${
              connected ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f4f6] text-[#6a7282]"
            }`}
            style={mont}
          >
            <span className={`size-1.5 rounded-full ${connected ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
            {connected ? t("page.connected") : t("page.notConnected")}
          </span>
          {canSend && (
            <button
              type="button"
              onClick={() => openSendModal()}
              className="flex items-center gap-2 h-10 px-4 text-white rounded-[10px] text-[14px] font-medium transition-colors bg-[#1e4f86] hover:bg-[#1b487a]"
              style={mont}
            >
              <Plus size={16} /> {t("page.sendForSignature")}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label={t("page.stats.totalSent")} value={isLoading ? 0 : stats?.totalSent ?? 0} sub={t("page.stats.totalSentSub")} accent={DS_ACCENT} iconBg={DS_ACCENT_SOFT} iconColor={DS_ACCENT} icon={<FileText size={18} />} />
        <StatCard label={t("page.stats.awaitingSignature")} value={isLoading ? 0 : stats?.awaitingSignature ?? 0} sub={t("page.stats.awaitingSignatureSub")} accent="#f59e0b" iconBg="#fef3e2" iconColor="#b45309" icon={<Clock size={18} />} />
        <StatCard label={t("page.stats.completed")} value={isLoading ? 0 : stats?.completed ?? 0} sub={t("page.stats.completedSub")} accent="#22c55e" iconBg="#dcfce7" iconColor="#16a34a" icon={<CheckCircle2 size={18} />} />
        <StatCard label={t("page.stats.declinedVoided")} value={isLoading ? 0 : stats?.declinedOrVoided ?? 0} sub={t("page.stats.declinedVoidedSub")} accent="#ef4444" iconBg="#fee2e2" iconColor="#dc2626" icon={<XCircle size={18} />} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] p-1 w-fit">
        {([
          { id: "overview", label: t("page.tabs.overview"), icon: LayoutGrid },
          { id: "envelopes", label: t("page.tabs.envelopes"), icon: FileText },
          { id: "templates", label: t("page.tabs.templates"), icon: Plus },
          ...(canManageSettings ? [{ id: "settings" as const, label: t("page.tabs.settings"), icon: SettingsIcon }] : []),
        ] as { id: DocuSignTab; label: string; icon: typeof LayoutGrid }[]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium transition-colors ${
                isActive ? "" : "text-[#6a7282] hover:text-[#0d2138]"
              }`}
              style={isActive ? { backgroundColor: "white", color: DS_ACCENT, boxShadow: "0 1px 2px rgba(15,23,42,0.06)", ...mont } : mont}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white border border-[#f3f4f6] rounded-[14px] p-5 flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("page.overview.recentActivity")}</p>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-[#6a7282]">
                <Loader2 size={16} className="animate-spin" /> <span className="text-[13px]" style={mont}>{t("page.overview.loading")}</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#6a7282]" style={mont}>{t("page.overview.empty")}</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#f3f4f6]">
                {recentActivity.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[13px] font-medium text-[#0d2138]" style={mont}>{e.templateName}</span>
                      <span className="truncate text-[11px] text-[#9ca3af]" style={mont}>{e.recipientName} · {fmtDate(e.sentAt)}</span>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-[#f3f4f6] rounded-[14px] p-5 flex flex-col gap-3">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("page.overview.quickActions")}</p>
            {canSend && (
              <button type="button" onClick={() => openSendModal()} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] bg-[#1e4f86] text-white text-[13px] font-medium hover:bg-[#1b487a] transition-colors" style={mont}>
                <Send size={15} /> {t("page.sendForSignature")}
              </button>
            )}
            <button type="button" onClick={() => setActiveTab("envelopes")} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border border-[#e5e7eb] text-[#0d2138] text-[13px] font-medium hover:bg-[#f8fafc] transition-colors" style={mont}>
              <FileText size={15} /> {t("page.overview.viewEnvelopes")}
            </button>
            <button type="button" onClick={() => setActiveTab("templates")} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border border-[#e5e7eb] text-[#0d2138] text-[13px] font-medium hover:bg-[#f8fafc] transition-colors" style={mont}>
              <LayoutGrid size={15} /> {t("page.overview.manageTemplates")}
            </button>
          </div>
        </div>
      )}

      {/* Envelopes */}
      {activeTab === "envelopes" && (
        <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[240px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("page.envelopes.searchPlaceholder")}
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            <SearchableSelect
              ariaLabel={t("page.envelopes.filterByStatusAria")}
              searchable={false}
              size="sm"
              className="w-[160px]"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as "ALL" | EnvelopeStatus)}
              placeholder={t("page.envelopes.allStatuses")}
              options={[
                { value: "ALL", label: t("page.envelopes.allStatuses") },
                { value: EnvelopeStatus.SENT, label: t("page.envelopes.statusOptions.SENT") },
                { value: EnvelopeStatus.DELIVERED, label: t("page.envelopes.statusOptions.DELIVERED") },
                { value: EnvelopeStatus.COMPLETED, label: t("page.envelopes.statusOptions.COMPLETED") },
                { value: EnvelopeStatus.DECLINED, label: t("page.envelopes.statusOptions.DECLINED") },
                { value: EnvelopeStatus.VOIDED, label: t("page.envelopes.statusOptions.VOIDED") },
              ]}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
              <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>{t("page.envelopes.loading")}</span>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-[14px] text-red-500" style={mont}>{t("page.envelopes.loadError")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                    {[
                      t("page.envelopes.columns.document"),
                      t("page.envelopes.columns.recipient"),
                      t("page.envelopes.columns.sentBy"),
                      t("page.envelopes.columns.sent"),
                      t("page.envelopes.columns.expires"),
                      t("page.envelopes.columns.status"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
                    ))}
                    <th className="px-5 py-3 w-[55px]" />
                  </tr>
                </thead>
                <tbody>
                  {filteredEnvelopes.map((e) => (
                    <EnvelopeRow key={e.id} envelope={e} canVoid={canVoid} canResend={canResend} />
                  ))}
                  {filteredEnvelopes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                        {envelopes.length === 0 ? t("page.envelopes.emptyNone") : t("page.envelopes.emptyFiltered")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      {activeTab === "templates" && (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-[#6a7282]" style={mont}>{t("page.templates.notice")}</p>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
              <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>{t("page.templates.loading")}</span>
            </div>
          ) : !connected ? (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-6 py-10 text-center text-[13px] text-[#6a7282]" style={mont}>
              {t("page.templates.notConfigured")}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-6 py-10 text-center text-[13px] text-[#6a7282]" style={mont}>
              {t("page.templates.empty")}
            </div>
          ) : (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-[#f3f6fa] p-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                <NewTemplateCard authServer={statusData?.config?.authServer} />
                {templates.map((t) => (
                  <TemplateCard
                    key={t.templateId}
                    template={t}
                    usedCount={usedCounts[t.templateId] ?? 0}
                    canSend={canSend}
                    onUse={() => openSendModal(t.templateId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {activeTab === "settings" && canManageSettings && <SettingsTabContent />}

      {showSendModal && (
        <SendForSignatureModal
          templates={templates}
          initialTemplateId={preselectedTemplateId}
          onClose={() => setShowSendModal(false)}
          onSent={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}

type EnvelopeMenuPosition = { top: number; left: number };

function EnvelopeRow({ envelope, canVoid, canResend }: { envelope: DocusignEnvelopeDto; canVoid: boolean; canResend: boolean }) {
  const { t } = useTranslation("docusign");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<EnvelopeMenuPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const voidMutation = useVoidEnvelopeMutation();
  const resendMutation = useResendEnvelopeMutation();
  const isPending = envelope.status === EnvelopeStatus.SENT || envelope.status === EnvelopeStatus.DELIVERED;

  const calculateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = canResend && canVoid ? 88 : 46;
    const gap = 6;
    const viewportPadding = 8;
    const hasSpaceBelow = window.innerHeight - rect.bottom >= menuHeight + gap;

    const top = hasSpaceBelow
      ? rect.bottom + gap
      : Math.max(viewportPadding, rect.top - menuHeight - gap);

    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.right - menuWidth),
    );

    setMenuPosition({ top, left });
  }, [canResend, canVoid]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = () => setMenuOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleToggleMenu() {
    if (!menuOpen) {
      calculateMenuPosition();
      setMenuOpen(true);
      return;
    }
    setMenuOpen(false);
  }

  async function handleVoid() {
    const reason = window.prompt(t("page.envelopes.voidReasonPrompt"));
    if (!reason) return;
    try {
      await voidMutation.mutateAsync({ id: envelope.id, reason });
      toast.success(t("page.envelopes.toasts.voided"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("page.envelopes.toasts.voidFailed"));
    }
    setMenuOpen(false);
  }

  async function handleResend() {
    try {
      await resendMutation.mutateAsync(envelope.id);
      toast.success(t("page.envelopes.toasts.reminderSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("page.envelopes.toasts.resendFailed"));
    }
    setMenuOpen(false);
  }

  return (
    <tr className="border-b border-[#e5e7eb] last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {envelope.documentUrl ? (
            <a href={envelope.documentUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap hover:text-[#1e4f86]" style={mont}>
              {envelope.templateName}
            </a>
          ) : (
            <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{envelope.templateName}</span>
          )}
          {envelope.source === EnvelopeSource.CUSTOM_UPLOAD && (
            <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6a7282]" style={mont}>{t("page.envelopes.customDocumentBadge")}</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[13px] text-[#0d2138]" style={mont}>{envelope.recipientName}</span>
            <span className="text-[11px] text-[#9ca3af]" style={mont}>{envelope.recipientEmail}</span>
          </div>
          {envelope.recipients.length > 1 && (
            <span className="shrink-0 rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-[#1e4f86]" style={mont}>
              {t("page.envelopes.moreRecipients", { count: envelope.recipients.length - 1 })}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{envelope.sentByName ?? "—"}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{fmtDate(envelope.sentAt)}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{envelope.expiresAt ? fmtDate(envelope.expiresAt) : "—"}</span>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={envelope.status} />
      </td>
      <td className="px-5 py-4 w-[55px] text-center relative">
        {(canVoid || canResend) && isPending && (
          <>
            <button ref={buttonRef} type="button" onClick={handleToggleMenu} className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
              <MoreVertical size={16} />
            </button>
            {menuOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <>
                  <button
                    type="button"
                    aria-label={t("page.envelopes.closeMenuAria", { defaultValue: "Close menu" })}
                    className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="fixed z-[9999] w-[160px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canResend && (
                      <button type="button" onClick={handleResend} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
                        <RefreshCw size={13} /> {t("page.envelopes.resendReminder")}
                      </button>
                    )}
                    {canVoid && (
                      <button type="button" onClick={handleVoid} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#fb2c36] hover:bg-[#fff1f2]" style={mont}>
                        <XCircle size={13} /> {t("page.envelopes.voidEnvelope")}
                      </button>
                    )}
                  </div>
                </>,
                document.body,
              )}
          </>
        )}
      </td>
    </tr>
  );
}

function SettingsTabContent() {
  const { t } = useTranslation("docusign");
  const { data: statusData } = useDocusignStatusQuery();
  const { data: settingsData, isLoading } = useDocusignSettingsQuery();
  const updateMutation = useUpdateDocusignSettingsMutation();
  const [saved, setSaved] = useState(false);

  const config = statusData?.config;
  const settings = settingsData?.settings;

  async function toggle(key: "autoSendReminders" | "emailNotifications" | "smsNotifications", value: boolean) {
    try {
      await updateMutation.mutateAsync({ [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("page.settings.saveFailed"));
    }
  }

  function copyWebhookUrl() {
    const url = `${window.location.origin}/api/webhooks/docusign`;
    navigator.clipboard.writeText(url);
    toast.success(t("page.settings.webhook.urlCopied"));
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
        <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>{t("page.overview.loading")}</span>
      </div>
    );
  }

  const credentialRows: [string, boolean | undefined][] = [
    [t("page.settings.apiCredentials.integrationKey"), config?.integrationKey],
    [t("page.settings.apiCredentials.userId"), config?.userId],
    [t("page.settings.apiCredentials.accountId"), config?.accountId],
    [t("page.settings.apiCredentials.privateKey"), config?.privateKey],
  ];

  return (
    <div className="flex flex-col gap-4">
      {saved && (
        <div role="status" className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] leading-5 text-[#008236]" style={mont}>
          {t("page.settings.savedMessage")}
        </div>
      )}

      {/* API Credentials — read-only status, sourced from env vars */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("page.settings.apiCredentials.title")}</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>{t("page.settings.apiCredentials.subtitle")}</p>
        <div className="flex flex-col divide-y divide-[#f3f4f6]">
          {credentialRows.map(([label, ok]) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-[#0d2138]" style={mont}>{label}</span>
              <span className={`text-[12px] font-medium ${ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} style={mont}>
                {ok ? t("page.settings.apiCredentials.configured") : t("page.settings.apiCredentials.notConfigured")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook configuration */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("page.settings.webhook.title")}</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>{t("page.settings.webhook.subtitle")}</p>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5">
          <span className="flex-1 truncate text-[12px] text-[#0d2138]" style={mont}>/api/webhooks/docusign</span>
          <button type="button" onClick={copyWebhookUrl} title={t("page.settings.webhook.copyAria")} aria-label={t("page.settings.webhook.copyAria")} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <Copy size={14} />
          </button>
        </div>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>{t("page.settings.webhook.eventsNote")}</p>
      </div>

      {/* Signature defaults */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("page.settings.defaults.title")}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>{t("page.settings.defaults.autoSendReminders")}</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>{t("page.settings.defaults.autoSendRemindersHint")}</span>
          </div>
          <Toggle checked={settings.autoSendReminders} onChange={(v) => toggle("autoSendReminders", v)} label={t("page.settings.defaults.autoSendReminders")} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>{t("page.settings.defaults.emailNotifications")}</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>{t("page.settings.defaults.emailNotificationsHint")}</span>
          </div>
          <Toggle checked={settings.emailNotifications} onChange={(v) => toggle("emailNotifications", v)} label={t("page.settings.defaults.emailNotifications")} />
        </div>
        <div className="flex items-center justify-between gap-3 opacity-60">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>{t("page.settings.defaults.smsNotifications")}</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>{t("page.settings.defaults.smsNotificationsHint")}</span>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled label={t("page.settings.defaults.smsNotificationsAria")} />
        </div>
      </div>
    </div>
  );
}
