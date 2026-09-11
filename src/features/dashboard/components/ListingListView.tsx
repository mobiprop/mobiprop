"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Eye, SquarePen, Pencil, Trash2, MapPin, Pause, Play, Star, Check, Minus, Link2,
} from "lucide-react";

import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import {
  TYPE_BADGE,
  STATUS_BADGE,
  FALLBACK_LISTING_IMAGE,
  formatListingPrice,
} from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

function Badge({
  label,
  style,
  className = "",
  solid = false,
}: {
  label: string;
  solid?: boolean;
  style: { bg: string; text: string };
  /** Extra classes — e.g. a max-width + truncate cap for the desktop table,
   *  where "Oficina Comercial" or "Casa Adosada" would otherwise force the
   *  whole Type column wide for every row. */
  className?: string;
}) {
  const ink = ({ "#bb4d00": "#fe623a", "#0069a8": "#005089", "#008236": "#00786f", "#e17100": "#fe623a", "#e7000b": "#5486b9" } as Record<string, string>)[style.text] ?? style.text;
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center truncate px-3 py-1 rounded-[6px] text-[12px] font-medium ${className}`}
      style={{ backgroundColor: solid ? style.bg : `color-mix(in srgb, ${ink} 4%, white)`, color: solid ? (style.text === "#e17100" ? "#bb4d00" : style.text) : ink, border: solid ? "1px solid transparent" : `1px solid color-mix(in srgb, ${ink} 30%, transparent)`, ...mont }}
      title={label}
    >
      {label}
    </span>
  );
}

function RowCheckbox({
  checked,
  indeterminate = false,
  onToggle,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onToggle}
      className={`flex size-[19px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
        checked || indeterminate
          ? "border-[#235b96] bg-[#235b96]"
          : "border-[#d9dde3] bg-white"
      }`}
    >
      {indeterminate ? (
        <Minus size={13} strokeWidth={2.6} className="text-white" />
      ) : checked ? (
        <Check size={13} strokeWidth={2.6} className="text-white" />
      ) : null}
    </button>
  );
}

export type ListingRowActions = {
  canUpdate: boolean;
  canPause: boolean;
  canFeature: boolean;
  canDelete: boolean;
  onEdit: (listing: DashboardListingDto) => void;
  onToggleStatus: (listing: DashboardListingDto) => void;
  onToggleFeatured: (listing: DashboardListingDto) => void;
  onDelete: (listing: DashboardListingDto) => void;
};

export type ListingSelection = {
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
};

type ListingListViewProps = {
  listings: DashboardListingDto[];
  actions: ListingRowActions;
  selection: ListingSelection;
};

export function ListingListView({ listings, actions, selection }: ListingListViewProps) {
  const { t } = useTranslation("dashboardListings");
  const { t: td } = useTranslation("dashboard");
  const selectedCount = listings.filter((listing) => selection.selectedIds.has(listing.id)).length;
  const allSelected = listings.length > 0 && selectedCount === listings.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function handleCopyLink(listing: DashboardListingDto) {
    const url = `${window.location.origin}/listings/${listing.slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t("list.linkCopied")))
      .catch(() => toast.error(t("list.linkCopyFailed")));
  }
