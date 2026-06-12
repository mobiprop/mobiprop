"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import svgPaths from "./svgPaths";
import { FiltersModal, type FiltersState } from "./FiltersModal";
import { useListingsQuery } from "@/hooks/queries/useListingsQuery";
import {
  useListingFilterStore,
  type PropertyType as PropertyTypeFilter,
  type TransactionType as TransactionTypeFilter,
} from "@/stores/useListingFilterStore";
import type { PublicListingDto } from "../types/listing-dto";
import {
  PROPERTY_TYPE_LABELS,
  formatArea,
  formatBaths,
  formatBeds,
  listingDisplayPrice,
  listingTags,
} from "../utils/format";
const heroImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const cloudsImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
const fallbackImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-1.png";
const mapImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/ContactPage/map.png";
/* ─── icon helpers ─── */
function SquareArrowIcon() {
return (
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
   <path
      d="M16.25 7.5H12.5V3.75"
      stroke="#2B3038"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M3.75 12.5H7.5V16.25"
      stroke="#2B3038"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M12.5 16.25V12.5H16.25"
      stroke="#2B3038"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M7.5 3.75V7.5H3.75"
      stroke="#2B3038"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
</svg>
);
}
function BedIcon({ color = "#2B3038" }: { color?: string }) {
return (
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
   <path
      d={svgPaths.p48eb680}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M1.875 16.25V3.75"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M1.875 13.125H19.375V16.25"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M8.75 6.25H1.875"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
</svg>
);
}
function BathIcon({ color = "#2B3038" }: { color?: string }) {
return (
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
   <path
      d="M5.625 15V16.875"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d="M14.375 15V16.875"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d={svgPaths.p376e01f0}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d={svgPaths.p3f8783b0}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
   <path
      d={svgPaths.p35ecd900}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      />
</svg>
);
}
function PinIcon({ color = "#2B3038" }: { color?: string }) {
return (
<svg width="12" height="15" viewBox="0 0 11.6667 14.3333" fill="none">
   <path
      d={svgPaths.p1fff3000}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      />
   <path
      d={svgPaths.p1a179d80}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      />
</svg>
);
}
function HeartIcon({ filled }: { filled: boolean }) {
return (
<svg
width="16"
height="16"
viewBox="0 0 16 16"
fill={filled ? "#ef4444" : "none"}
>
<path
d={svgPaths.p2a65c600}
stroke={filled ? "#ef4444" : "#6A7282"}
strokeLinecap="round"
strokeLinejoin="round"
/>
</svg>
);
}
function ChevronDown({ color = "#6A7282" }: { color?: string }) {
return (
<svg width="12" height="7" viewBox="0 0 11.774 6.774" fill="none">
   <path
      d={svgPaths.p1485b700}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.77"
      />
</svg>
);
}
function CloseIcon() {
return (
<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
   <path
      d="M5 5L17 17"
      stroke="#0d2138"
      strokeLinecap="round"
      strokeWidth="1.6"
      />
   <path
      d="M17 5L5 17"
      stroke="#0d2138"
      strokeLinecap="round"
      strokeWidth="1.6"
      />
</svg>
);
}
function MapIcon() {
return (
<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
   <path
      d={svgPaths.p277d2000}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
      />
</svg>
);
}
/* ─── card component (vertical only) ─── */
function PropertyCard({ item }: { item: PublicListingDto }) {
const [liked, setLiked] = useState(false);
return (
<Link
   href={`/listings/${item.slug}`}
   className="flex flex-col gap-[20px] items-start w-full group"
   >
{/* Image */}
<div className="relative w-full h-[296px] rounded-[16px] overflow-hidden flex-shrink-0">
   <img
      src={item.coverImageUrl ?? fallbackImg}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
   {/* Tags top-left */}
   <div className="absolute top-4 left-4 flex gap-1">
      {listingTags(item).map((t) => (
      <span
      key={t}
      className="bg-white opacity-90 px-3 py-[4px] rounded-[36px] text-[14px] text-[#0d2138]"
      style={{ fontFamily: "Montserrat, sans-serif" }}
      >
      {t}
      </span>
      ))}
   </div>
   {/* Heart button top-right */}
   <button
      onClick={(e) =>
      {
      e.preventDefault();
      e.stopPropagation();
      setLiked(!liked);
      }}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
      >
      <HeartIcon filled={liked} />
   </button>
</div>
{/* Info */}
<div className="flex flex-col gap-[10px] items-start w-full">
   {/* Title row */}
   <div className="flex items-center sm:items-start justify-between w-full pb-[10px] border-b border-[#e5e7eb]">
      <div className="flex flex-col gap-[2px]">
         <p
         className="text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[32px] truncate max-w-[260px]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {item.title}
         </p>
         <div className="flex items-center gap-1">
            <PinIcon color="#2B3038" />
            <span
            className="text-[14px] text-[#0d2138] leading-[20px] truncate max-w-[180px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            {item.location}
            </span>
         </div>
      </div>
      <p
      className="text-[17px] sm:text-[18px] font-semibold text-[#2b3038] leading-[26px] whitespace-nowrap text-right"
      style={{ fontFamily: "Poppins, sans-serif" }}
      >
      {listingDisplayPrice(item)}
      </p>
   </div>
   {/* Stats row */}
   <div className="flex items-center gap-5">
      <div className="flex items-center gap-[7px]">
         <SquareArrowIcon />
         <span
         className="text-[14px] text-[#2b3038]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {formatArea(item.areaSqft)}
         </span>
      </div>
      <div className="flex items-center gap-[7px]">
         <BedIcon />
         <span
         className="text-[14px] text-[#2b3038]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {formatBeds(item.bedrooms)}
         </span>
      </div>
      <div className="flex items-center gap-[7px]">
         <BathIcon />
         <span
         className="text-[14px] text-[#2b3038]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {formatBaths(item.bathrooms)}
         </span>
      </div>
   </div>
</div>
</Link>
);
}
function PricePin({
label,
className = "",
}: {
label: string;
className?: string;
}) {
return (
<span
  className={`absolute rounded-[6px] bg-[#4896b6] px-2 py-1 text-[10px] font-medium text-white shadow-[0_8px_18px_rgba(13,33,56,0.14)] sm:rounded-[8px] sm:px-3 sm:py-1.5 sm:text-[14px] ${className}`}
  style={{ fontFamily: "Montserrat, sans-serif" }}
>
  {label}
</span>
);
}
function ModalListingCard({ location }: { location: string }) {
return (
<div className="rounded-[12px] border border-[#d8dee8] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(13,33,56,0.04)]">
   <p
   className="text-[18px] font-medium leading-[22px] text-[#0d2138]"
   style={{ fontFamily: "Poppins, sans-serif" }}
   >
   Coastal Modern Residence
   </p>
   <p
   className="mt-1 text-[14px] leading-[18px] text-[#6a7282]"
   style={{ fontFamily: "Montserrat, sans-serif" }}
   >
   {location}
   </p>
   <p
   className="mt-3 text-[18px] font-semibold leading-[24px] text-[#005ea4]"
   style={{ fontFamily: "Poppins, sans-serif" }}
   >
   $8,500,000
   </p>
   <p
   className="mt-1 text-[14px] leading-[18px] text-[#6a7282]"
   style={{ fontFamily: "Montserrat, sans-serif" }}
   >
   5 Beds · 4 Baths · 4,200 sqft
   </p>
</div>
);
}
function PropertyMapModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2138]/60 px-2 py-3 sm:px-4 sm:py-8 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-map-title"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[calc(100vh-24px)] w-full max-w-[1030px] overflow-y-auto rounded-[10px] bg-white shadow-[0_20px_60px_rgba(13,33,56,0.22)] sm:max-h-[calc(100vh-32px)] sm:rounded-[12px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 pr-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:pr-0">
            <h2
              id="property-map-title"
              className="text-[20px] font-[500] leading-[26px] text-[#0d2138] sm:text-[26px] sm:leading-[32px] lg:text-[28px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Property Map
            </h2>

            <div className="flex flex-wrap gap-2">
              <button
                className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#285f9c] px-2.5 text-[12px] leading-none text-white sm:gap-2 sm:px-3 sm:text-[14px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />
                Enable Drawing
              </button>

              <button
                className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#4896b6] px-2.5 text-[12px] leading-none text-white sm:gap-2 sm:px-3 sm:text-[14px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <span className="text-[16px] leading-none sm:text-[18px]">×</span>
                Clear Circles
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close property map"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f6f9] sm:right-5 sm:top-5 sm:h-9 sm:w-9 md:static"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <div className="relative h-[270px] overflow-hidden rounded-[9px] bg-[#edf6ff] sm:h-[420px] sm:rounded-[10px] lg:h-[500px]">
              <img
                src={mapImg}
                alt="Map showing listing search area"
                className="h-full w-full object-cover"
              />

              <div className="absolute left-[28%] top-[16%] h-[150px] w-[150px] rounded-full border-[3px] border-[#2f7fc8]/55 bg-[#5fb6ff]/35 sm:left-[32%] sm:top-[18%] sm:h-[260px] sm:w-[260px] sm:border-[4px]" />

              <div className="absolute left-[44.5%] top-[38%] h-3.5 w-3.5 rounded-full border-[2px] border-white bg-[#1bbf86] shadow-[0_0_0_3px_rgba(27,191,134,0.2)] sm:h-4 sm:w-4 sm:border-[3px]" />

              <PricePin label="$40,000" className="left-[10%] top-[24%]" />
              <PricePin label="$40,000" className="left-[41%] top-[19%] bg-[#285f9c]" />
              <PricePin label="$40,000" className="left-[70%] top-[27%]" />
              <PricePin label="$40,000" className="left-[42%] top-[31%]" />
              <PricePin label="$40,000" className="left-[60%] top-[51%]" />
              <PricePin label="$40,000" className="left-[43%] top-[61%] bg-[#285f9c]" />
              <PricePin label="$40,000" className="left-[16%] top-[68%]" />
              <PricePin label="$40,000" className="left-[60%] top-[73%]" />
              <PricePin label="$40,000" className="left-[82%] top-[61%] bg-[#285f9c]" />
              <PricePin label="$40,000" className="left-[73%] top-[82%]" />
            </div>

            <p
              className="mt-2 text-[12px] leading-[18px] text-[#2b3038] sm:mt-3 sm:text-[14px] sm:leading-[20px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Enable drawing mode to search for listings by area
            </p>
          </div>

          <aside className="flex min-w-0 flex-col">
            <h3
              className="mb-3 text-[17px] font-medium leading-[22px] text-[#0d2138] sm:mb-5 sm:text-[20px] sm:leading-[24px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              3 Listings Found
            </h3>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              <ModalListingCard location="Lisbon, Portugal" />
              <ModalListingCard location="Montecarlo, Monaco" />
              <ModalListingCard location="Del Rio, Texas" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
