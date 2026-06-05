"use client";

import { useState } from "react";
import Link from "next/link";
import svgPaths from "./svgPaths";

const heroImg = "/assets/figma-temp/ListingPage-1/7c381d7793bef2f0501fb33eaa3df52bea0aa4ef.png";
const cloudsImg = "/assets/figma-temp/ListingPage-1/224a1a87c6d1fc7b05e65142626032911210d860.png";
const img1 = "/assets/figma-temp/ListingPage-1/86a765c8069553ebf60e60f32ad44c8911a8dc43.png";
const img2 = "/assets/figma-temp/ListingPage-1/f186df3ffecd1693fc361700e857c2ed57a551fd.png";
const img3 = "/assets/figma-temp/ListingPage-1/5093201b514c15b859f33d9514c53dff534ca77b.png";
const img4 = "/assets/figma-temp/ListingPage-1/8137495f6ced8731d50e90db7307a71887d9405e.png";
const img5 = "/assets/figma-temp/ListingPage-1/f814dcfd6a900cdbe36f821086bb87d044eb6c8f.png";
const img6 = "/assets/figma-temp/ListingPage-1/f6d91b83cd3d072f2207f452eb3e3da230b02175.png";
const img7 = "/assets/figma-temp/ListingPage-1/7a6edb51386312fadf91e51d520cf90bbf263746.png";
const img8 = "/assets/figma-temp/ListingPage-1/3e748476c00023b7c5ae784cce06d0ab67546993.png";
const img9 = "/assets/figma-temp/ListingPage-1/cc77c8fdd826c9c8a44bc94bdee10fe20974f06a.png";
const sugg1 = "/assets/figma-temp/ListingPage-1/1a654807ddf806226b7d20555110e7f114b6a7a0.png";
const sugg2 = "/assets/figma-temp/ListingPage-1/cb76315e81071a1b5226028546e26a5ecaa633be.png";
const sugg3 = "/assets/figma-temp/ListingPage-1/9dfe0bd344321c122c9b9085d0ebd561176bf927.png";

/* ─── icon helpers ─── */
function SquareArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.25 7.5H12.5V3.75" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M3.75 12.5H7.5V16.25" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M12.5 16.25V12.5H16.25" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M7.5 3.75V7.5H3.75" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BedIcon({ color = "#2B3038" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p48eb680} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 16.25V3.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 13.125H19.375V16.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.75 6.25H1.875" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BathIcon({ color = "#2B3038" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5.625 15V16.875" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M14.375 15V16.875" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p376e01f0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p3f8783b0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p35ecd900} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function PinIcon({ color = "#2B3038" }: { color?: string }) {
  return (
    <svg width="12" height="15" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "#ef4444" : "none"}>
      <path d={svgPaths.p2a65c600} stroke={filled ? "#ef4444" : "#6A7282"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ color = "#6A7282" }: { color?: string }) {
  return (
    <svg width="12" height="7" viewBox="0 0 11.774 6.774" fill="none">
      <path d={svgPaths.p1485b700} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.77" />
    </svg>
  );
}

