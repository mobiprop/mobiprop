"use client";

import type { PushCapabilityStatus } from "@/features/notifications/utils/push-capability";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const STATUS_META: Record<PushCapabilityStatus, { label: string; className: string }> = {
  unsupported: { label: "Not supported", className: "bg-[#f3f4f6] text-[#6a7282]" },
  "permission-default": { label: "Disabled", className: "bg-[#f3f4f6] text-[#6a7282]" },
  "permission-denied": { label: "Blocked", className: "bg-[#fef2f2] text-[#dc2626]" },
  "permission-granted-no-subscription": { label: "Action needed", className: "bg-[#fffbeb] text-[#b45309]" },
  enabled: { label: "Enabled", className: "bg-[#ecfdf5] text-[#059669]" },
  error: { label: "Error", className: "bg-[#fef2f2] text-[#dc2626]" },
};

export function PushStatusBadge({ status }: { status: PushCapabilityStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[11px] font-semibold ${meta.className}`}
      style={mont}
    >
      {meta.label}
    </span>
  );
}