/* ─── pagination ─── */
function getPageItems(current: number, total: number): (number | "…")[] {
if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
if (current >= total - 3)
return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
return [1, "…", current - 1, current, current + 1, "…", total];
}
function Pagination({
current,
total,
onChange,
}: {
current: number;
total: number;
onChange: (p: number) => void;
}) {
const items = getPageItems(current, total);
return (
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mt-8 sm:mt-10">
  <span
    className="text-[14px] sm:text-[16px] text-[#4B4F52] text-center sm:text-left"
    style={{ fontFamily: "Montserrat, sans-serif" }}
  >
    Page {current} of {total}
  </span>

  <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
    <button
      onClick={() => onChange(Math.max(1, current - 1))}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      disabled={current === 1}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d={svgPaths.p2819c200} fill="#2b3038" />
      </svg>
    </button>

    {items.map((p, i) =>
      p === "…" ? (
        <span
          key={`dots-${i}`}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[14px] sm:text-[16px] text-[#4B4F52]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          …
        </span>
      ) : (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="w-8 h-8 sm:h-9 rounded-[6px] border border-[#d1d5dc] p-[6px] text-[14px] sm:text-[16px] transition-colors cursor-pointer flex items-center justify-center"
          style={{
            fontFamily: "Montserrat, sans-serif",
            background:
              p === current
                ? "linear-gradient(to bottom, #005ea4, #006fc2)"
                : "white",
            color: p === current ? "white" : "#2b3038",
            border: p === current ? "none" : "1px solid #e5e7eb",
          }}
        >
          {p}
        </button>
      )
    )}

    <button
      onClick={() => onChange(Math.min(total, current + 1))}
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      disabled={current === total}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d={svgPaths.p17c1c200} fill="#2b3038" />
      </svg>
    </button>
  </div>

  <div className="relative w-full sm:w-auto">
    <select
      value={current}
      onChange={(e) => onChange(Number(e.target.value))}
      className="appearance-none w-full sm:w-auto bg-white border border-[#e5e7eb] rounded-full pl-4 pr-9 py-2 text-[14px] text-[#2b3038] cursor-pointer hover:bg-[#f8fafc] transition-colors"
      style={{ fontFamily: "Montserrat, sans-serif" }}
      aria-label="Go to page"
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <option key={p} value={p}>
          Page {p}
        </option>
      ))}
    </select>

    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
      <ChevronDown />
    </span>
  </div>
