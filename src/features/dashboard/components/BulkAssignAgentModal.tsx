"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AgentSelect } from "./AgentSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type BulkAssignAgentModalProps = {
  count: number;
  busy: boolean;
  onClose: () => void;
  onAssign: (agentId: string) => void;
  namespace?: string;
};

export function BulkAssignAgentModal({ count, busy, onClose, onAssign, namespace = "dashboardListings" }: BulkAssignAgentModalProps) {
  const { t } = useTranslation(namespace);
  const [agentId, setAgentId] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-assign-title"
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[18px] border border-[#dedede] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#e9e9e9] px-5 py-5">
          <h2 id="bulk-assign-title" className="text-[17px] font-semibold text-[#202020]" style={mont}>
            {t("bulkAssignModal.title")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("bulkAssignModal.closeAria")}
            className="flex size-8 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#f3f4f6] hover:text-[#111]"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-6">
          <p className="text-[14px] text-[#6a7282]" style={mont}>
            {t("bulkAssignModal.description", { count })}
          </p>

          <AgentSelect value={agentId} onChange={setAgentId} size="default" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e9e9e9] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-[9px] px-4 text-[14px] font-medium text-[#6a7282] transition-colors hover:bg-[#f8fafc]"
            style={mont}
          >
            {t("bulkAssignModal.cancel")}
          </button>

          <button
            type="button"
            disabled={!agentId || busy}
            onClick={() => onAssign(agentId)}
            className="flex h-10 items-center justify-center rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
            style={mont}
          >
            {t("bulkAssignModal.assign")}
          </button>
        </div>
      </div>
    </div>
  );
}
