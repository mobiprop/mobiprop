"use client";

import { useState } from "react";
import { Copy, Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useSendgridSettingsQuery, useSendgridStatusQuery } from "@/hooks/queries/useSendgridQuery";
import { useUpdateSendgridSettingsMutation, useTestConnectionMutation } from "@/hooks/mutations/useSendgridMutations";
import type { SendgridConnectionInfo } from "@/lib/sendgrid-marketing";
import { Toggle } from "@/features/dashboard/components/settings/Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

function SettingRow({ title, sub, checked, onChange, disabled }: {
  title: string; sub: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>{title}</span>
        <span className="text-[11px] text-[#6a7282]" style={mont}>{sub}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

export function SettingsTab() {
  const { t } = useTranslation("sendgrid");
  const { data: statusData } = useSendgridStatusQuery();
  const { data: settingsData, isLoading } = useSendgridSettingsQuery(true);
  const updateMutation = useUpdateSendgridSettingsMutation();
  const testMutation = useTestConnectionMutation();
  const [connection, setConnection] = useState<SendgridConnectionInfo | null>(null);

  const config = statusData?.config;
  const settings = settingsData?.settings;

  async function toggle(key: "clickTracking" | "openTracking" | "sandboxMode", value: boolean) {
    try {
      await updateMutation.mutateAsync({ [key]: value });
      toast.success(t("settings.toasts.saved"));
    } catch {
      toast.error(t("settings.toasts.saveFailed"));
    }
  }

  async function handleTestConnection() {
    try {
      const result = await testMutation.mutateAsync();
      setConnection(result.connection);
      if (result.connection.ok) toast.success(t("settings.toasts.connectionVerified"));
      else toast.error(result.connection.error ?? t("settings.toasts.connectionTestFailed"));
    } catch {
      toast.error(t("settings.toasts.connectionTestFailed"));
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/sendgrid`);
    toast.success(t("settings.toasts.webhookCopied"));
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[#6a7282]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]" style={mont}>{t("settings.loading")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* API credentials — status only; the key itself is never sent to the browser */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("settings.apiCredentials.title")}</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>
          {t("settings.apiCredentials.description")}
        </p>
        <div className="flex flex-col divide-y divide-[#f3f4f6]">
          {[
            [t("settings.apiCredentials.apiKey"), config?.apiKey],
            [t("settings.apiCredentials.webhookVerificationKey"), config?.webhookPublicKey],
          ].map(([label, ok]) => (
            <div key={label as string} className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-[#0d2138]" style={mont}>{label as string}</span>
              <span className={`text-[12px] font-medium ${ok ? "text-[#16a34a]" : "text-[#dc2626]"}`} style={mont}>
                {ok ? t("settings.apiCredentials.configured") : t("settings.apiCredentials.notConfigured")}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-[#0d2138]" style={mont}>{t("settings.apiCredentials.campaignSender")}</span>
            <span className="text-[12px] font-medium text-[#0d2138]" style={mont}>{config?.newsletterSender ?? "mailing@ulrichpropiedades.com"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testMutation.isPending || !config?.apiKey}
            className="flex min-h-[38px] items-center gap-2 rounded-[10px] border border-[#1e4f86] px-4 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50"
            style={mont}
          >
            {testMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {t("settings.apiCredentials.testConnection")}
          </button>
          {settings.lastConnectionTestAt && (
            <span className="text-[11px] text-[#9ca3af]" style={mont}>
              {t("settings.apiCredentials.lastVerified", { date: new Date(settings.lastConnectionTestAt).toLocaleString() })}
            </span>
          )}
        </div>

        {connection && (
          <div className={`flex flex-col gap-2 rounded-[10px] border px-4 py-3 ${connection.ok ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fecaca] bg-[#fef2f2]"}`}>
            <span className={`flex items-center gap-2 text-[12px] font-semibold ${connection.ok ? "text-[#15803d]" : "text-[#dc2626]"}`} style={mont}>
              {connection.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {connection.ok ? t("settings.apiCredentials.apiKeyValid") : connection.error ?? t("settings.apiCredentials.connectionFailed")}
            </span>
            {connection.ok && (
              <span className="text-[12px] text-[#15803d]" style={mont}>
                {connection.newsletterSenderReady
                  ? t("settings.apiCredentials.senderReady", { sender: config?.newsletterSender })
                  : t("settings.apiCredentials.senderNotReady", { sender: config?.newsletterSender })}
                {connection.domains.length > 0 &&
                  `${t("settings.apiCredentials.domainsPrefix")}${connection.domains.map((d) => `${d.domain} (${d.valid ? t("settings.apiCredentials.domainValid") : t("settings.apiCredentials.domainPending")})`).join(", ")}.`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Event webhook */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("settings.webhook.title")}</p>
        <p className="text-[12px] text-[#6a7282]" style={mont}>
          {t("settings.webhook.description")}
        </p>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5">
          <span className="flex-1 truncate text-[12px] text-[#0d2138]" style={mont}>/api/webhooks/sendgrid</span>
          <button type="button" onClick={copyWebhookUrl} aria-label={t("settings.webhook.copyAria")} className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
            <Copy size={14} />
          </button>
        </div>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>
          {t("settings.webhook.eventsNote")}
        </p>
      </div>

      {/* Tracking & compliance */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{t("settings.tracking.title")}</p>
        <SettingRow
          title={t("settings.tracking.clickTracking")}
          sub={t("settings.tracking.clickTrackingHint")}
          checked={settings.clickTracking}
          onChange={(v) => toggle("clickTracking", v)}
        />
        <SettingRow
          title={t("settings.tracking.openTracking")}
          sub={t("settings.tracking.openTrackingHint")}
          checked={settings.openTracking}
          onChange={(v) => toggle("openTracking", v)}
        />
        <SettingRow
          title={t("settings.tracking.unsubscribeLink")}
          sub={t("settings.tracking.unsubscribeLinkHint")}
          checked
          onChange={() => {}}
          disabled
        />
        <SettingRow
          title={t("settings.tracking.sandboxMode")}
          sub={t("settings.tracking.sandboxModeHint")}
          checked={settings.sandboxMode}
          onChange={(v) => toggle("sandboxMode", v)}
        />
      </div>
    </div>
  );
}