/* ─── data ─── */
const listings = [
  { id: 1, img: img1, tags: ["Sale", "Apartment"], price: "$8,500,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "680 sq.ft", beds: "3 Bed", baths: "2.5 Bath" },
  { id: 2, img: img2, tags: ["Sale", "Villa"],      price: "$2,900,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "920 sq.ft", beds: "4 Bed", baths: "3 Bath" },
  { id: 3, img: img3, tags: ["Rent", "Apartment"], price: "$12,500/mo",  title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "540 sq.ft", beds: "2 Bed", baths: "2 Bath" },
  { id: 4, img: img4, tags: ["Sale", "Penthouse"], price: "$4,200,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "1100 sq.ft", beds: "5 Bed", baths: "4 Bath" },
  { id: 5, img: img5, tags: ["Sale", "Villa"],      price: "$3,100,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "750 sq.ft", beds: "3 Bed", baths: "3 Bath" },
  { id: 6, img: img6, tags: ["Rent", "Apartment"], price: "$9,800/mo",  title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "480 sq.ft", beds: "2 Bed", baths: "2 Bath" },
  { id: 7, img: img7, tags: ["Sale", "Estate"],    price: "$5,600,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "1450 sq.ft", beds: "6 Bed", baths: "5 Bath" },
  { id: 8, img: img8, tags: ["Sale", "Apartment"], price: "$2,750,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "620 sq.ft", beds: "3 Bed", baths: "2 Bath" },
  { id: 9, img: img9, tags: ["Rent", "Penthouse"], price: "$15,000/mo", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "980 sq.ft", beds: "4 Bed", baths: "4 Bath" },
];

const suggestions = [
  { id: 1, img: sugg1, tags: ["Sale", "Apartment"], price: "$8,500,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "680 sq.ft", beds: "3 Bed", baths: "2.5 Bath" },
  { id: 2, img: sugg2, tags: ["Sale", "Apartment"], price: "$8,500,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "680 sq.ft", beds: "3 Bed", baths: "2.5 Bath" },
  { id: 3, img: sugg3, tags: ["Sale", "Apartment"], price: "$8,500,000", title: "Coastal Modern Residence", location: "Bayshore Gardens, Tampa, FL", sqft: "680 sq.ft", beds: "3 Bed", baths: "2.5 Bath" },
];

/* ─── card component (vertical only) ─── */
function PropertyCard({ item }: { item: typeof listings[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <Link href={`/listings/${item.id}`} className="flex flex-col gap-[20px] items-start w-full group">
      {/* Image */}
      <div className="relative w-full h-[296px] rounded-[16px] overflow-hidden flex-shrink-0">
        <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
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
          onClick={(e) => {
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
        <div className="flex items-start justify-between w-full pb-[10px] border-b border-[#e5e7eb]">
          <div className="flex flex-col gap-[2px]">
            <p
              className="text-[20px] font-medium text-[#0d2138] leading-[32px] truncate max-w-[260px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {item.title}
            </p>
            <div className="flex items-center gap-1">
              <PinIcon color="#2B3038" />
              <span className="text-[14px] text-[#0d2138] leading-[20px] truncate max-w-[180px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {item.location}
              </span>
            </div>
          </div>
          <p
            className="text-[18px] font-semibold text-[#2b3038] leading-[26px] whitespace-nowrap text-right"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {item.price}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-[7px]">
            <SquareArrowIcon />
            <span className="text-[14px] text-[#2b3038]" style={{ fontFamily: "Montserrat, sans-serif" }}>{item.sqft}</span>
          </div>
          <div className="flex items-center gap-[7px]">
            <BedIcon />
            <span className="text-[14px] text-[#2b3038]" style={{ fontFamily: "Montserrat, sans-serif" }}>{item.beds}</span>
          </div>
          <div className="flex items-center gap-[7px]">
            <BathIcon />
            <span className="text-[14px] text-[#2b3038]" style={{ fontFamily: "Montserrat, sans-serif" }}>{item.baths}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── pagination ─── */
function getPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const items = getPageItems(current, total);
  return (
    <div className="flex items-center justify-between w-full mt-10">
      <span className="text-[14px] text-[#6a7282]" style={{ fontFamily: "Montserrat, sans-serif" }}>
        Page {current} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] transition-colors disabled:opacity-40"
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
              className="w-9 h-9 flex items-center justify-center text-[14px] text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="w-9 h-9 rounded-full text-[14px] transition-colors"
              style={{
                fontFamily: "Montserrat, sans-serif",
                background: p === current ? "linear-gradient(to bottom, #005ea4, #006fc2)" : "white",
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
          className="w-9 h-9 rounded-full flex items-center justify-center border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] transition-colors disabled:opacity-40"
          disabled={current === total}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d={svgPaths.p17c1c200} fill="#2b3038" />
          </svg>
        </button>
      </div>
      <div className="relative">
        <select
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none bg-white border border-[#e5e7eb] rounded-full pl-4 pr-9 py-2 text-[14px] text-[#2b3038] cursor-pointer hover:bg-[#f8fafc] transition-colors"
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

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[400px] overflow-hidden border-b border-black/10">
        {/* bg photo */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroImg} alt="" className="absolute w-full h-[110%] -top-[10%] object-cover" />
        </div>
        {/* gradient overlay — blue-tinted at top fading to white */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
          }}
        />
        {/* cloud overlay at 40% */}
        <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
          <img src={cloudsImg} alt="" className="absolute w-full h-full object-cover" />
        </div>
        {/* EDF6FF gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
          }}
        />

        {/* Text content */}
        <div className="relative h-full flex flex-col items-center justify-center gap-2 px-6 text-center pt-6">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span className="text-[16px] font-medium text-[#6a7282] tracking-[-0.16px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Listing
            </span>
          </div>
          <div className="flex flex-col gap-4 items-center">
            <h1
              className="text-[44px] font-semibold text-[#0d2138] leading-[56px] tracking-[-0.44px] whitespace-nowrap"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Featured Luxury Listings
            </h1>
            <p
              className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px] max-w-[560px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Discover a wide range of properties, from cozy apartments to luxurious estates, tailored to suit every need and budget.
            </p>
          </div>
        </div>
      </section>

      {/* ── Search Bar Card ── */}
      <div className="relative z-10 -mt-[69px] px-6 lg:px-10 flex justify-center">
        <div className="w-full max-w-[1440px] bg-white border border-[#e5e7eb] rounded-[24px] px-[10px] py-[10px] flex flex-col items-center justify-center min-h-[138px]">
          <div className="flex flex-wrap gap-3.5 items-end justify-center w-full">
            {/* Location */}
            <div className="flex flex-col gap-3 items-start flex-1 min-w-[200px] max-w-[361px]">
              <p className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Location
              </p>
              <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <svg width="20" height="20" viewBox="0 0 14.7333 18.0667" fill="none">
                    <path d={svgPaths.p327f1700} stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                    <path d={svgPaths.p131e2100} stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                  </svg>
                  <span className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Enter city, area, or address
                  </span>
                </div>
                <ChevronDown />
              </div>
            </div>

            {/* Property Type */}
            <div className="flex flex-col gap-3 items-start flex-1 min-w-[180px] max-w-[307px]">
              <p className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Property Type
              </p>
              <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <svg width="20" height="20" viewBox="0 0 16.4 17.011" fill="none">
                    <path d={svgPaths.p2e793b00} stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                  </svg>
                  <span className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Select property type
                  </span>
                </div>
                <ChevronDown />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="flex flex-col gap-3 items-start flex-1 min-w-[180px] max-w-[285px]">
              <p className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Transaction Type
              </p>
              <div className="w-full bg-white border border-[#e5e7eb] rounded-[90px] px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <svg width="20" height="20" viewBox="0 0 18.0667 16.4" fill="none">
                    <path d={svgPaths.p11b8b2c0} stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                  </svg>
                  <span className="text-[16px] text-[#6a7282] leading-[24px] whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Select transaction
                  </span>
                </div>
                <ChevronDown />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-[15px] flex-shrink-0">
              <button
                className="bg-white border border-[#e5e7eb] rounded-[60px] px-5 py-3 text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] whitespace-nowrap"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                More Filters
              </button>
              <button
                className="h-[48px] px-6 py-3 rounded-[48px] text-[16px] text-white whitespace-nowrap"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                Search Properties
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings Grid ── */}
      <section className="bg-white py-10 lg:py-14">
        <div className="px-6 lg:px-10">
         <div className="max-w-[1440px] mx-auto">
          {/* Results header */}
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-[22px] lg:text-[24px] font-semibold text-[#0d2138] leading-[32px] tracking-[-0.24px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Lisbon: <span className="text-[#4896b6]">2,594</span> properties found
            </h2>
            <button
              className="flex items-center gap-2 bg-[#0d2138] px-5 py-2.5 rounded-full text-[14px] text-white font-medium"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d={svgPaths.p277d2000} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
              </svg>
              Map
            </button>
          </div>

          {/* 3-column card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {listings.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination current={page} total={16} onChange={setPage} />
         </div>
        </div>
      </section>

      {/* ── You Might Also Like ── */}
      <section className="bg-white pt-4 pb-16 lg:pb-20">
        <div className="px-6 lg:px-10">
         <div className="max-w-[1440px] mx-auto">
          {/* Section heading */}
          <div className="flex flex-col items-center gap-4 mb-12 text-center">
            <h2
              className="text-[44px] font-semibold text-[#0d2138] leading-[56px] tracking-[-0.44px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              You might also like
            </h2>
            <p
              className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              We have over +10 years of experience in the real estate market
            </p>
          </div>

          {/* 3-card row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((item) => (
              <PropertyCard key={item.id} item={item} />
            ))}
          </div>
         </div>
        </div>
      </section>
    </>
  );
}