return (
  <div className="dashboard-listings-table overflow-hidden rounded-[14px] border border-[#e9e9e9] bg-white">
    {/* Header */}
    <div className="flex min-h-[76px] items-center px-5 py-5">
      <h2
        className="text-[16px] font-semibold text-[#0d2138]"
        style={mont}
      >
        {t("list.title")}
      </h2>
    </div>

    {/* Desktop table - same design */}
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1100px] table-fixed">
        {/* Preserve bulk selection alongside the reference table's direct actions. */}
        <colgroup>
          <col style={{ width: "4%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>

        <thead>
          <tr className="border-y border-[#e5e7eb] bg-[#f9fafb]">
            <th className="px-3 py-4">
              <RowCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onToggle={selection.onToggleAll}
                label={allSelected ? t("list.deselectAllAria") : t("list.selectAllAria")}
              />
            </th>

            {[
              t("list.columns.listingId"),
              t("list.columns.property"),
              t("list.columns.type"),
              t("list.columns.price"),
              t("list.columns.bedrooms"),
              t("list.columns.operationType"),
              t("list.columns.status"),
            ].map((heading) => (
              <th
                key={heading}
                className="px-3 py-3 text-left text-[13px] font-medium leading-5 text-[#6c6c6c]"
                style={mont}
                title={heading}
              >
                {heading}
              </th>
            ))}

            <th
              className="px-3 py-3 text-left text-[13px] font-medium leading-5 text-[#6c6c6c]"
              style={mont}
              title={t("list.actionsTitle")}
            >
              {t("list.actionsTitle")}
            </th>
          </tr>
        </thead>

        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className={`border-b border-[#e5e7eb] last:border-b-0 ${
                selection.selectedIds.has(listing.id) ? "bg-[#eff6ff]" : ""
              }`}
            >
              <td className="px-3 py-4">
                <RowCheckbox
                  checked={selection.selectedIds.has(listing.id)}
                  onToggle={() => selection.onToggleOne(listing.id)}
                  label={t("list.selectRowAria", { title: listing.title })}
                />
              </td>

              {/* Listing ID */}
              <td className="px-3 py-4">
                <span
                  className="block truncate text-[14px] font-medium text-[#232323]"
                  style={mont}
                >
                  {listing.listingId}
                </span>
              </td>

              {/* Property */}
              <td className="px-3 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-[52px] w-16 shrink-0 overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                    <Image
                      src={
                        listing.coverImageUrl ??
                        FALLBACK_LISTING_IMAGE
                      }
                      alt={listing.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className="flex items-center gap-1.5 text-[14px] font-medium text-[#232323]"
                      style={mont}
                    >
                      <span className="truncate">{listing.title}</span>

                      {listing.isFeatured && (
                        <Star
                          size={13}
                          className="shrink-0 fill-[#f59e0b] text-[#f59e0b]"
                        />
                      )}
                    </span>

                    <span
                      className="flex items-center gap-1 text-[12px] text-[#6a7282]"
                      style={mont}
                    >
                      <MapPin size={16} strokeWidth={1.6} className="shrink-0 text-[#005089]" />
                      <span className="truncate">{listing.location}</span>
                    </span>
                  </div>
                </div>
              </td>

              {/* Type */}
              <td className="px-3 py-4">
                <Badge
                  label={td(`propertyType.${listing.type}`)}
                  style={TYPE_BADGE[listing.type]}
                />
              </td>

              {/* Price */}
              <td className="px-3 py-4">
                <span
                  className="block text-[14px] font-normal leading-5 text-[#232323]"
                  style={mont}
                >
                  {formatListingPrice(listing, t)}
                </span>
              </td>

              {/* Bedrooms */}
              <td className="px-3 py-4">
                <span
                  className="text-[14px] text-[#4f4f4f]"
                  style={mont}
                >
                  {listing.bedrooms ?? "—"}
                </span>
              </td>

              {/* Operation type */}
              <td className="px-3 py-4">
                <span
                  className="block truncate text-[14px] text-[#4f4f4f]"
                  style={mont}
                >
                  {td(`operationType.${listing.operationType}`)}
                </span>
              </td>

              {/* Status */}
              <td className="px-3 py-4">
                <Badge
                  label={td(`status.${listing.status}`)}
                  solid
                  style={STATUS_BADGE[listing.status]}
                />
              </td>

              {/* Actions */}
              <td className="px-2 py-4">
                <div className="grid grid-cols-3 justify-items-center gap-0.5 min-[1800px]:flex min-[1800px]:justify-end">
                  <a href={`/listings/${listing.slug}`} target="_blank" rel="noopener noreferrer" title={t("listings:card.viewProperty")} aria-label={`${t("listings:card.viewProperty")}: ${listing.title}`} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-[#f0f6fa] hover:text-[#005089]">
                    <Eye size={17} strokeWidth={1.6} />
                  </a>
                  {actions.canUpdate && <button type="button" title={t("list.editTitle")} aria-label={`${t("list.editTitle")}: ${listing.title}`} onClick={() => actions.onEdit(listing)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-[#f0f6fa] hover:text-[#005089]"><SquarePen size={17} strokeWidth={1.6} /></button>}
                  {actions.canDelete && <button type="button" title={t("list.deleteTitle")} aria-label={`${t("list.deleteTitle")}: ${listing.title}`} onClick={() => actions.onDelete(listing)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-red-50 hover:text-red-600"><Trash2 size={17} strokeWidth={1.6} /></button>}
                  {actions.canFeature && (
                    <button type="button" title={t(listing.isFeatured ? "list.removeFromFeaturedTitle" : "list.markAsFeaturedTitle")} aria-label={`${t(listing.isFeatured ? "list.removeFromFeaturedTitle" : "list.markAsFeaturedTitle")}: ${listing.title}`} aria-pressed={listing.isFeatured} onClick={() => actions.onToggleFeatured(listing)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-amber-50">
                      <Star size={17} strokeWidth={1.6} className={listing.isFeatured ? "fill-[#f59e0b] text-[#f59e0b]" : ""} />
                    </button>
                  )}
                  <button type="button" title={t("list.copyLinkTitle")} aria-label={`${t("list.copyLinkTitle")}: ${listing.title}`} onClick={() => handleCopyLink(listing)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-[#f0f6fa] hover:text-[#005089]">
                    <Link2 size={17} strokeWidth={1.6} />
                  </button>
                  {actions.canPause && (
                    <button type="button" title={t(listing.status === "ACTIVE" ? "list.pauseTitle" : "list.activateTitle")} aria-label={`${t(listing.status === "ACTIVE" ? "list.pauseTitle" : "list.activateTitle")}: ${listing.title}`} onClick={() => actions.onToggleStatus(listing)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6c6c6c] hover:bg-[#f0f6fa] hover:text-[#005089]">
                      {listing.status === "ACTIVE" ? <Pause size={17} strokeWidth={1.6} /> : <Play size={17} strokeWidth={1.6} />}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {listings.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="px-2 py-10 text-center text-[14px] text-[#6a7282]"
                style={mont}
              >
                {t("list.noListingsFound")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Tablet and mobile */}
    <div className="border-t border-[#e5e7eb] lg:hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className={`border-b border-[#e5e7eb] p-4 md:border-r md:even:border-r-0 ${
              selection.selectedIds.has(listing.id) ? "bg-[#eff6ff]" : ""
            }`}
          >
            {/* Top section */}
            <div className="flex gap-3">
              <div className="pt-1">
                <RowCheckbox
                  checked={selection.selectedIds.has(listing.id)}
                  onToggle={() => selection.onToggleOne(listing.id)}
                  label={t("list.selectRowAria", { title: listing.title })}
                />
              </div>

              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[#f3f4f6] sm:size-[82px]">
                <Image
                  src={
                    listing.coverImageUrl ??
                    FALLBACK_LISTING_IMAGE
                  }
                  alt={listing.title}
                  fill
                  sizes="(max-width: 639px) 72px, 82px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="block truncate text-[12px] font-medium text-[#1e4f86]"
                      style={mont}
                    >
                      {listing.listingId}
                    </span>

                    <h3
                      className="mt-1 flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-[#0d2138]"
                      style={mont}
                    >
                      <span className="truncate">
                        {listing.title}
                      </span>

                      {listing.isFeatured && (
                        <Star
                          size={13}
                          className="shrink-0 fill-[#f59e0b] text-[#f59e0b]"
                        />
                      )}
                    </h3>
                  </div>

                  <Badge
                    label={td(`status.${listing.status}`)}
                    solid
                  style={STATUS_BADGE[listing.status]}
                  />
                </div>

                <p
                  className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-[#6a7282]"
                  style={mont}
                >
                  <MapPin size={16} strokeWidth={1.6} className="shrink-0 text-[#005089]" />

                  <span className="truncate">
                    {listing.location}
                  </span>
                </p>

                <p
                  className="mt-2 text-[15px] font-semibold text-[#0d2138]"
                  style={mont}
                >
                  {formatListingPrice(listing, t)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[10px] bg-[#f9fafb] p-3">
              <div>
                <p
                  className="text-[11px] text-[#99a1af]"
                  style={mont}
                >
                  {t("list.typeLabel")}
                </p>

                <div className="mt-1">
                  <Badge
                    label={td(`propertyType.${listing.type}`)}
                    style={TYPE_BADGE[listing.type]}
                  />
                </div>
              </div>

              <div>
                <p
                  className="text-[11px] text-[#99a1af]"
                  style={mont}
                >
                  {t("list.bedroomsLabel")}
                </p>

                <p
                  className="mt-1 text-[13px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {listing.bedrooms ?? "—"}
                </p>
              </div>

              <div className="col-span-2">
                <p
                  className="text-[11px] text-[#99a1af]"
                  style={mont}
                >
                  {t("list.operationTypeLabel")}
                </p>

                <p
                  className="mt-1 text-[13px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {td(`operationType.${listing.operationType}`)}
                </p>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                title={t("list.copyLinkTitle")}
                onClick={() => handleCopyLink(listing)}
                className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#99a1af] transition-colors hover:bg-[#f8fafc] hover:text-[#1e4f86]"
              >
                <Link2 size={16} />
              </button>

              {actions.canUpdate && (
                <button
                  type="button"
                  title={t("list.editTitle")}
                  onClick={() => actions.onEdit(listing)}
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#99a1af] transition-colors hover:bg-[#f8fafc] hover:text-[#1e4f86]"
                >
                  <Pencil size={16} />
                </button>
              )}

              {actions.canPause && (
                <button
                  type="button"
                  title={
                    listing.status === "ACTIVE"
                      ? t("list.pauseTitle")
                      : t("list.activateTitle")
                  }
                  onClick={() =>
                    actions.onToggleStatus(listing)
                  }
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#99a1af] transition-colors hover:bg-[#f8fafc] hover:text-[#1e4f86]"
                >
                  {listing.status === "ACTIVE" ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
              )}

              {actions.canFeature && (
                <button
                  type="button"
                  title={
                    listing.isFeatured
                      ? t("list.removeFromFeaturedTitle")
                      : t("list.markAsFeaturedTitle")
                  }
                  onClick={() =>
                    actions.onToggleFeatured(listing)
                  }
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#99a1af] transition-colors hover:bg-[#f8fafc] hover:text-[#f59e0b]"
                >
                  <Star
                    size={16}
                    className={
                      listing.isFeatured
                        ? "fill-[#f59e0b] text-[#f59e0b]"
                        : undefined
                    }
                  />
                </button>
              )}

              {actions.canDelete && (
                <button
                  type="button"
                  title={t("list.deleteTitle")}
                  onClick={() => actions.onDelete(listing)}
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#99a1af] transition-colors hover:bg-[#f8fafc] hover:text-[#e7000b]"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {listings.length === 0 && (
        <div
          className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
          style={mont}
        >
          {t("list.noListingsFound")}
        </div>
      )}
    </div>
  </div>
);
}