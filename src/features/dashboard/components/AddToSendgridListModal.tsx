"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useSendgridListsQuery } from "@/hooks/queries/useSendgridQuery";
import { useAddMembersFromCrmMutation } from "@/hooks/mutations/useSendgridMutations";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type AddToSendgridListModalProps = {
  contactIds: string[];
  onClose: () => void;
  onAdded?: () => void;
};

export function AddToSendgridListModal({ contactIds, onClose, onAdded }: AddToSendgridListModalProps) {
  const { t } = useTranslation("contacts");
  const listsQuery = useSendgridListsQuery();
  const addMutation = useAddMembersFromCrmMutation();
  const lists = listsQuery.data?.lists ?? [];
  const [listId, setListId] = useState("");

  const selectedListId = listId || lists[0]?.id || "";

  async function handleAdd() {
    if (!selectedListId) return;
    try {
      const result = await addMutation.mutateAsync({ listId: selectedListId, contactIds });
      if (result.added > 0) toast.success(t("toasts.addedToSendgrid", { count: result.added }));
      if (result.skippedNoEmail > 0) toast.error(t("toasts.addedToSendgridSkipped", { count: result.skippedNoEmail }));
      onAdded?.();
      onClose();
    } catch {
      toast.error(t("toasts.addToSendgridFailed"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 flex w-full max-w-[440px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>{t("sendgridListModal.title")}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {t("sendgridListModal.subtitle", { count: contactIds.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("sendgridListModal.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          {listsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[#6a7282]">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : lists.length === 0 ? (
            <p className="text-[13px] text-[#6a7282]" style={mont}>{t("sendgridListModal.noListsHint")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>{t("sendgridListModal.listLabel")}</span>
              <select
                value={selectedListId}
                onChange={(e) => setListId(e.target.value)}
                className="min-h-[44px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 text-[13px] text-[#0d2138] focus:border-[#1e4f86] focus:outline-none"
                style={mont}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.memberCount})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-[#e5e7eb] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            style={mont}
          >
            {t("sendgridListModal.cancel")}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleAdd}
            disabled={addMutation.isPending || !selectedListId}
            className="flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-6 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
            style={mont}
          >
            {addMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {addMutation.isPending ? t("sendgridListModal.adding") : t("sendgridListModal.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
