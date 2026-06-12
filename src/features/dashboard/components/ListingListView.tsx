"use client";

import Image from "next/image";
import { Search, Filter, ChevronDown, Pencil, Trash2, MapPin, Pause, Play, Star } from "lucide-react";

import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import {
  TYPE_BADGE,
  STATUS_BADGE,
  TYPE_LABELS,
  STATUS_LABELS,
  OPERATION_LABELS,
  FALLBACK_LISTING_IMAGE,
  formatListingPrice,
} from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

function Badge({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text, ...mont }}
    >
      {label}
    </span>
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

type ListingListViewProps = {
  listings: DashboardListingDto[];
  onFilterClick: () => void;
  actions: ListingRowActions;
};

export function ListingListView({ listings, onFilterClick, actions }: ListingListViewProps) {
  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Listings</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
            <Search size={16} className="text-[#99a1af] shrink-0" />
            <input
              placeholder="Search listings..."
              className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
              style={mont}
            />
          </div>
          <button
            type="button"
            onClick={onFilterClick}
            className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
            style={mont}
          >
            Filter
            <Filter size={16} />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af]"
            style={mont}
          >
            Last Month
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
              {["Listing ID", "Property", "Type", "Price", "Bedrooms", "Operation Type", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-[14px] font-medium text-[#6a7282] text-left whitespace-nowrap" style={mont}>{h}</th>
              ))}
              <th className="px-5 py-3 w-[140px]" />
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-[#e5e7eb] last:border-b-0">
                {/* Listing ID */}
                <td className="px-5 py-4">
                  <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{listing.listingId}</span>
                </td>
                {/* Property */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 rounded-[8px] overflow-hidden shrink-0 bg-[#f3f4f6]">
                      <Image
                        src={listing.coverImageUrl ?? FALLBACK_LISTING_IMAGE}
                        alt={listing.title}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>
                        {listing.title}
                        {listing.isFeatured && <Star size={13} className="text-[#f59e0b] fill-[#f59e0b] shrink-0" />}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>
                        <MapPin size={12} />
                        {listing.location}
                      </span>
                    </div>
                  </div>
                </td>
                {/* Type */}
                <td className="px-5 py-4">
                  <Badge label={TYPE_LABELS[listing.type]} style={TYPE_BADGE[listing.type]} />
                </td>
                {/* Price */}
                <td className="px-5 py-4">
                  <span className="text-[14px] font-semibold text-[#0d2138] whitespace-nowrap" style={mont}>{formatListingPrice(listing)}</span>
                </td>
                {/* Bedrooms */}
                <td className="px-5 py-4">
                  <span className="text-[14px] text-[#6a7282]" style={mont}>{listing.bedrooms ?? "—"}</span>
                </td>
                {/* Operation Type */}
                <td className="px-5 py-4">
                  <span className="text-[14px] text-[#6a7282]" style={mont}>{OPERATION_LABELS[listing.operationType]}</span>
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                  <Badge label={STATUS_LABELS[listing.status]} style={STATUS_BADGE[listing.status]} />
                </td>
                {/* Actions */}
                <td className="px-5 py-4 w-[140px]">
                  <div className="flex items-center gap-2 text-[#99a1af]">
                    {actions.canUpdate && (
                      <button type="button" title="Edit" onClick={() => actions.onEdit(listing)} className="hover:text-[#1e4f86] transition-colors"><Pencil size={16} /></button>
                    )}
                    {actions.canPause && (
                      <button
                        type="button"
                        title={listing.status === "ACTIVE" ? "Pause listing" : "Activate listing"}
                        onClick={() => actions.onToggleStatus(listing)}
                        className="hover:text-[#1e4f86] transition-colors"
                      >
                        {listing.status === "ACTIVE" ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    )}
                    {actions.canFeature && (
                      <button
                        type="button"
                        title={listing.isFeatured ? "Remove from featured" : "Mark as featured"}
                        onClick={() => actions.onToggleFeatured(listing)}
                        className="hover:text-[#f59e0b] transition-colors"
                      >
                        <Star size={16} className={listing.isFeatured ? "text-[#f59e0b] fill-[#f59e0b]" : undefined} />
                      </button>
                    )}
                    {actions.canDelete && (
                      <button type="button" title="Delete" onClick={() => actions.onDelete(listing)} className="hover:text-[#e7000b] transition-colors"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                  No listings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
