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
  <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
    {/* Header / controls */}
    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-3">
      <h2
        className="text-[16px] font-semibold text-[#0d2138]"
        style={mont}
      >
        All Listings
      </h2>

      <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:w-auto">
        {/* Search */}
        <div className="col-span-2 flex h-9 w-full items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 sm:w-[204px]">
          <Search
            size={16}
            className="shrink-0 text-[#99a1af]"
          />

          <input
            placeholder="Search listings..."
            className="w-full bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af]"
            style={mont}
          />
        </div>

        {/* Filter */}
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 text-[14px] font-medium text-[#99a1af] transition-colors hover:bg-[#f3f4f6]"
          style={mont}
        >
          Filter
          <Filter size={16} />
        </button>

        {/* Date */}
        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 text-[14px] font-medium text-[#99a1af]"
          style={mont}
        >
          Last Month
          <ChevronDown size={16} />
        </button>
      </div>
    </div>

    {/* Desktop table - same design */}
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-y border-[#e5e7eb] bg-[#f9fafb]">
            {[
              "Listing ID",
              "Property",
              "Type",
              "Price",
              "Bedrooms",
              "Operation Type",
              "Status",
            ].map((heading) => (
              <th
                key={heading}
                className="whitespace-nowrap px-5 py-3 text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {heading}
              </th>
            ))}

            <th className="w-[140px] px-5 py-3" />
          </tr>
        </thead>

        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className="border-b border-[#e5e7eb] last:border-b-0"
            >
              {/* Listing ID */}
              <td className="px-5 py-4">
                <span
                  className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86]"
                  style={mont}
                >
                  {listing.listingId}
                </span>
              </td>

              {/* Property */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                    <Image
                      src={
                        listing.coverImageUrl ??
                        FALLBACK_LISTING_IMAGE
                      }
                      alt={listing.title}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className="flex items-center gap-1.5 whitespace-nowrap text-[14px] font-medium text-[#1e4f86]"
                      style={mont}
                    >
                      {listing.title}

                      {listing.isFeatured && (
                        <Star
                          size={13}
                          className="shrink-0 fill-[#f59e0b] text-[#f59e0b]"
                        />
                      )}
                    </span>

                    <span
                      className="flex items-center gap-1 whitespace-nowrap text-[12px] text-[#6a7282]"
                      style={mont}
                    >
                      <MapPin size={12} />
                      {listing.location}
                    </span>
                  </div>
                </div>
              </td>

              {/* Type */}
              <td className="px-5 py-4">
                <Badge
                  label={TYPE_LABELS[listing.type]}
                  style={TYPE_BADGE[listing.type]}
                />
              </td>

              {/* Price */}
              <td className="px-5 py-4">
                <span
                  className="whitespace-nowrap text-[14px] font-semibold text-[#0d2138]"
                  style={mont}
                >
                  {formatListingPrice(listing)}
                </span>
              </td>

              {/* Bedrooms */}
              <td className="px-5 py-4">
                <span
                  className="text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {listing.bedrooms ?? "—"}
                </span>
              </td>

              {/* Operation type */}
              <td className="px-5 py-4">
                <span
                  className="whitespace-nowrap text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {OPERATION_LABELS[listing.operationType]}
                </span>
              </td>

              {/* Status */}
              <td className="px-5 py-4">
                <Badge
                  label={STATUS_LABELS[listing.status]}
                  style={STATUS_BADGE[listing.status]}
                />
              </td>

              {/* Actions */}
              <td className="w-[140px] px-5 py-4">
                <div className="flex items-center gap-2 text-[#99a1af]">
                  {actions.canUpdate && (
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => actions.onEdit(listing)}
                      className="transition-colors hover:text-[#1e4f86]"
                    >
                      <Pencil size={16} />
                    </button>
                  )}

                  {actions.canPause && (
                    <button
                      type="button"
                      title={
                        listing.status === "ACTIVE"
                          ? "Pause listing"
                          : "Activate listing"
                      }
                      onClick={() =>
                        actions.onToggleStatus(listing)
                      }
                      className="transition-colors hover:text-[#1e4f86]"
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
                          ? "Remove from featured"
                          : "Mark as featured"
                      }
                      onClick={() =>
                        actions.onToggleFeatured(listing)
                      }
                      className="transition-colors hover:text-[#f59e0b]"
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
                      title="Delete"
                      onClick={() => actions.onDelete(listing)}
                      className="transition-colors hover:text-[#e7000b]"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {listings.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
                style={mont}
              >
                No listings found.
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
            className="border-b border-[#e5e7eb] p-4 md:border-r md:even:border-r-0"
          >
            {/* Top section */}
            <div className="flex gap-3">
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
                    label={STATUS_LABELS[listing.status]}
                    style={STATUS_BADGE[listing.status]}
                  />
                </div>

                <p
                  className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-[#6a7282]"
                  style={mont}
                >
                  <MapPin size={12} className="shrink-0" />

                  <span className="truncate">
                    {listing.location}
                  </span>
                </p>

                <p
                  className="mt-2 text-[15px] font-semibold text-[#0d2138]"
                  style={mont}
                >
                  {formatListingPrice(listing)}
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
                  Type
                </p>

                <div className="mt-1">
                  <Badge
                    label={TYPE_LABELS[listing.type]}
                    style={TYPE_BADGE[listing.type]}
                  />
                </div>
              </div>

              <div>
                <p
                  className="text-[11px] text-[#99a1af]"
                  style={mont}
                >
                  Bedrooms
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
                  Operation Type
                </p>

                <p
                  className="mt-1 text-[13px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {OPERATION_LABELS[listing.operationType]}
                </p>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="mt-3 flex items-center justify-end gap-2">
              {actions.canUpdate && (
                <button
                  type="button"
                  title="Edit"
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
                      ? "Pause listing"
                      : "Activate listing"
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
                      ? "Remove from featured"
                      : "Mark as featured"
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
                  title="Delete"
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
          No listings found.
        </div>
      )}
    </div>
  </div>
);
}