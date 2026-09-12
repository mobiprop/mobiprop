"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { MapPin, BedDouble, Bath, Maximize, Eye, Pencil, Trash2, Star, Pause, Play } from "lucide-react";

import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import {
  FALLBACK_LISTING_IMAGE,
  formatListingPrice,
} from "../listings-data";
import { ListingStatusControl, type ListingRowActions } from "./ListingListView";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function ListingCard({ listing, actions }: { listing: DashboardListingDto; actions: ListingRowActions }) {
  const { t } = useTranslation("dashboardListings");

  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-[192px] bg-[#f3f4f6]">
        <Image
          src={listing.coverImageUrl ?? FALLBACK_LISTING_IMAGE}
          alt={listing.title}
          fill
          sizes="(max-width:1280px) 50vw, 373px"
          className="object-cover"
        />
        {listing.isFeatured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#1e4f86] text-white text-[11px] font-medium" style={mont}>
            <Star size={11} className="fill-white" />
            {t("grid.featured")}
          </span>
        )}
        <div className="absolute top-3 right-3 w-[125px]"><ListingStatusControl listing={listing} actions={actions} /></div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-[#0d2138]" style={mont}>{listing.title}</p>
          <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
            <MapPin size={14} className="text-[#6a7282]" />
            {listing.location}
          </span>
        </div>

        <p className="text-[20px] font-semibold text-[#1e4f86]" style={poppins}>{formatListingPrice(listing, t)}</p>

        <div className="flex items-center gap-4 text-[12px] text-[#2b3038]" style={mont}>
          <span className="flex items-center gap-1.5"><BedDouble size={14} className="text-[#6a7282]" />{listing.bedrooms ?? 0} {t("grid.bed")}</span>
          <span className="flex items-center gap-1.5"><Bath size={14} className="text-[#6a7282]" />{listing.bathrooms ?? 0} {t("grid.bath")}</span>
          <span className="flex items-center gap-1.5"><Maximize size={14} className="text-[#6a7282]" />{listing.totalAreaM2 ?? 0} m²</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
            <Eye size={14} />
            {listing.viewsCount} {t("grid.views")}
          </span>
          <div className="flex items-center gap-2">
            {actions.canUpdate && (
              <button type="button" title={t("grid.editTitle")} onClick={() => actions.onEdit(listing)} className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#1e4f86] hover:bg-[#f9fafb] transition-colors"><Pencil size={14} /></button>
            )}
            {actions.canPause && (
              <button
                type="button"
                title={listing.status === "ACTIVE" ? t("grid.pauseTitle") : t("grid.activateTitle")}
                onClick={() => actions.onToggleStatus(listing)}
                className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#1e4f86] hover:bg-[#f9fafb] transition-colors"
              >
                {listing.status === "ACTIVE" ? <Pause size={14} /> : <Play size={14} />}
              </button>
            )}
            {actions.canFeature && (
              <button
                type="button"
                title={listing.isFeatured ? t("grid.removeFromFeaturedTitle") : t("grid.markAsFeaturedTitle")}
                onClick={() => actions.onToggleFeatured(listing)}
                className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#f59e0b] hover:bg-[#f9fafb] transition-colors"
              >
                <Star size={14} className={listing.isFeatured ? "text-[#f59e0b] fill-[#f59e0b]" : undefined} />
              </button>
            )}
            {actions.canDelete && (
              <button type="button" title={t("grid.deleteTitle")} onClick={() => actions.onDelete(listing)} className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#e7000b] hover:bg-[#fff5f5] transition-colors"><Trash2 size={14} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingGridView({
  listings,
  actions,
}: {
  listings: DashboardListingDto[];
  actions: ListingRowActions;
}) {
  const { t } = useTranslation("dashboardListings");
  if (listings.length === 0) {
    return (
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] py-16 text-center text-[14px] text-[#6a7282]" style={mont}>
        {t("grid.noListingsFound")}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} actions={actions} />
      ))}
    </div>
  );
}
