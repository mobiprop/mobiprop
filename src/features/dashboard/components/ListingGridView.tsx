"use client";

import Image from "next/image";
import { MapPin, BedDouble, Bath, Maximize, Eye, Pencil, Trash2, Star } from "lucide-react";

import { type Listing, STATUS_BADGE } from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function ListingCard({ listing }: { listing: Listing }) {
  const status = STATUS_BADGE[listing.status];
  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-[192px] bg-[#f3f4f6]">
        <Image src={listing.image} alt={listing.name} fill sizes="(max-width:1280px) 50vw, 373px" className="object-cover" />
        {listing.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#1e4f86] text-white text-[11px] font-medium" style={mont}>
            <Star size={11} className="fill-white" />
            Featured
          </span>
        )}
        <span
          className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-[6px] text-[11px] font-medium"
          style={{ backgroundColor: status.bg, color: status.text, ...mont }}
        >
          {listing.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-[#0d2138]" style={mont}>{listing.name}</p>
          <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
            <MapPin size={14} className="text-[#6a7282]" />
            {listing.location}
          </span>
        </div>

        <p className="text-[20px] font-semibold text-[#1e4f86]" style={poppins}>{listing.price}</p>

        <div className="flex items-center gap-4 text-[12px] text-[#2b3038]" style={mont}>
          <span className="flex items-center gap-1.5"><BedDouble size={14} className="text-[#6a7282]" />{listing.bedrooms} Bed</span>
          <span className="flex items-center gap-1.5"><Bath size={14} className="text-[#6a7282]" />{listing.bathrooms} Bath</span>
          <span className="flex items-center gap-1.5"><Maximize size={14} className="text-[#6a7282]" />{listing.area} sqft</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
            <Eye size={14} />
            {listing.views} views
          </span>
          <div className="flex items-center gap-2">
            <button type="button" title="View" className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#1e4f86] hover:bg-[#f9fafb] transition-colors"><Eye size={14} /></button>
            <button type="button" title="Edit" className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#1e4f86] hover:bg-[#f9fafb] transition-colors"><Pencil size={14} /></button>
            <button type="button" title="Delete" className="size-7 flex items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#6a7282] hover:text-[#e7000b] hover:bg-[#fff5f5] transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingGridView({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] py-16 text-center text-[14px] text-[#6a7282]" style={mont}>
        No listings found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