</div>
);
}
/* ─── filter option catalogs ─── */
const PROPERTY_TYPE_OPTIONS: { value: PropertyTypeFilter; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "APARTMENT", label: PROPERTY_TYPE_LABELS.APARTMENT },
  { value: "HOUSE", label: PROPERTY_TYPE_LABELS.HOUSE },
  { value: "COMMERCIAL_OFFICE", label: PROPERTY_TYPE_LABELS.COMMERCIAL_OFFICE },
  { value: "LOT", label: PROPERTY_TYPE_LABELS.LOT },
  { value: "TOWNHOUSE", label: PROPERTY_TYPE_LABELS.TOWNHOUSE },
];
const TRANSACTION_OPTIONS: { value: TransactionTypeFilter; label: string }[] = [
  { value: "", label: "Buy or Rent" },
  { value: "SALE", label: "Buy" },
  { value: "RENT", label: "Rent" },
];
// FiltersModal amenity labels → seeded amenity keys (amenities.key in DB).
const MODAL_AMENITY_KEYS: Record<string, string> = {
  "Credit Approved": "CREDIT_APPROVED",
  Gas: "GAS",
  "Radiant Slab": "RADIANT_FLOORS",
  Internet: "INTERNET",
  "Air Conditioning": "AIR_CONDITIONING",
  Barbecue: "BARBECUE",
  Laundry: "LAUNDRY",
  Water: "WATER",
  "Tennis Court": "TENNIS_COURT",
};
const PAGE_SIZE = 9;

