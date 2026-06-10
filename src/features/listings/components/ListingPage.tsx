"use client";
import { useState } from "react";
import Link from "next/link";
import svgPaths from "./svgPaths";
import { FiltersModal } from "./FiltersModal";
const heroImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const cloudsImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
const img1 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-1.png";
const img2 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-2.png";
const img3 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-3.png";
const img4 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-4.png";
const img5 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-5.png";
const img6 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-6.png";
const img7 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-7.png";
const img8 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-8.png";
const img9 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-9.png";
const sugg1 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-10.png";
const sugg2 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-11.png";
const sugg3 =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-12.png";
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
/* ─── data ─── */
const listings = [
{
id: 1,
img: img1,
tags: ["Sale", "Apartment"],
price: "$8,500,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "680 sq.ft",
beds: "3 Bed",
baths: "2.5 Bath",
},
{
id: 2,
img: img2,
tags: ["Sale", "Villa"],
price: "$2,900,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "920 sq.ft",
beds: "4 Bed",
baths: "3 Bath",
},
{
id: 3,
img: img3,
tags: ["Rent", "Apartment"],
price: "$12,500/mo",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "540 sq.ft",
beds: "2 Bed",
baths: "2 Bath",
},
{
id: 4,
img: img4,
tags: ["Sale", "Penthouse"],
price: "$4,200,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "1100 sq.ft",
beds: "5 Bed",
baths: "4 Bath",
},
{
id: 5,
img: img5,
tags: ["Sale", "Villa"],
price: "$3,100,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "750 sq.ft",
beds: "3 Bed",
baths: "3 Bath",
},
{
id: 6,
img: img6,
tags: ["Rent", "Apartment"],
price: "$9,800/mo",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "480 sq.ft",
beds: "2 Bed",
baths: "2 Bath",
},
{
id: 7,
img: img7,
tags: ["Sale", "Estate"],
price: "$5,600,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "1450 sq.ft",
beds: "6 Bed",
baths: "5 Bath",
},
{
id: 8,
img: img8,
tags: ["Sale", "Apartment"],
price: "$2,750,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "620 sq.ft",
beds: "3 Bed",
baths: "2 Bath",
},
{
id: 9,
img: img9,
tags: ["Rent", "Penthouse"],
price: "$15,000/mo",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "980 sq.ft",
beds: "4 Bed",
baths: "4 Bath",
},
];
const suggestions = [
{
id: 1,
img: sugg1,
tags: ["Sale", "Apartment"],
price: "$8,500,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "680 sq.ft",
beds: "3 Bed",
baths: "2.5 Bath",
},
{
id: 2,
img: sugg2,
tags: ["Sale", "Apartment"],
price: "$8,500,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "680 sq.ft",
beds: "3 Bed",
baths: "2.5 Bath",
},
{
id: 3,
img: sugg3,
tags: ["Sale", "Apartment"],
price: "$8,500,000",
title: "Coastal Modern Residence",
location: "Bayshore Gardens, Tampa, FL",
sqft: "680 sq.ft",
beds: "3 Bed",
baths: "2.5 Bath",
},
];
/* ─── card component (vertical only) ─── */
function PropertyCard({ item }: { item: (typeof listings)[0] }) {
const [liked, setLiked] = useState(false);
return (
<Link
   href={`/listings/${item.id}`}
   className="flex flex-col gap-[20px] items-start w-full group"
   >
{/* Image */}
<div className="relative w-full h-[296px] rounded-[16px] overflow-hidden flex-shrink-0">
   <img
      src={item.img}
      alt={item.title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
   {/* Tags top-left */}
   <div className="absolute top-4 left-4 flex gap-1">
      {item.tags.map((t) => (
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
      {item.price}
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
         {item.sqft}
         </span>
      </div>
      <div className="flex items-center gap-[7px]">
         <BedIcon />
         <span
         className="text-[14px] text-[#2b3038]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {item.beds}
         </span>
      </div>
      <div className="flex items-center gap-[7px]">
         <BathIcon />
         <span
         className="text-[14px] text-[#2b3038]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {item.baths}
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
className={`absolute rounded-[8px] bg-[#4896b6] px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(13,33,56,0.14)] ${className}`}
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
   className="text-[16px] font-semibold leading-[22px] text-[#0d2138]"
   style={{ fontFamily: "Poppins, sans-serif" }}
   >
   Coastal Modern Residence
   </p>
   <p
   className="mt-1 text-[13px] leading-[18px] text-[#6a7282]"
   style={{ fontFamily: "Montserrat, sans-serif" }}
   >
   {location}
   </p>
   <p
   className="mt-3 text-[17px] font-semibold leading-[24px] text-[#005ea4]"
   style={{ fontFamily: "Poppins, sans-serif" }}
   >
   $8,500,000
   </p>
   <p
   className="mt-1 text-[13px] leading-[18px] text-[#6a7282]"
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
   className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2138]/60 px-4 py-8 backdrop-blur-[1px]"
   role="dialog"
   aria-modal="true"
   aria-labelledby="property-map-title"
   onMouseDown={onClose}
   >
<div
   className="max-h-[calc(100vh-64px)] w-full max-w-[1030px] overflow-hidden rounded-[12px] bg-white shadow-[0_26px_80px_rgba(13,33,56,0.22)]"
   onMouseDown={(event) =>
event.stopPropagation()}
>
<div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5">
   <div className="flex flex-wrap items-center gap-3">
      <h2
      id="property-map-title"
      className="text-[26px] font-semibold leading-[32px] text-[#0d2138]"
      style={{ fontFamily: "Poppins, sans-serif" }}
      >
      Property Map
      </h2>
      <button
      className="flex h-8 items-center gap-2 rounded-[7px] bg-[#285f9c] px-3 text-[13px] text-white"
      style={{ fontFamily: "Montserrat, sans-serif" }}
      >
      <span className="h-2 w-2 rounded-full bg-white" />
         Enable Drawing
         </button>
         <button
         className="flex h-8 items-center gap-2 rounded-[7px] bg-[#4896b6] px-3 text-[13px] text-white"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         <span className="text-[18px] leading-none">×</span>
         Clear Circles
         </button>
   </div>
   <button
      onClick={onClose}
      aria-label="Close property map"
      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f3f6f9]"
      >
   <CloseIcon />
   </button>
</div>
<div className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_280px]">
<div className="min-w-0">
<div className="relative h-[500px] overflow-hidden rounded-[10px] bg-[#edf6ff]">
<img
   src={mapImg}
   alt="Map showing listing search area"
   className="h-full w-full object-cover"
   />
<div className="absolute left-[32%] top-[18%] h-[260px] w-[260px] rounded-full border-[4px] border-[#2f7fc8]/55 bg-[#5fb6ff]/35" />
<div className="absolute left-[44.5%] top-[38%] h-4 w-4 rounded-full border-[3px] border-white bg-[#1bbf86] shadow-[0_0_0_3px_rgba(27,191,134,0.2)]" />
<PricePin label="$40,000" className="left-[10%] top-[24%]" />
<PricePin
   label="$40,000"
   className="left-[41%] top-[19%] bg-[#285f9c]"
   />
<PricePin label="$40,000" className="left-[70%] top-[27%]" />
<PricePin label="$40,000" className="left-[42%] top-[31%]" />
<PricePin label="$40,000" className="left-[60%] top-[51%]" />
<PricePin
   label="$40,000"
   className="left-[43%] top-[61%] bg-[#285f9c]"
   />
<PricePin label="$40,000" className="left-[16%] top-[68%]" />
<PricePin label="$40,000" className="left-[60%] top-[73%]" />
<PricePin
   label="$40,000"
   className="left-[82%] top-[61%] bg-[#285f9c]"
   />
<PricePin label="$40,000" className="left-[73%] top-[82%]" />
</div>
<p
className="mt-3 text-[13px] leading-[20px] text-[#2b3038]"
style={{ fontFamily: "Montserrat, sans-serif" }}
>
Enable drawing mode to search for listings by area
</p>
</div>
<aside className="flex min-w-0 flex-col">
<h3
className="mb-5 text-[17px] font-semibold leading-[24px] text-[#0d2138]"
style={{ fontFamily: "Poppins, sans-serif" }}
>
3 Listings Found
</h3>
<div className="flex flex-col gap-3">
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
/* ─── main export ─── */
export function ListingPageContent() {
const [page, setPage] = useState(1);
const [isMapOpen, setIsMapOpen] = useState(false);
const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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

      <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-[10px] min-w-0">
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

          <span
            className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap max-xl:text-[14px] max-xl:truncate"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Enter city, area, or address
          </span>
        </div>

        <span className="flex-shrink-0">
          <ChevronDown />
        </span>
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

      <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-[10px] min-w-0">
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

          <span
            className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap max-xl:text-[14px] max-xl:truncate"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Select property type
          </span>
        </div>

        <span className="flex-shrink-0">
          <ChevronDown />
        </span>
      </div>
    </div>

    {/* Transaction Type */}
    <div className="flex flex-col gap-3 items-start flex-1 min-w-[180px] max-w-[285px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Transaction Type
      </p>

      <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-[10px] min-w-0">
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

          <span
            className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap max-xl:text-[14px] max-xl:truncate"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Select transaction
          </span>
        </div>

        <span className="flex-shrink-0">
          <ChevronDown />
        </span>
      </div>
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
   <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 sm:mb-8">
         <h2
         className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#0d2138] leading-[28px] sm:leading-[32px] tracking-[-0.01em]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         Lisbon: 2,594 properties found
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8 sm:gap-y-10">
         {listings.map((item) => (
         <PropertyCard key={item.id} item={item} />
         ))}
      </div>
      {/* Pagination */}
      <div className="mt-8 sm:mt-10 flex justify-center">
         <Pagination current={page} total={16} onChange={setPage} />
      </div>
   </div>
</section>
{/* ── You Might Also Like ── */}
<section className="bg-white pt-4 pb-16 lg:pb-20">
   <div className="might">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto">
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
            <PropertyCard key={item.id} item={item} />
            ))}
         </div>
      </div>
   </div>
</section>
{isMapOpen ? (
<PropertyMapModal onClose={() =>
setIsMapOpen(false)} />
) : null}
{isFiltersOpen ? (
<FiltersModal onClose={() =>
setIsFiltersOpen(false)} />
) : null}
</>
);
}