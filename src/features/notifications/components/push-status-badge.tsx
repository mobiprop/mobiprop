"use client";

import { useTranslation } from "react-i18next";

import type { PushCapabilityStatus } from "@/features/notifications/utils/push-capability";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const STATUS_META: Record<PushCapabilityStatus, { i18nKey: string; className: string }> = {
  unsupported: { i18nKey: "notifications.push.status.unsupported", className: "bg-[#f3f4f6] text-[#6a7282]" },
  "permission-default": { i18nKey: "notifications.push.status.disabled", className: "bg-[#f3f4f6] text-[#6a7282]" },
  "permission-denied": { i18nKey: "notifications.push.status.blocked", className: "bg-[#fef2f2] text-[#dc2626]" },
  "permission-granted-no-subscription": { i18nKey: "notifications.push.status.actionNeeded", className: "bg-[#fffbeb] text-[#b45309]" },
  enabled: { i18nKey: "notifications.push.status.enabled", className: "bg-[#ecfdf5] text-[#059669]" },
  error: { i18nKey: "notifications.push.status.error", className: "bg-[#fef2f2] text-[#dc2626]" },
};

export function PushStatusBadge({ status }: { status: PushCapabilityStatus }) {
  const { t } = useTranslation("dashboardSettings");
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[11px] font-semibold ${meta.className}`}
      style={mont}
    >
      {t(meta.i18nKey)}
    </span>
  );
}