/* ─── search-bar dropdown (styled like the Figma pill fields) ─── */
function SearchBarDropdown<T extends string>({
  icon,
  placeholder,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-[10px] min-w-0">
          {icon}
          <span
            className={`text-[16px] leading-[24px] whitespace-nowrap max-xl:text-[14px] max-xl:truncate ${
              selected && selected.value !== "" ? "text-[#0d2138]" : "text-[#6a7282]"
            }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {selected && selected.value !== "" ? selected.label : placeholder}
          </span>
        </div>
        <span className="flex-shrink-0">
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#e5e7eb] rounded-[16px] shadow-lg z-20 py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[15px] hover:bg-[#f3f4f6] transition-colors cursor-pointer ${
                value === opt.value ? "text-[#1e4f86] font-medium" : "text-[#6a7282]"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── main export ─── */
export function ListingPageContent() {
const [page, setPage] = useState(1);
const [isMapOpen, setIsMapOpen] = useState(false);
const [isFiltersOpen, setIsFiltersOpen] = useState(false);

const searchParams = useSearchParams();
const filters = useListingFilterStore(
  useShallow((s) => ({
    location: s.location,
    propertyType: s.propertyType,
    transactionType: s.transactionType,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    minArea: s.minArea,
    maxArea: s.maxArea,
    amenities: s.amenities,
  })),
);
const store = useListingFilterStore.getState();

// Seed the filter store from URL params once (homepage hero search deep-links
// here as /listings?location=…&propertyType=…&transactionType=…).
const seededRef = useRef(false);
useEffect(() => {
  if (seededRef.current) return;
  seededRef.current = true;
  const num = (key: string) => {
    const v = searchParams.get(key);
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const state = useListingFilterStore.getState();
  const location = searchParams.get("location");
  if (location !== null) state.setLocation(location);
  const propertyType = searchParams.get("propertyType");
  if (propertyType !== null) state.setPropertyType(propertyType as PropertyTypeFilter);
  const transactionType = searchParams.get("transactionType");
  if (transactionType !== null) state.setTransactionType(transactionType as TransactionTypeFilter);
  if (searchParams.has("minPrice") || searchParams.has("maxPrice")) {
    state.setPriceRange(num("minPrice"), num("maxPrice"));
  }
}, [searchParams]);

// Location input with available-location suggestions.
const [locationInput, setLocationInput] = useState(filters.location);
const [locationOpen, setLocationOpen] = useState(false);
const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
const locationRef = useRef<HTMLDivElement>(null);
useEffect(() => setLocationInput(filters.location), [filters.location]);
useEffect(() => {
  if (!locationOpen) return;
  const handler = (e: MouseEvent) => {
    if (!locationRef.current?.contains(e.target as Node)) setLocationOpen(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [locationOpen]);
useEffect(() => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    fetch(`/api/listings/locations?q=${encodeURIComponent(locationInput)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { locations: [] }))
      .then((data) => setLocationSuggestions(data.locations ?? []))
      .catch(() => undefined);
  }, 250);
  return () => {
    controller.abort();
    clearTimeout(timer);
  };
}, [locationInput]);

