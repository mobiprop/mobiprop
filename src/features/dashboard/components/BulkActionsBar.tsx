"use client";

import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";
import { PropertyStatus } from "@/generated/prisma/enums";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type BulkActionsBarProps = {
  selectedCount: number;
  busy: boolean;
  canFeature: boolean;
  canPause: boolean;
  canDelete: boolean;
  canAssign: boolean;
  onClear: () => void;
  onStatus: (status: PropertyStatus) => void;
  onFeature: () => void;
  onUnfeature: () => void;
  onPause: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onAssign: () => void;
};

export function BulkActionsBar({
  selectedCount,
  busy,
  canFeature,
  canPause,
  canDelete,
  canAssign,
  onClear,
  onStatus,
  onFeature,
  onUnfeature,
  onArchive,
  onDelete,
  onAssign,
}: BulkActionsBarProps) {
  const { t } = useTranslation("dashboardListings");
  const { t: td } = useTranslation("dashboard");
  if (selectedCount === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border border-[#1e4f86]/20 bg-[#eff6ff] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          aria-label={t("bulkActions.clearSelectionAria")}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#1e4f86] transition-colors hover:bg-white"
        >
          <X size={15} />
        </button>

        <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>
          {t("bulkActions.selectedCount", { count: selectedCount })}
        </p>

        {busy && <Loader2 size={15} className="animate-spin text-[#1e4f86]" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canPause && <SearchableSelect value="" placeholder="Cambiar estado" ariaLabel="Cambiar estado de seleccionadas" searchable={false} disabled={busy}
          options={Object.values(PropertyStatus).map(value => ({ value, label: value === PropertyStatus.INACTIVE ? "Archivar" : td(`status.${value}`) }))}
          onChange={value => value === PropertyStatus.INACTIVE ? onArchive() : onStatus(value as PropertyStatus)} />}
        {canFeature && <SearchableSelect value="" placeholder="Destacadas" ariaLabel="Destacar propiedades seleccionadas" searchable={false} disabled={busy}
          options={[{value:"feature",label:t("bulkActions.feature")},{value:"unfeature",label:t("bulkActions.unfeature")}]}
          onChange={value => value === "feature" ? onFeature() : onUnfeature()} />}
        {(canAssign || canDelete) && <SearchableSelect value="" placeholder="Más acciones" ariaLabel="Acciones para propiedades seleccionadas" searchable={false} disabled={busy}
          options={[...(canAssign ? [{value:"assign",label:t("bulkActions.assignAgent")}] : []), ...(canDelete ? [{value:"delete",label:t("bulkActions.delete")}] : [])]}
          onChange={value => value === "assign" ? onAssign() : onDelete()} />}
      </div>
    </section>
  );
}
