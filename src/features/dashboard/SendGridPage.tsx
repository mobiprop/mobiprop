"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail, Send, Eye, MousePointerClick, AlertOctagon, ChevronLeft, Plus, Search,
  Loader2, MoreVertical, Copy, Pencil, Trash2, BarChart3, CalendarClock, X,
  CheckCircle2, LayoutGrid, FileText, Users, Settings as SettingsIcon, Clock,
} from "lucide-react";
import { toast } from "sonner";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { EmailCampaignStatus } from "@/generated/prisma/enums";
import type { EmailCampaignDto } from "@/features/integrations/sendgrid-actions";
import { MARKETING_TEMPLATES, type MarketingTemplate } from "@/features/integrations/email-marketing-templates";
import {
  useSendgridStatusQuery,
  useSendgridOverviewQuery,
  useSendgridCampaignsQuery,
} from "@/hooks/queries/useSendgridQuery";
import {
  useDuplicateCampaignMutation,
  useDeleteCampaignMutation,
  useCancelScheduleMutation,
} from "@/hooks/mutations/useSendgridMutations";
import { CampaignWizardModal } from "./components/sendgrid/CampaignWizardModal";
import { ContactsTab } from "./components/sendgrid/ContactsTab";
import { SettingsTab } from "./components/sendgrid/SettingsTab";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type SendGridTab = "overview" | "campaigns" | "templates" | "contacts" | "settings";

