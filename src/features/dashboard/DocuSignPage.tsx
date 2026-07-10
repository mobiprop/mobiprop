"use client";

import { useMemo, useState } from "react";
import {
  FileSignature, FileText, Clock, CheckCircle2, XCircle, Send, RefreshCw,
  Search, Plus, Settings as SettingsIcon, LayoutGrid, Loader2, MoreVertical, Copy,
} from "lucide-react";
import { toast } from "sonner";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { EnvelopeStatus } from "@/generated/prisma/enums";
import type { DocusignEnvelopeDto } from "@/features/integrations/docusign-actions";
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

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type DocuSignTab = "overview" | "envelopes" | "templates" | "settings";

// Page accent — the app's standard theme blue (client asked the earlier
// DocuSign-purple accent to be replaced with the house colour).
const DS_ACCENT = "#1e4f86";
const DS_ACCENT_SOFT = "#eff6ff";

const STATUS_BADGE: Record<EnvelopeStatus, { bg: string; text: string; dot: string; label: string }> = {
  SENT: { bg: "#fef3e2", text: "#b45309", dot: "#f59e0b", label: "Awaiting" },
  DELIVERED: { bg: "#e6fbf8", text: "#0f766e", dot: "#14b8a6", label: "Viewed" },
  COMPLETED: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e", label: "Completed" },
  DECLINED: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444", label: "Declined" },
  VOIDED: { bg: "#f3f4f6", text: "#6a7282", dot: "#9ca3af", label: "Voided" },
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

function StatusBadge({ status }: { status: EnvelopeStatus }) {
  const s = STATUS_BADGE[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text, ...mont }}>
      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocuSignPage({ role }: { role: Role }) {
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
              <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>DocuSign</h1>
              <DocuSignMark size={16} />
            </div>
            <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Electronic signature &amp; contract management</p>
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
            {connected ? "Connected" : "Not Connected"}
          </span>
          {canSend && (
            <button
              type="button"
              onClick={() => openSendModal()}
              className="flex items-center gap-2 h-10 px-4 text-white rounded-[10px] text-[14px] font-medium transition-colors bg-[#1e4f86] hover:bg-[#1b487a]"
              style={mont}
            >
              <Plus size={16} /> Send for Signature
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total Sent" value={isLoading ? 0 : stats?.totalSent ?? 0} sub="All time" accent={DS_ACCENT} iconBg={DS_ACCENT_SOFT} iconColor={DS_ACCENT} icon={<FileText size={18} />} />
        <StatCard label="Awaiting Signature" value={isLoading ? 0 : stats?.awaitingSignature ?? 0} sub="Pending action" accent="#f59e0b" iconBg="#fef3e2" iconColor="#b45309" icon={<Clock size={18} />} />
        <StatCard label="Completed" value={isLoading ? 0 : stats?.completed ?? 0} sub="Signed & filed" accent="#22c55e" iconBg="#dcfce7" iconColor="#16a34a" icon={<CheckCircle2 size={18} />} />
        <StatCard label="Declined / Voided" value={isLoading ? 0 : stats?.declinedOrVoided ?? 0} sub="Require action" accent="#ef4444" iconBg="#fee2e2" iconColor="#dc2626" icon={<XCircle size={18} />} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] p-1 w-fit">
        {([
          { id: "overview", label: "Overview", icon: LayoutGrid },
          { id: "envelopes", label: "Envelopes", icon: FileText },
          { id: "templates", label: "Templates", icon: Plus },
          ...(canManageSettings ? [{ id: "settings" as const, label: "Settings", icon: SettingsIcon }] : []),
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
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Recent Activity</p>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-[#6a7282]">
                <Loader2 size={16} className="animate-spin" /> <span className="text-[13px]" style={mont}>Loading…</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#6a7282]" style={mont}>No envelopes sent yet.</p>
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
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Quick Actions</p>
            {canSend && (
              <button type="button" onClick={() => openSendModal()} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] bg-[#1e4f86] text-white text-[13px] font-medium hover:bg-[#1b487a] transition-colors" style={mont}>
                <Send size={15} /> Send for Signature
              </button>
            )}
            <button type="button" onClick={() => setActiveTab("envelopes")} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border border-[#e5e7eb] text-[#0d2138] text-[13px] font-medium hover:bg-[#f8fafc] transition-colors" style={mont}>
              <FileText size={15} /> View Envelopes
            </button>
            <button type="button" onClick={() => setActiveTab("templates")} className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border border-[#e5e7eb] text-[#0d2138] text-[13px] font-medium hover:bg-[#f8fafc] transition-colors" style={mont}>
              <LayoutGrid size={15} /> Manage Templates
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
                placeholder="Search envelopes..."
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | EnvelopeStatus)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[13px] text-[#4a5565] outline-none"
              style={mont}
            >
              <option value="ALL">All statuses</option>
              <option value={EnvelopeStatus.SENT}>Sent</option>
              <option value={EnvelopeStatus.DELIVERED}>Delivered</option>
              <option value={EnvelopeStatus.COMPLETED}>Completed</option>
              <option value={EnvelopeStatus.DECLINED}>Declined</option>
              <option value={EnvelopeStatus.VOIDED}>Voided</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
              <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>Loading envelopes…</span>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-[14px] text-red-500" style={mont}>Failed to load envelopes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                    {["Document", "Recipient", "Sent By", "Sent", "Expires", "Status"].map((h) => (
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
                        {envelopes.length === 0 ? "No envelopes sent yet." : "No envelopes match your search."}
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
          <p className="text-[12px] text-[#6a7282]" style={mont}>Templates are managed in your DocuSign account — this list is live from the DocuSign API.</p>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
              <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>Loading templates…</span>
            </div>
          ) : !connected ? (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-6 py-10 text-center text-[13px] text-[#6a7282]" style={mont}>
              DocuSign is not configured yet — templates will appear here once credentials are set.
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-6 py-10 text-center text-[13px] text-[#6a7282]" style={mont}>
              No templates found in your DocuSign account.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map((t) => (
                <div key={t.templateId} className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-4 hover:border-[#c9bdf5] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px]" style={{ backgroundColor: DS_ACCENT_SOFT, color: DS_ACCENT }}>
                      <FileText size={16} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-[#0d2138]" style={mont}>{t.name}</span>
                      {t.description && <span className="truncate text-[11px] text-[#6a7282]" style={mont}>{t.description}</span>}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>Used {usedCounts[t.templateId] ?? 0}x</p>
                  {canSend && (
                    <button
                      type="button"
                      onClick={() => openSendModal(t.templateId)}
                      className="flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1e4f86] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                      style={mont}
                    >
                      <Send size={13} /> Use Template
                    </button>
                  )}
                </div>
              ))}
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

function EnvelopeRow({ envelope, canVoid, canResend }: { envelope: DocusignEnvelopeDto; canVoid: boolean; canResend: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const voidMutation = useVoidEnvelopeMutation();
  const resendMutation = useResendEnvelopeMutation();
  const isPending = envelope.status === EnvelopeStatus.SENT || envelope.status === EnvelopeStatus.DELIVERED;

  async function handleVoid() {
    const reason = window.prompt("Reason for voiding this envelope?");
    if (!reason) return;
    try {
      await voidMutation.mutateAsync({ id: envelope.id, reason });
      toast.success("Envelope voided");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void envelope");
    }
    setMenuOpen(false);
  }

  async function handleResend() {
    try {
      await resendMutation.mutateAsync(envelope.id);
      toast.success("Reminder sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    }
    setMenuOpen(false);
  }

  return (
    <tr className="border-b border-[#e5e7eb] last:border-b-0">
      <td className="px-5 py-4">
        <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{envelope.templateName}</span>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[13px] text-[#0d2138]" style={mont}>{envelope.recipientName}</span>
          <span className="text-[11px] text-[#9ca3af]" style={mont}>{envelope.recipientEmail}</span>
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
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-5 top-11 z-10 w-[160px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]">
                {canResend && (
                  <button type="button" onClick={handleResend} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]" style={mont}>
                    <RefreshCw size={13} /> Resend reminder
                  </button>
                )}
                {canVoid && (
                  <button type="button" onClick={handleVoid} className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#fb2c36] hover:bg-[#fff1f2]" style={mont}>
                    <XCircle size={13} /> Void envelope
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

function SettingsTabContent() {
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
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  function copyWebhookUrl() {
    const url = `${window.location.origin}/api/webhooks/docusign`;
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
        <Loader2 size={18} className="animate-spin" /> <span className="text-[14px]" style={mont}>Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {saved && (
        <div role="status" className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] leading-5 text-[#008236]" style={mont}>
          Settings saved successfully.
        </div>
      )}

      {/* API Credentials — read-only status, sourced from env vars */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>API Credentials</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>Configured via environment variables — not editable here.</p>
        <div className="flex flex-col divide-y divide-[#f3f4f6]">
          {[
            ["Integration Key", config?.integrationKey],
            ["User ID", config?.userId],
            ["Account ID", config?.accountId],
            ["Private Key", config?.privateKey],
          ].map(([label, ok]) => (
            <div key={label as string} className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-[#0d2138]" style={mont}>{label}</span>
              <span className={`text-[12px] font-medium ${ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} style={mont}>
                {ok ? "Configured" : "Not configured"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook configuration */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Webhook Configuration</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>Paste this URL into DocuSign Connect (Admin → Connect) with HMAC signing enabled.</p>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5">
          <span className="flex-1 truncate text-[12px] text-[#0d2138]" style={mont}>/api/webhooks/docusign</span>
          <button type="button" onClick={copyWebhookUrl} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <Copy size={14} />
          </button>
        </div>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>Events: envelope-completed, envelope-declined, envelope-voided, recipient-viewed</p>
      </div>

      {/* Signature defaults */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Signature Defaults</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>Auto-send reminders</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>Automatically remind recipients before expiry</span>
          </div>
          <Toggle checked={settings.autoSendReminders} onChange={(v) => toggle("autoSendReminders", v)} label="Auto-send reminders" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>Email notifications</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>Notify agents on signature events via email</span>
          </div>
          <Toggle checked={settings.emailNotifications} onChange={(v) => toggle("emailNotifications", v)} label="Email notifications" />
        </div>
        <div className="flex items-center justify-between gap-3 opacity-60">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>SMS notifications</span>
            <span className="text-[11px] text-[#6a7282]" style={mont}>Coming soon — no SMS provider configured yet</span>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled label="SMS notifications (coming soon)" />
        </div>
      </div>
    </div>
  );
}