const { data, isLoading, isError } = useListingsQuery();
const listings: PublicListingDto[] = useMemo(() => data?.listings ?? [], [data]);

const { data: featuredData } = useQuery({
  queryKey: ["listings", "public-featured"],
  queryFn: async () => {
    const res = await fetch("/api/listings?featured=true");
    if (!res.ok) throw new Error("Failed to fetch featured listings");
    return res.json();
  },
});
const suggestions: PublicListingDto[] = (featuredData?.listings ?? []).slice(0, 3);

const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
const safePage = Math.min(page, totalPages);
const pageListings = listings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
// Snap back to page 1 whenever the result set changes.
const filterKey = JSON.stringify(filters);
useEffect(() => setPage(1), [filterKey]);

const resultsHeading = isLoading
  ? "Searching properties…"
  : isError
    ? "We couldn't load listings right now"
    : `${filters.location ? `${filters.location}: ` : ""}${listings.length} ${
        listings.length === 1 ? "property" : "properties"
      } found`;

function commitLocation(value: string) {
  setLocationInput(value);
  store.setLocation(value.trim());
  setLocationOpen(false);
}

function applyModalFilters(state: FiltersState) {
  const num = (v: string) => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const plus = (v: string) => (v === "Any" ? null : Number(v.replace("+", "")));
  const s = useListingFilterStore.getState();
  s.setPriceRange(num(state.minPrice), num(state.maxPrice));
  s.setBedrooms(plus(state.bedrooms));
  s.setBathrooms(plus(state.bathrooms));
  s.setAreaRange(num(state.minArea), num(state.maxArea));
  const keys = [...state.amenities]
    .map((label) => MODAL_AMENITY_KEYS[label])
    .filter((key): key is string => Boolean(key));
  useListingFilterStore.setState({ amenities: keys });
}

return (
<>
{/* ── Hero ── */}
<section className="relative h-[360px] sm:h-[400px] overflow-hidden border-b border-black/10">
   {/* bg photo */}
   <div className="absolute inset-0 overflow-hidden">
      <img
         src={heroImg}
         alt=""
         className="absolute w-full h-[110%] -top-[10%] object-cover"
         />
   </div>
   {/* gradient overlay */}
   <div
   className="absolute inset-0"
   style={{
   background:
   "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
   }}
   />
   {/* cloud overlay */}
   <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
      <img
         src={cloudsImg}
         alt=""
         className="absolute w-full h-full object-cover"
         />
   </div>
   {/* EDF6FF gradient overlay */}
   <div
   className="absolute inset-0"
   style={{
   background:
   "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
   }}
   />
   {/* Text content */}
   <div className="relative h-full w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[760px] mx-auto flex flex-col items-center justify-center gap-2 text-center pt-6">
   <div className="flex items-center gap-2">
      <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
         <span
         className="text-[14px] sm:text-[16px] font-medium text-[#6a7282] tracking-[-0.01em]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         Listing
         </span>
      </div>
      <div className="flex flex-col gap-3 sm:gap-4 items-center">
         <h1
         className="text-[28px] sm:text-[38px] lg:text-[44px] font-semibold text-[#0d2138] leading-[38px] sm:leading-[48px] lg:leading-[56px] tracking-[-0.01em]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         Featured Luxury Listings
         </h1>
         <p
         className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.01em] max-w-[560px]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         Discover a wide range of properties, from cozy apartments to luxurious
         estates, tailored to suit every need and budget.
         </p>
      </div>
   </div>
