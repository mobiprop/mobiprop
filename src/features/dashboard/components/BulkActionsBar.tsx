"use client";

import { Star, StarOff, Pause, Play, Archive, Trash2, UserPlus, X, Loader2 } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type BulkActionsBarProps = {
  selectedCount: number;
  busy: boolean;
  canFeature: boolean;
  canPause: boolean;
  canDelete: boolean;
  canAssign: boolean;
  onClear: () => void;
  onFeature: () => void;
  onUnfeature: () => void;
  onPause: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onAssign: () => void;
};

function BulkActionButton({
  label,
  icon,
  onClick,
  busy,
  variant = "default",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex h-9 items-center justify-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "danger"
          ? "border-[#fecaca] bg-white text-[#e7000b] hover:bg-[#fef2f2]"
          : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]"
      }`}
      style={mont}
    >
      {icon}
      {label}
    </button>
  );
}

export function BulkActionsBar({
  selectedCount,
  busy,
  canFeature,
  canPause,
  canDelete,
  canAssign,
  onClear,
  onFeature,
  onUnfeature,
  onPause,
  onActivate,
  onArchive,
  onDelete,
  onAssign,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border border-[#1e4f86]/20 bg-[#eff6ff] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#1e4f86] transition-colors hover:bg-white"
        >
          <X size={15} />
        </button>

        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
          {selectedCount} listing{selectedCount === 1 ? "" : "s"} selected
        </p>

        {busy && <Loader2 size={15} className="animate-spin text-[#1e4f86]" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canFeature && (
          <>
            <BulkActionButton label="Feature" icon={<Star size={15} />} onClick={onFeature} busy={busy} />
            <BulkActionButton label="Unfeature" icon={<StarOff size={15} />} onClick={onUnfeature} busy={busy} />
          </>
        )}

        {canPause && (
          <>
            <BulkActionButton label="Pause" icon={<Pause size={15} />} onClick={onPause} busy={busy} />
            <BulkActionButton label="Activate" icon={<Play size={15} />} onClick={onActivate} busy={busy} />
            <BulkActionButton label="Archive" icon={<Archive size={15} />} onClick={onArchive} busy={busy} />
          </>
        )}

        {canAssign && (
          <BulkActionButton label="Assign Agent" icon={<UserPlus size={15} />} onClick={onAssign} busy={busy} />
        )}

        {canDelete && (
          <BulkActionButton
            label="Delete"
            icon={<Trash2 size={15} />}
            onClick={onDelete}
            busy={busy}
            variant="danger"
          />
        )}
      </div>
    </section>
  );
}
