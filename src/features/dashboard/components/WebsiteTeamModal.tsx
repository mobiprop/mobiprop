"use client";

import { useMemo, useState } from "react";
import { X, Loader2, ArrowUp, ArrowDown, Check, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useWebsiteTeamQuery } from "@/hooks/queries/useWebsiteTeamQuery";
import { useSaveWebsiteTeamMutation } from "@/hooks/mutations/useWebsiteTeamMutation";
import type { WebsiteTeamMemberDto } from "@/features/agents/agent-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const MAX_TITLE_LENGTH = 120;

/** Local editing state — the whole list is submitted as one payload. */
type Row = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  showOnWebsite: boolean;
  titleEs: string;
  titleEn: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WebsiteTeamModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("agents");
  const teamQuery = useWebsiteTeamQuery();

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>
                {t("websiteTeamModal.title")}
              </p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {t("websiteTeamModal.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("websiteTeamModal.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {teamQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[#6a7282]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]" style={mont}>{t("websiteTeamModal.loading")}</span>
          </div>
        ) : teamQuery.isError || !teamQuery.data ? (
          <p className="px-5 py-14 text-center text-[13px] text-[#dc2626]" style={mont}>
            {t("websiteTeamModal.loadFailed")}
          </p>
        ) : (
          // Mounted only once data exists, so the form seeds its state straight
          // from props instead of syncing it in an effect.
          <WebsiteTeamForm members={teamQuery.data.members} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function WebsiteTeamForm({
  members,
  onClose,
}: {
  members: WebsiteTeamMemberDto[];
  onClose: () => void;
}) {
  const { t } = useTranslation("agents");
  const saveMutation = useSaveWebsiteTeamMutation();

  // Ordered list: selected members first (in display order), then the rest.
  // Moving a member up/down reorders this array, which is what gets saved.
  const [rows, setRows] = useState<Row[]>(() =>
    members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl,
      showOnWebsite: m.showOnWebsite,
      titleEs: m.titleEs,
      titleEn: m.titleEn,
    })),
  );

  const selectedRows = useMemo(() => rows.filter((r) => r.showOnWebsite), [rows]);
  const availableRows = useMemo(() => rows.filter((r) => !r.showOnWebsite), [rows]);

  function patch(id: string, changes: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  /** Moves a member within the selected block only — unselected rows have no
   *  position on the public site. */
  function move(id: string, direction: -1 | 1) {
    setRows((prev) => {
      const selected = prev.filter((r) => r.showOnWebsite);
      const rest = prev.filter((r) => !r.showOnWebsite);
      const from = selected.findIndex((r) => r.id === id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= selected.length) return prev;
      const next = [...selected];
      [next[from], next[to]] = [next[to], next[from]];
      return [...next, ...rest];
    });
  }

  function toggle(id: string) {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, showOnWebsite: !r.showOnWebsite } : r,
      );
      // Newly selected members join the end of the selected block; deselected
      // ones drop below it, keeping `rows` in true display order.
      return [
        ...updated.filter((r) => r.showOnWebsite),
        ...updated.filter((r) => !r.showOnWebsite),
      ];
    });
  }

  async function handleSave() {
    const missingTitle = rows.find(
      (r) => r.showOnWebsite && !r.titleEs.trim() && !r.titleEn.trim(),
    );
    if (missingTitle) {
      toast.error(t("websiteTeamModal.toasts.titleRequired", { name: missingTitle.name }));
      return;
    }

    let order = 0;
    const payload = rows.map((r) => ({
      id: r.id,
      showOnWebsite: r.showOnWebsite,
      titleEs: r.titleEs,
      titleEn: r.titleEn,
      order: r.showOnWebsite ? order++ : 0,
    }));

    try {
      await saveMutation.mutateAsync(payload);
      toast.success(t("websiteTeamModal.toasts.saved"));
      onClose();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      toast.error(
        code === "TITLE_REQUIRED"
          ? t("websiteTeamModal.toasts.titleRequiredGeneric")
          : code === "TITLE_TOO_LONG"
            ? t("websiteTeamModal.toasts.titleTooLong")
            : t("websiteTeamModal.toasts.saveFailed"),
      );
    }
  }

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-5">
          {/* Shown on the site */}
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-[#0d2138]" style={mont}>
              {t("websiteTeamModal.shownHeading", { count: selectedRows.length })}
            </p>
            {selectedRows.length === 0 ? (
              <p
                className="rounded-[12px] border border-dashed border-[#c9d6e5] bg-[#fafbfc] px-4 py-6 text-center text-[12px] leading-5 text-[#6a7282]"
                style={mont}
              >
                {t("websiteTeamModal.emptySelection")}
              </p>
            ) : (
              selectedRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-[12px] border border-[#1e4f86]/25 bg-[#f7fbff] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={15} className="shrink-0 text-[#c9d6e5]" aria-hidden="true" />
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked="true"
                      aria-label={t("websiteTeamModal.hideAria", { name: row.name })}
                      onClick={() => toggle(row.id)}
                      className="flex size-[19px] shrink-0 items-center justify-center rounded-[5px] border border-[#235b96] bg-[#235b96]"
                    >
                      <Check size={13} strokeWidth={2.6} className="text-white" />
                    </button>

                    {row.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.avatarUrl}
                        alt=""
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[12px] font-semibold text-white"
                        style={mont}
                      >
                        {initials(row.name)}
                      </span>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] font-semibold text-[#0d2138]" style={mont}>
                        {row.name}
                      </span>
                      <span className="truncate text-[11px] text-[#9ca3af]" style={mont}>
                        {row.email}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(row.id, -1)}
                        disabled={index === 0}
                        aria-label={t("websiteTeamModal.moveUpAria", { name: row.name })}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-[#6a7282] hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(row.id, 1)}
                        disabled={index === selectedRows.length - 1}
                        aria-label={t("websiteTeamModal.moveDownAria", { name: row.name })}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-[#6a7282] hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>
                        {t("websiteTeamModal.titleEs")}
                      </span>
                      <input
                        value={row.titleEs}
                        onChange={(e) => patch(row.id, { titleEs: e.target.value })}
                        maxLength={MAX_TITLE_LENGTH}
                        placeholder={t("websiteTeamModal.titleEsPlaceholder")}
                        className="min-h-[40px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
                        style={mont}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>
                        {t("websiteTeamModal.titleEn")}
                      </span>
                      <input
                        value={row.titleEn}
                        onChange={(e) => patch(row.id, { titleEn: e.target.value })}
                        maxLength={MAX_TITLE_LENGTH}
                        placeholder={t("websiteTeamModal.titleEnPlaceholder")}
                        className="min-h-[40px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
                        style={mont}
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Available staff */}
          {availableRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-[#0d2138]" style={mont}>
                {t("websiteTeamModal.availableHeading")}
              </p>
              {availableRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => toggle(row.id)}
                  className="flex items-center gap-3 rounded-[12px] border border-[#e5e7eb] bg-white p-3 text-left transition-colors hover:border-[#c9d6e5] hover:bg-[#fafbfc]"
                >
                  <span
                    role="checkbox"
                    aria-checked="false"
                    aria-label={t("websiteTeamModal.showAria", { name: row.name })}
                    className="flex size-[19px] shrink-0 items-center justify-center rounded-[5px] border border-[#d9dde3] bg-white"
                  />
                  {row.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.avatarUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] text-[12px] font-semibold text-[#6a7282]"
                      style={mont}
                    >
                      {initials(row.name)}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-medium text-[#0d2138]" style={mont}>
                      {row.name}
                    </span>
                    <span className="truncate text-[11px] text-[#9ca3af]" style={mont}>
                      {row.email}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-[#e5e7eb] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
          style={mont}
        >
          {t("websiteTeamModal.cancel")}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-6 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
          style={mont}
        >
          {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
          {saveMutation.isPending ? t("websiteTeamModal.saving") : t("websiteTeamModal.save")}
        </button>
      </div>
    </>
  );
}