const STATUS_BADGE: Record<EmailCampaignStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#f3f4f6", text: "#6a7282", label: "Draft" },
  SCHEDULED: { bg: "#e0e7ff", text: "#4f46e5", label: "Scheduled" },
  SENDING: { bg: "#fef3e2", text: "#b45309", label: "Sending" },
  SENT: { bg: "#dcfce7", text: "#16a34a", label: "Sent" },
  FAILED: { bg: "#fee2e2", text: "#dc2626", label: "Failed" },
  CANCELLED: { bg: "#f3f4f6", text: "#6a7282", label: "Cancelled" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pct(num: number, den: number): string {
  if (den <= 0) return "—";
  return `${Math.round((num / den) * 1000) / 10}%`;
}

// ── Header stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, iconBg, icon }: {
  label: string; value: string; sub: string; iconBg: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-5 rounded-[14px] border border-[#e5e7eb] bg-white p-[18px]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[24px] font-semibold leading-[28px] text-[#1e4f86]" style={poppins}>{value}</span>
        <p className="text-[12px] font-medium text-[#6a7282]" style={mont}>{sub}</p>
      </div>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#374151]" style={mont}>{label}</span>
        <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>
          {value.toLocaleString()} <span className="font-normal text-[#9ca3af]">{pct(value, max)}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function OverviewTab({ connected, webhookConfigured, onViewCampaigns }: {
  connected: boolean; webhookConfigured: boolean; onViewCampaigns: () => void;
}) {
  const { data, isLoading, isError } = useSendgridOverviewQuery();
  const overview = data?.overview;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#6a7282]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]" style={mont}>Loading overview…</span>
      </div>
    );
  }
  if (isError || !overview) {
    return <p className="py-16 text-center text-[14px] text-[#dc2626]" style={mont}>Could not load the SendGrid overview. Try refreshing the page.</p>;
  }

  const funnelMax = overview.funnel.sent;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Connection status */}
        <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Connection Status</p>
          <div className={`flex items-center gap-3 rounded-[12px] border px-4 py-3.5 ${connected ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fde68a] bg-[#fffbeb]"}`}>
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${connected ? "bg-[#16a34a]" : "bg-[#f59e0b]"}`}>
              <CheckCircle2 size={18} className="text-white" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className={`text-[14px] font-semibold ${connected ? "text-[#15803d]" : "text-[#b45309]"}`} style={mont}>
                {connected ? "Connected to SendGrid" : "SendGrid API key not configured"}
              </span>
              <span className={`text-[12px] ${connected ? "text-[#15803d]" : "text-[#b45309]"}`} style={mont}>
                {connected
                  ? `Campaigns send from mailing@ulrichpropiedades.com${overview.lastCampaignSentAt ? ` · Last campaign ${fmtDate(overview.lastCampaignSentAt)}` : ""}`
                  : "Add SENDGRID_API_KEY to the server environment to enable sending."}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Campaign Sender", "mailing@ulrichpropiedades.com"],
              ["Sending Domain", "ulrichpropiedades.com"],
              ["Event Webhook", webhookConfigured ? "Configured" : "Pending setup"],
            ].map(([label, value]) => (
              <div key={label} className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-4 py-3">
                <span className="text-[11px] text-[#9ca3af]" style={mont}>{label}</span>
                <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont} title={value}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery funnel */}
        <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Delivery Funnel — All Campaigns</p>
          </div>
          {overview.emailsSent === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#9ca3af]" style={mont}>No campaigns sent yet — the funnel appears after your first send.</p>
          ) : (
            <>
              <FunnelBar label="Sent" value={overview.funnel.sent} max={funnelMax} color="#1e4f86" />
              <FunnelBar label="Delivered" value={overview.funnel.delivered} max={funnelMax} color="#16a34a" />
              <FunnelBar label="Opened" value={overview.funnel.opened} max={funnelMax} color="#f59e0b" />
              <FunnelBar label="Clicked" value={overview.funnel.clicked} max={funnelMax} color="#38bdf8" />
              {!overview.metricsAvailable && (
                <p className="text-[11px] text-[#9ca3af]" style={mont}>
                  Delivered/opened/clicked stay at zero until the SendGrid Event Webhook is configured (Settings tab).
                </p>
              )}
            </>
          )}
        </div>

        {/* Recent activity */}
        <div className="flex flex-col gap-1 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-center justify-between gap-3 pb-2">
            <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Recent Activity</p>
            <button type="button" onClick={onViewCampaigns} className="text-[13px] font-medium text-[#1e4f86] hover:underline" style={mont}>
              View campaigns ›
            </button>
          </div>
          {overview.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#9ca3af]" style={mont}>No campaign activity yet.</p>
          ) : (
            overview.recentActivity.map((item) => (
              <div key={`${item.id}-${item.at}`} className="flex items-start gap-3 border-b border-[#f3f4f6] py-3 last:border-b-0">
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  item.kind === "SENT" ? "bg-[#dcfce7]" : item.kind === "FAILED" ? "bg-[#fee2e2]" : "bg-[#f3f4f6]"
                }`}>
                  {item.kind === "SENT" ? <CheckCircle2 size={14} className="text-[#16a34a]" />
                    : item.kind === "FAILED" ? <AlertOctagon size={14} className="text-[#dc2626]" />
                    : item.kind === "SCHEDULED" ? <CalendarClock size={14} className="text-[#6a7282]" />
                    : <Pencil size={14} className="text-[#6a7282]" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{item.title}</span>
                  <span className="truncate text-[12px] text-[#6a7282]" style={mont}>{item.detail}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#9ca3af]" style={mont}>{fmtDate(item.at)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Audience</p>
          {[
            ["Total recipients", overview.totalRecipients],
            ["Subscribed", overview.subscribedRecipients],
            ["Unsubscribed", overview.unsubscribedRecipients],
            ["Bounced", overview.bouncedRecipients],
            ["Contact lists", overview.totalLists],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between border-b border-[#f3f4f6] pb-2.5 last:border-b-0 last:pb-0">
              <span className="text-[13px] text-[#6a7282]" style={mont}>{label as string}</span>
              <span className="text-[14px] font-semibold text-[#0d2138]" style={poppins}>{(value as number).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <div className="flex flex-col gap-0.5">
            <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Scheduled</p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>
              {overview.scheduledCampaigns.length} upcoming
            </p>
          </div>
          {overview.scheduledCampaigns.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-[#9ca3af]" style={mont}>No scheduled campaigns.</p>
          ) : (
            overview.scheduledCampaigns.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 border-b border-[#f3f4f6] pb-3 last:border-b-0 last:pb-0">
                <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{item.name}</span>
                <span className="text-[12px] text-[#6a7282]" style={mont}>{item.recipients.toLocaleString()} recipients</span>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6a7282]" style={mont}>{fmtDate(item.scheduledAt)}</span>
                  <span className="rounded-[6px] bg-[#e0e7ff] px-2.5 py-0.5 text-[11px] font-medium text-[#4f46e5]" style={mont}>Scheduled</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <p className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Campaigns</p>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#6a7282]" style={mont}>Sent</span>
            <span className="text-[14px] font-semibold text-[#0d2138]" style={poppins}>{overview.campaignsSent}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#6a7282]" style={mont}>Drafts</span>
            <span className="text-[14px] font-semibold text-[#0d2138]" style={poppins}>{overview.draftCampaigns}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign metrics modal ───────────────────────────────────────────────────

function CampaignMetricsModal({ campaign, onClose }: { campaign: EmailCampaignDto; onClose: () => void }) {
  const m = campaign.metrics;
  const hasEvents = campaign.lastEventAt !== null;
  const cells: [string, string, string][] = [
    ["Sent", m.sent.toLocaleString(), ""],
    ["Delivered", m.delivered.toLocaleString(), pct(m.delivered, m.sent)],
    ["Opened", m.opened.toLocaleString(), pct(m.opened, m.delivered || m.sent)],
    ["Clicked", m.clicked.toLocaleString(), pct(m.clicked, m.opened)],
    ["Bounced", m.bounced.toLocaleString(), pct(m.bounced, m.sent)],
    ["Unsubscribed", m.unsubscribed.toLocaleString(), ""],
    ["Spam reports", m.spamReports.toLocaleString(), ""],
    ["Failed sends", m.failed.toLocaleString(), ""],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[17px] font-semibold text-[#0d2138]" style={poppins}>{campaign.name}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {campaign.campaignId} · {campaign.listName ?? "No audience"} · Sent {fmtDate(campaign.sentAt)}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cells.map(([label, value, rate]) => (
              <div key={label} className="flex flex-col gap-1 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3">
                <span className="text-[11px] text-[#9ca3af]" style={mont}>{label}</span>
                <span className="text-[18px] font-semibold text-[#0d2138]" style={poppins}>{value}</span>
                {rate && rate !== "—" && <span className="text-[11px] text-[#6a7282]" style={mont}>{rate}</span>}
              </div>
            ))}
          </div>
          {!hasEvents && (
            <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
              <p className="text-[12px] leading-5 text-[#b45309]" style={mont}>
                No engagement events received yet. Delivered/opened/clicked metrics require the SendGrid Event
                Webhook (Settings tab) — until it is configured, only the send count is tracked.
              </p>
            </div>
          )}
          {campaign.failedReason && (
            <div className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
              <p className="text-[12px] leading-5 text-[#dc2626]" style={mont}>Send error: {campaign.failedReason}</p>
            </div>
          )}
          <p className="text-[11px] text-[#9ca3af]" style={mont}>
            Last event: {campaign.lastEventAt ? new Date(campaign.lastEventAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Campaigns tab ────────────────────────────────────────────────────────────

function CampaignRow({ campaign, canManage, canSend, onEdit, onMetrics }: {
  campaign: EmailCampaignDto;
  canManage: boolean;
  canSend: boolean;
  onEdit: () => void;
  onMetrics: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const duplicateMutation = useDuplicateCampaignMutation();
  const deleteMutation = useDeleteCampaignMutation();
  const cancelMutation = useCancelScheduleMutation();

  const badge = STATUS_BADGE[campaign.status];
  const editable = campaign.status === EmailCampaignStatus.DRAFT || campaign.status === EmailCampaignStatus.SCHEDULED;

  async function handleDuplicate() {
    setMenuOpen(false);
    try {
      await duplicateMutation.mutateAsync(campaign.id);
      toast.success("Campaign duplicated as a new draft");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    const label = campaign.status === EmailCampaignStatus.SENT ? "archive/delete this sent campaign and its metrics" : "delete this campaign";
    if (!window.confirm(`Are you sure you want to ${label}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(campaign.id);
      toast.success("Campaign deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleCancelSchedule() {
    setMenuOpen(false);
    try {
      await cancelMutation.mutateAsync(campaign.id);
      toast.success("Schedule cancelled — campaign is a draft again");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel schedule");
    }
  }

  return (
    <tr className="border-b border-[#f3f4f6] last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{campaign.name}</span>
          <span className="text-[11px] text-[#9ca3af]" style={mont}>{campaign.campaignId}</span>
        </div>
      </td>
      <td className="max-w-[240px] px-5 py-4">
        <span className="line-clamp-2 text-[13px] text-[#6a7282]" style={mont}>{campaign.subject || "—"}</span>
      </td>
      <td className="px-5 py-4 text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{campaign.listName ?? "—"}</td>
      <td className="px-5 py-4 text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>
        {campaign.status === EmailCampaignStatus.SCHEDULED ? (
          <span className="flex items-center gap-1"><Clock size={12} /> {fmtDate(campaign.scheduledAt)}</span>
        ) : (
          fmtDate(campaign.sentAt)
        )}
      </td>
      <td className="px-5 py-4 text-[14px] font-semibold text-[#0d2138]" style={mont}>
        {campaign.totalRecipients > 0 ? campaign.totalRecipients.toLocaleString() : "—"}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{campaign.metrics.opened.toLocaleString()}</span>
          <span className="text-[11px] text-[#9ca3af]" style={mont}>{pct(campaign.metrics.opened, campaign.metrics.delivered || campaign.metrics.sent)}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{campaign.metrics.clicked.toLocaleString()}</span>
          <span className="text-[11px] text-[#9ca3af]" style={mont}>{pct(campaign.metrics.clicked, campaign.metrics.opened)}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex rounded-[6px] px-3 py-1 text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: badge.bg, color: badge.text, ...mont }}>
          {badge.label}
        </span>
      </td>
      <td className="relative w-[55px] px-5 py-4 text-center">
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-5 top-12 z-10 w-[190px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]">
            <button type="button" onClick={() => { setMenuOpen(false); onMetrics(); }} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
              <BarChart3 size={13} /> View metrics
            </button>
            {canManage && editable && (
              <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
                <Pencil size={13} /> Edit
              </button>
            )}
            {canSend && campaign.status === EmailCampaignStatus.SCHEDULED && (
              <button type="button" onClick={handleCancelSchedule} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
                <CalendarClock size={13} /> Cancel schedule
              </button>
            )}
            {canManage && (
              <>
                <button type="button" onClick={handleDuplicate} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
                  <Copy size={13} /> Duplicate
                </button>
                {campaign.status !== EmailCampaignStatus.SENDING && (
                  <button type="button" onClick={handleDelete} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#dc2626] hover:bg-[#fff1f2]" style={mont}>
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function CampaignsTab({ canManage, canSend, onEdit }: {
  canManage: boolean; canSend: boolean; onEdit: (campaign: EmailCampaignDto) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmailCampaignStatus>("ALL");
  const [metricsFor, setMetricsFor] = useState<EmailCampaignDto | null>(null);

  const { data, isLoading, isError } = useSendgridCampaignsQuery();
  const campaigns = useMemo(() => data?.campaigns ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || c.campaignId.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f3f4f6] px-5 py-3.5">
          <div className="relative w-full max-w-[280px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns"
              className="min-h-[38px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-9 pr-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
              style={mont}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | EmailCampaignStatus)}
            className="min-h-[38px] rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3 text-[12px] text-[#0d2138] focus:border-[#1e4f86] focus:outline-none"
            style={mont}
          >
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_BADGE).map(([status, meta]) => (
              <option key={status} value={status}>{meta.label}</option>
            ))}
          </select>
          <div className="flex-1" />
          <span className="text-[12px] text-[#6a7282]" style={mont}>{filtered.length} campaign{filtered.length === 1 ? "" : "s"}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[#6a7282]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]" style={mont}>Loading campaigns…</span>
          </div>
        ) : isError ? (
          <p className="py-14 text-center text-[13px] text-[#dc2626]" style={mont}>Could not load campaigns.</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14">
            <Send size={26} className="text-[#c9d6e5]" />
            <p className="text-[13px] text-[#6a7282]" style={mont}>
              {search || statusFilter !== "ALL" ? "No campaigns match your filters." : "No campaigns yet — create your first one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                  {["Campaign", "Subject", "Audience", "Date", "Recipients", "Opens", "Clicks", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6a7282]" style={mont}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    canManage={canManage}
                    canSend={canSend}
                    onEdit={() => onEdit(campaign)}
                    onMetrics={() => setMetricsFor(campaign)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {metricsFor && <CampaignMetricsModal campaign={metricsFor} onClose={() => setMetricsFor(null)} />}
    </div>
  );
}

// ── Templates tab ────────────────────────────────────────────────────────────

function TemplatePreviewModal({ template, onClose }: { template: MarketingTemplate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={poppins}>{template.name}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
            <X size={18} />
          </button>
        </div>
        <iframe title={`${template.name} preview`} sandbox="" srcDoc={template.html.replace(/%first_name%/g, "María")} className="h-[70vh] w-full bg-[#f4f6f9]" />
      </div>
    </div>
  );
}

function TemplatesTab({ canManage, onUseTemplate }: { canManage: boolean; onUseTemplate: (key: string) => void }) {
  const { data } = useSendgridCampaignsQuery();
  const [preview, setPreview] = useState<MarketingTemplate | null>(null);

  const usage = useMemo(() => {
    const map = new Map<string, { count: number; lastUsed: string | null }>();
    for (const c of data?.campaigns ?? []) {
      if (!c.templateKey) continue;
      const entry = map.get(c.templateKey) ?? { count: 0, lastUsed: null };
      entry.count += 1;
      if (!entry.lastUsed || c.createdAt > entry.lastUsed) entry.lastUsed = c.createdAt;
      map.set(c.templateKey, entry);
    }
    return map;
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-[#6a7282]" style={mont}>
        Reusable email templates for marketing campaigns — pick one to start a new campaign, then customise the
        content in the editor.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {MARKETING_TEMPLATES.map((template) => {
          const used = usage.get(template.key);
          return (
            <div key={template.key} className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                  <Mail size={18} className="text-[#1e4f86]" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px] font-semibold text-[#0d2138]" style={mont}>{template.name}</span>
                  <span className="w-fit rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#1e4f86]" style={mont}>
                    {template.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-4 py-3">
                <span className="text-[11px] text-[#9ca3af]" style={mont}>Subject line</span>
                <span className="truncate text-[13px] text-[#0d2138]" style={mont}>{template.subject || "(set when creating the campaign)"}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-0.5 rounded-[10px] bg-[#f8fafc] px-3 py-2.5">
                  <span className="text-[15px] font-semibold text-[#0d2138]" style={poppins}>{used?.count ?? 0}x</span>
                  <span className="text-[11px] text-[#9ca3af]" style={mont}>Used</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-[10px] bg-[#f8fafc] px-3 py-2.5">
                  <span className="text-[15px] font-semibold text-[#0d2138]" style={poppins}>{used?.lastUsed ? fmtDate(used.lastUsed) : "—"}</span>
                  <span className="text-[11px] text-[#9ca3af]" style={mont}>Last used</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onUseTemplate(template.key)}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white hover:bg-[#1b487a]"
                    style={mont}
                  >
                    <Send size={14} /> Use Template
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreview(template)}
                  title="Preview"
                  className="flex min-h-[40px] items-center justify-center rounded-[10px] border border-[#e5e7eb] px-3.5 text-[#6a7282] hover:bg-[#f9fafb] hover:text-[#0d2138]"
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {preview && <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function SendGridPage({ role }: { role: Role }) {
  const [activeTab, setActiveTab] = useState<SendGridTab>("overview");
  const [wizard, setWizard] = useState<{ campaign: EmailCampaignDto | null; templateKey?: string } | null>(null);

  const { data: statusData } = useSendgridStatusQuery();
  const { data: overviewData } = useSendgridOverviewQuery();

  const canManage = hasPermission(role, "sendgrid:manageCampaigns");
  const canManageLists = hasPermission(role, "sendgrid:manageLists");
  const canSend = hasPermission(role, "sendgrid:send");
  const canExport = hasPermission(role, "sendgrid:export");
  const canManageSettings = hasPermission(role, "sendgrid:manageSettings");

  const connected = statusData?.connected ?? false;
  const webhookConfigured = statusData?.config.webhookPublicKey ?? false;
  const overview = overviewData?.overview;

  const tabs: { id: SendGridTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutGrid size={15} /> },
    { id: "campaigns", label: "Campaigns", icon: <Send size={15} /> },
    { id: "templates", label: "Templates", icon: <FileText size={15} /> },
    { id: "contacts", label: "Contacts", icon: <Users size={15} /> },
    // Settings is ADMIN-only per the client's Figma spec.
    ...(canManageSettings ? [{ id: "settings" as const, label: "Settings", icon: <SettingsIcon size={15} /> }] : []),
  ];

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* Back link */}
      <Link
        href="/dashboard/integrations"
        className="flex w-fit items-center gap-1 text-[13px] font-medium text-[#6a7282] hover:text-[#0d2138]"
        style={mont}
      >
        <ChevronLeft size={15} /> Back
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1e4f86] to-[#1a5ea8] text-white">
            <Mail size={20} />
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[20px] font-medium leading-[32px] text-[#0d2138]" style={poppins}>SendGrid</h1>
            <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Email delivery &amp; marketing campaigns</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-medium ${
              connected ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f4f6] text-[#6a7282]"
            }`}
            style={mont}
          >
            <span className={`size-1.5 rounded-full ${connected ? "bg-[#16a34a]" : "bg-[#9ca3af]"}`} />
            {connected ? "Connected" : "Not Connected"}
          </span>
          {canManage && (
            <button
              type="button"
              onClick={() => setWizard({ campaign: null })}
              className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a]"
              style={mont}
            >
              <Plus size={16} /> New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Emails Sent"
          value={(overview?.emailsSent ?? 0).toLocaleString()}
          sub="All campaigns"
          iconBg="#e8f0fe"
          icon={<Send size={16} className="text-[#1e4f86]" />}
        />
        <StatCard
          label="Avg. Open Rate"
          value={overview?.openRate != null ? `${overview.openRate}%` : "—"}
          sub={overview?.metricsAvailable ? "Across sent emails" : "Pending webhook setup"}
          iconBg="#fef3c6"
          icon={<Eye size={16} className="text-[#d08700]" />}
        />
        <StatCard
          label="Avg. Click Rate"
          value={overview?.clickRate != null ? `${overview.clickRate}%` : "—"}
          sub={overview?.metricsAvailable ? "Of opened emails" : "Pending webhook setup"}
          iconBg="#d1fae5"
          icon={<MousePointerClick size={16} className="text-[#10b981]" />}
        />
        <StatCard
          label="Bounce Rate"
          value={overview?.bounceRate != null ? `${overview.bounceRate}%` : "—"}
          sub={overview?.metricsAvailable ? "Hard & soft" : "Pending webhook setup"}
          iconBg="#fee2e2"
          icon={<AlertOctagon size={16} className="text-[#dc2626]" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#e5e7eb]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[14px] font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[#1e4f86] text-[#1e4f86]"
                : "border-transparent text-[#6a7282] hover:text-[#0d2138]"
            }`}
            style={mont}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab connected={connected} webhookConfigured={webhookConfigured} onViewCampaigns={() => setActiveTab("campaigns")} />
      )}
      {activeTab === "campaigns" && (
        <CampaignsTab canManage={canManage} canSend={canSend} onEdit={(campaign) => setWizard({ campaign })} />
      )}
      {activeTab === "templates" && (
        <TemplatesTab canManage={canManage} onUseTemplate={(templateKey) => setWizard({ campaign: null, templateKey })} />
      )}
      {activeTab === "contacts" && <ContactsTab canManage={canManageLists} canExport={canExport} />}
      {activeTab === "settings" && canManageSettings && <SettingsTab />}

      {wizard && (
        <CampaignWizardModal
          campaign={wizard.campaign}
          initialTemplateKey={wizard.templateKey}
          canSend={canSend}
          onClose={() => setWizard(null)}
        />
      )}
    </div>
  );
}