</section>
{/* ── Search Bar Card ── */}
<div className="bg-white px-6 lg:px-10 flex justify-center ">
  <div className="relative z-10 -mt-[69px] w-full max-w-[1440px] bg-white border border-[#e5e7eb] rounded-[24px] px-[10px] py-[10px] flex flex-col items-center justify-center min-h-[138px] max-xl:rounded-[18px] max-xl:px-4 max-xl:py-4 max-xl:min-h-0">
  <div className="flex flex-wrap gap-3.5 items-end justify-center w-full max-xl:grid max-xl:grid-cols-2 max-md:grid-cols-1 max-xl:gap-4">
    {/* Location */}
    <div className="flex flex-col gap-3 items-start flex-1 min-w-[200px] max-w-[361px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Location
      </p>

      <div ref={locationRef} className="relative w-full">
        <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-[10px] min-w-0 flex-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 14.7333 18.0667"
              fill="none"
              className="flex-shrink-0"
            >
              <path
                d={svgPaths.p327f1700}
                stroke="#6A7282"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
              <path
                d={svgPaths.p131e2100}
                stroke="#6A7282"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
            </svg>

            <input
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setLocationOpen(true);
              }}
              onFocus={() => setLocationOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLocation(locationInput);
              }}
              placeholder="Enter city, area, or address"
              className="w-full min-w-0 bg-transparent text-[16px] text-[#0d2138] placeholder:text-[#6a7282] leading-[24px] outline-none max-xl:text-[14px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              aria-label="Search by location"
            />
          </div>

          {locationInput ? (
            <button
              type="button"
              onClick={() => commitLocation("")}
              aria-label="Clear location"
              className="flex-shrink-0 text-[#6a7282] hover:text-[#0d2138] cursor-pointer text-[18px] leading-none"
            >
              ×
            </button>
          ) : (
            <span className="flex-shrink-0">
              <ChevronDown />
            </span>
          )}
        </div>

        {locationOpen && locationSuggestions.length > 0 ? (
          <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#e5e7eb] rounded-[16px] shadow-lg z-20 py-1 overflow-hidden">
            {locationSuggestions.map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => commitLocation(sugg)}
                className="w-full px-4 py-2.5 text-left text-[15px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors cursor-pointer truncate"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {sugg}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>

    {/* Property Type */}
    <div className="flex flex-col gap-3 items-start flex-1 min-w-[180px] max-w-[307px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Property Type
      </p>

      <SearchBarDropdown
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 16.4 17.011"
            fill="none"
            className="flex-shrink-0"
          >
            <path
              d={svgPaths.p2e793b00}
              stroke="#6A7282"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.4"
            />
          </svg>
        }
        placeholder="Select property type"
        options={PROPERTY_TYPE_OPTIONS}
        value={filters.propertyType}
        onChange={(value) => store.setPropertyType(value)}
      />
    </div>

    {/* Transaction Type */}
    <div className="flex flex-col gap-3 items-start flex-1 min-w-[180px] max-w-[285px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Transaction Type
      </p>

      <SearchBarDropdown
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 18.0667 16.4"
            fill="none"
            className="flex-shrink-0"
          >
            <path
              d={svgPaths.p11b8b2c0}
              stroke="#6A7282"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.4"
            />
          </svg>
        }
        placeholder="Select transaction"
        options={TRANSACTION_OPTIONS}
        value={filters.transactionType}
        onChange={(value) => store.setTransactionType(value)}
      />
    </div>

    {/* Buttons */}
    <div className="flex items-center gap-[15px] flex-shrink-0 max-xl:col-span-full max-xl:w-full max-xl:flex-row max-md:flex-col max-xl:items-stretch max-xl:gap-3">
      <button
        onClick={() => setIsFiltersOpen(true)}
        className="bg-white border border-[#e5e7eb] rounded-[60px] px-5 py-3 text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] whitespace-nowrap hover:border-[#6889ae] hover:text-[#1e4f86] transition-colors max-xl:w-full max-xl:text-[14px] cursor-pointer"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        More Filters
      </button>

      <button
        onClick={() => commitLocation(locationInput)}
        className="relative h-[48px] w-[231px] overflow-hidden whitespace-nowrap rounded-[48px] px-6 py-3 text-[16px] text-white transition-opacity hover:opacity-90 max-xl:w-full max-xl:text-[14px] cursor-pointer flex items-center justify-center gap-1"
        style={{
          fontFamily: "Poppins, sans-serif",
          background: "linear-gradient(to bottom, #005ea4, #006fc2)",
          border: "1px solid #0088ff",
        }}
      >
        <span
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/assets/figma-temp/BlogPage/btn-img.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <span className="relative z-10">Search Properties</span>
      </button>
    </div>
  </div>
