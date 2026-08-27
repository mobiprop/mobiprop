"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { EnablePushButton } from "@/features/notifications/components/enable-push-button";
import { PushStatusBadge } from "@/features/notifications/components/push-status-badge";
import {
  PushEnableError,
  useEnablePushMutation,
} from "@/features/notifications/queries/use-enable-push-mutation";
import { useDisablePushMutation } from "@/features/notifications/queries/use-disable-push-mutation";
import { usePushStatusQuery } from "@/features/notifications/queries/use-push-status-query";
import { useTestPushMutation } from "@/features/notifications/queries/use-test-push-mutation";
import {
  getNotificationPermission,
  isIos,
  isStandalonePwa,
  type PushCapabilityStatus,
} from "@/features/notifications/utils/push-capability";

const mont = { fontFamily: "'Montserrat', sans-serif" };

// Read Notification.permission as an external store: correct SSR snapshot (null)
// avoids hydration mismatch, and it is re-read on every render (e.g. after the
// status query invalidates following enable/disable) without an effect.
const noopSubscribe = () => () => {};
function useNotificationPermission(): NotificationPermission | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => getNotificationPermission(),
    () => null,
  );
}

function computeStatus(
  supported: boolean,
  permission: NotificationPermission | null,
  hasActiveSubscription: boolean,
): PushCapabilityStatus {
  if (!supported) return "unsupported";
  if (permission === "denied") return "permission-denied";
  if (permission === "granted") {
    return hasActiveSubscription ? "enabled" : "permission-granted-no-subscription";
  }
  return "permission-default";
}

export function PushNotificationSettings() {
  const { t } = useTranslation("dashboardSettings");
  const { data, isLoading } = usePushStatusQuery();
  const enableMutation = useEnablePushMutation();
  const disableMutation = useDisablePushMutation();
  const testMutation = useTestPushMutation();

  const permission = useNotificationPermission();

  const supported = data?.supported ?? false;
  const serverConfigured = data?.serverConfigured ?? false;
  const hasActiveSubscription = data?.hasActiveSubscription ?? false;
  const status = computeStatus(supported, permission, hasActiveSubscription);

  const iosNeedsInstall = supported === false && isIos() && !isStandalonePwa();

  async function handleEnable() {
    try {
      await enableMutation.mutateAsync();
      toast.success(t("notifications.push.toasts.enabled"));
    } catch (error) {
      if (error instanceof PushEnableError && error.code === "permission-denied") {
        toast.error(t("notifications.push.toasts.permissionBlocked"));
        return;
      }
      toast.error(t("notifications.push.toasts.enableFailed"));
    }
  }

  async function handleDisable() {
    try {
      const result = await disableMutation.mutateAsync();
      if (!result.browserUnsubscribed) {
        toast.warning(t("notifications.push.toasts.serverDisabled"));
      } else {
        toast.success(t("notifications.push.toasts.disabled"));
      }
    } catch {
      toast.error(t("notifications.push.toasts.disableFailed"));
    }
  }

  async function handleTest() {
    try {
      const result = await testMutation.mutateAsync();
      if (result.sent > 0) {
        toast.success(t("notifications.push.toasts.testSent"));
      } else if (result.skipped > 0) {
        toast.warning(t("notifications.push.toasts.testSkipped"));
      } else {
        toast.error(t("notifications.push.toasts.testFailed"));
      }
    } catch {
      toast.error(t("notifications.push.toasts.testFailedGeneric"));
    }
  }

  return (
    <div className="rounded-[10px] border border-[#d1d5dc] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
              {t("notifications.push.title")}
            </p>
            <PushStatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-[12px] text-[#6a7282]" style={mont}>
            {t("notifications.push.description")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status === "enabled" ? (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testMutation.isPending}
                className="inline-flex h-9 items-center justify-center rounded-[9px] border border-[#d1d5dc] px-4 text-[13px] font-semibold text-[#0d2138] transition-colors hover:bg-[#f3f4f6] disabled:opacity-50"
                style={mont}
              >
                {testMutation.isPending ? t("notifications.push.sending") : t("notifications.push.sendTest")}
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={disableMutation.isPending}
                className="inline-flex h-9 items-center justify-center rounded-[9px] border border-[#fecaca] px-4 text-[13px] font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:opacity-50"
                style={mont}
              >
                {disableMutation.isPending ? t("notifications.push.working") : t("notifications.push.disableOnDevice")}
              </button>
            </>
          ) : (
            <EnablePushButton
              onClick={handleEnable}
              loading={enableMutation.isPending}
              disabled={!supported || !serverConfigured || isLoading || status === "permission-denied"}
              label={
                status === "permission-granted-no-subscription"
                  ? t("notifications.push.reEnable")
                  : t("notifications.push.enable")
              }
            />
          )}
        </div>
      </div>

      {/* Contextual guidance */}
      {!isLoading && !serverConfigured && supported && (
        <p className="mt-3 text-[12px] text-[#b45309]" style={mont}>
          {t("notifications.push.notConfigured")}
        </p>
      )}
      {status === "permission-denied" && (
        <p className="mt-3 text-[12px] text-[#dc2626]" style={mont}>
          {t("notifications.push.blocked")}
        </p>
      )}
      {iosNeedsInstall && (
        <p className="mt-3 text-[12px] text-[#6a7282]" style={mont}>
          {t("notifications.push.iosInstall")}
        </p>
      )}
      {status === "unsupported" && !iosNeedsInstall && (
        <p className="mt-3 text-[12px] text-[#6a7282]" style={mont}>
          {t("notifications.push.unsupported")}
        </p>
      )}
    </div>
  );
}
