"use client";

import Image from "next/image";
import { Search, Filter, ChevronDown, Eye, Pencil, Trash2, MapPin } from "lucide-react";

import { type Listing, TYPE_BADGE, STATUS_BADGE } from "../listings-data";

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

type ListingListViewProps = {
  listings: Listing[];
  onFilterClick: () => void;
};

export function ListingListView({ listings, onFilterClick }: ListingListViewProps) {
  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Listings</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
            <Search size={16} className="text-[#99a1af] shrink-0" />
            <input
              placeholder="Search agents..."
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
              <th className="px-5 py-3 w-[120px]" />
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
                      <Image src={listing.image} alt={listing.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{listing.name}</span>
                      <span className="flex items-center gap-1 text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>
                        <MapPin size={12} />
                        {listing.location}
                      </span>
                    </div>
                  </div>
                </td>
                {/* Type */}
                <td className="px-5 py-4">
                  <Badge label={listing.type} style={TYPE_BADGE[listing.type]} />
                </td>
                {/* Price */}
                <td className="px-5 py-4">
                  <span className="text-[14px] font-semibold text-[#0d2138] whitespace-nowrap" style={mont}>{listing.price}</span>
                </td>
                {/* Bedrooms */}
                <td className="px-5 py-4">
                  <span className="text-[14px] text-[#6a7282]" style={mont}>{listing.bedrooms}</span>
                </td>
                {/* Operation Type */}
                <td className="px-5 py-4">
                  <span className="text-[14px] text-[#6a7282]" style={mont}>{listing.operation}</span>
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                  <Badge label={listing.status} style={STATUS_BADGE[listing.status]} />
                </td>
                {/* Actions */}
                <td className="px-5 py-4 w-[120px]">
                  <div className="flex items-center gap-2 text-[#99a1af]">
                    <button type="button" title="View" className="hover:text-[#1e4f86] transition-colors"><Eye size={16} /></button>
                    <button type="button" title="Edit" className="hover:text-[#1e4f86] transition-colors"><Pencil size={16} /></button>
                    <button type="button" title="Delete" className="hover:text-[#e7000b] transition-colors"><Trash2 size={16} /></button>
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