</div>
</div>
{/* ── Listings Grid ── */}
<section className="bg-white py-8 sm:py-10 lg:py-14">
   <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 sm:mb-8">
         <h2
         className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#0d2138] leading-[28px] sm:leading-[32px] tracking-[-0.01em]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {resultsHeading}
         </h2>
         <button
            onClick={() =>
            setIsMapOpen(true)}
            className="w-fit flex items-center gap-2 bg-[#1E4F86] px-5 py-2.5 rounded-full text-[14px] text-white font-medium hover:bg-[#17446f] transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            <MapIcon />
            Map
         </button>
      </div>
      {/* Card grid */}
      {isLoading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8 sm:gap-y-10">
         {Array.from({ length: 6 }).map((_, i) => (
         <div key={i} className="flex flex-col gap-[20px] w-full animate-pulse">
            <div className="w-full h-[296px] rounded-[16px] bg-[#eef1f5]" />
            <div className="flex flex-col gap-2 w-full">
               <div className="h-5 w-2/3 rounded bg-[#eef1f5]" />
               <div className="h-4 w-1/2 rounded bg-[#eef1f5]" />
            </div>
         </div>
         ))}
      </div>
      ) : pageListings.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8 sm:gap-y-10">
         {pageListings.map((item) => (
         <PropertyCard key={item.slug} item={item} />
         ))}
      </div>
      ) : (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
         <p
         className="text-[20px] font-medium text-[#0d2138]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {isError ? "Something went wrong" : "No properties match your search"}
         </p>
         <p
         className="text-[15px] text-[#6a7282] max-w-[420px]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {isError
         ? "Please refresh the page or try again in a moment."
         : "Try adjusting your filters or searching a different location."}
         </p>
         {!isError ? (
         <button
            onClick={() => {
            useListingFilterStore.getState().resetFilters();
            setLocationInput("");
            }}
            className="mt-2 rounded-full bg-[#1e4f86] px-6 py-2.5 text-[14px] text-white hover:bg-[#17446f] transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            Clear all filters
         </button>
         ) : null}
      </div>
      )}
      {/* Pagination */}
      {!isLoading && listings.length > PAGE_SIZE ? (
      <div className="mt-8 sm:mt-10 flex justify-center">
         <Pagination current={safePage} total={totalPages} onChange={setPage} />
      </div>
      ) : null}
   </div>
</section>
{/* ── You Might Also Like ── */}
{suggestions.length > 0 ? (
<section className="bg-white pt-4 pb-16 lg:pb-20">
   <div className="might">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
         {/* Section heading */}
         <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12 text-center">
            <h2
            className="text-[28px] sm:text-[34px] lg:text-[40px] xl:text-[44px] font-semibold text-[#0d2138] leading-[36px] sm:leading-[42px] lg:leading-[50px] xl:leading-[56px] tracking-[-0.01em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
            >
            You might also like
            </h2>
            <p
            className="text-[14px] sm:text-[15px] lg:text-[16px] leading-[22px] sm:leading-[24px] text-[#2b3038] tracking-[-0.01em] max-w-[520px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            We have over +10 years of experience in the real estate market
            </p>
         </div>
         {/* 3-card row */}
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
            {suggestions.map((item) => (
            <PropertyCard key={item.slug} item={item} />
            ))}
         </div>
      </div>
   </div>
</section>
) : null}
{isMapOpen ? (
<PropertyMapModal onClose={() =>
setIsMapOpen(false)} />
) : null}
{isFiltersOpen ? (
<FiltersModal
   onClose={() => setIsFiltersOpen(false)}
   onApply={applyModalFilters}
/>
) : null}
</>
);
}