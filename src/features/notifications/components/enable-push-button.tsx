"use client";

import { useTranslation } from "react-i18next";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type EnablePushButtonProps = {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label?: string;
};

export function EnablePushButton({ onClick, loading, disabled, label }: EnablePushButtonProps) {
  const { t } = useTranslation("dashboardSettings");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex h-9 items-center justify-center rounded-[9px] bg-[#1e4f86] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
      style={mont}
    >
      {loading ? t("notifications.push.working") : (label ?? t("notifications.push.enable"))}
    </button>
  );
}
