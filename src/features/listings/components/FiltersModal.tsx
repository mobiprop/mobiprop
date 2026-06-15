"use client";

import { useState, useEffect, useRef } from "react";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── SVG Icons ─── */
function IconDollar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5v15M12.75 4.5H7.125A2.625 2.625 0 0 0 7.125 9.75h3.75A2.625 2.625 0 0 1 10.875 15H5.25" stroke="#6a7282" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBed() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1.5 14.25V3.75M1.5 11.25H16.5V14.25M1.5 8.25h6M16.5 8.25V11.25A2.25 2.25 0 0 0 14.25 9H7.5a2.25 2.25 0 0 0-2.25 2.25" stroke="#6a7282" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4.5" cy="6" r="1.125" stroke="#6a7282" strokeWidth="1.2"/>
    </svg>
  );
}

function IconBath() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.25 9h13.5v2.25a4.5 4.5 0 0 1-4.5 4.5h-4.5A4.5 4.5 0 0 1 2.25 11.25V9ZM5.25 9V5.25a2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25V9M5.25 15.75v.75M12.75 15.75v.75" stroke="#6a7282" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.25" y="2.25" width="5.25" height="5.25" rx="1" stroke="#6a7282" strokeWidth="1.2"/>
      <rect x="10.5" y="2.25" width="5.25" height="5.25" rx="1" stroke="#6a7282" strokeWidth="1.2"/>
      <rect x="2.25" y="10.5" width="5.25" height="5.25" rx="1" stroke="#6a7282" strokeWidth="1.2"/>
      <rect x="10.5" y="10.5" width="5.25" height="5.25" rx="1" stroke="#6a7282" strokeWidth="1.2"/>
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 1.5l5 5 5-5" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* Amenity icons */
function IconCreditCard({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={c} strokeWidth="1.2"/>
      <path d="M1.5 6.5h13" stroke={c} strokeWidth="1.2"/>
      <path d="M4 10h2.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconFlame({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 14c-2.761 0-5-2.015-5-4.5 0-1.657 1-3.5 2.5-4.5-.5 1.5.5 2.5 1 3 0-2 1.5-4 3.5-5C9.5 4.5 10 5.5 10 6.5c.5-.5 1-1.5 1-2.5 1 1 2 2.5 2 4.5C13 11.985 10.761 14 8 14Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconRadiant({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 11h12M2 8.5h12M2 6h12M4 11v2M8 11v2M12 11v2" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5 6c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconWifi({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 6.5A9.5 9.5 0 0 1 8 4a9.5 9.5 0 0 1 6.5 2.5M3.5 8.75A6.5 6.5 0 0 1 8 7a6.5 6.5 0 0 1 4.5 1.75M5.5 11A3.5 3.5 0 0 1 8 10a3.5 3.5 0 0 1 2.5 1" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="13.5" r="0.75" fill={c}/>
    </svg>
  );
}

function IconAC({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="6" rx="1.5" stroke={c} strokeWidth="1.2"/>
      <path d="M4 6.5h8M8 9.5v3M6 11l2 1.5M10 11l-2 1.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconGrill({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5.5h12M4.5 5.5a5.5 5.5 0 0 0 7 0M8 10.5v3M6 12l2 1.5M10 12l-2 1.5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5 3.5c0-1 1-2 1-2s1 1 1 2M9 3.5c0-1 1-2 1-2s1 1 1 2" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function IconWasher({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke={c} strokeWidth="1.2"/>
      <circle cx="8" cy="9" r="3" stroke={c} strokeWidth="1.2"/>
      <circle cx="4.5" cy="4" r="0.75" fill={c}/>
      <path d="M7 8a2 2 0 0 1 2 2" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function IconWater({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L4 7.5a4 4 0 1 0 8 0L8 2Z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconTennis({ active }: { active: boolean }) {
  const c = active ? "#1e4f86" : "#6a7282";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke={c} strokeWidth="1.2"/>
      <path d="M4.5 4.5c1.5 1 2 2.5 2 3.5s-.5 2.5-2 3.5M11.5 4.5c-1.5 1-2 2.5-2 3.5s.5 2.5 2 3.5" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Types ─── */
type Amenity = "Credit Approved" | "Gas" | "Radiant Slab" | "Internet" | "Air Conditioning" | "Barbecue" | "Laundry" | "Water" | "Tennis Court";

const amenityList: { label: Amenity; icon: (active: boolean) => React.ReactNode }[] = [
  { label: "Credit Approved",  icon: (a) => <IconCreditCard active={a} /> },
  { label: "Gas",              icon: (a) => <IconFlame active={a} /> },
  { label: "Radiant Slab",     icon: (a) => <IconRadiant active={a} /> },
  { label: "Internet",         icon: (a) => <IconWifi active={a} /> },
  { label: "Air Conditioning", icon: (a) => <IconAC active={a} /> },
  { label: "Barbecue",         icon: (a) => <IconGrill active={a} /> },
  { label: "Laundry",          icon: (a) => <IconWasher active={a} /> },
  { label: "Water",            icon: (a) => <IconWater active={a} /> },
  { label: "Tennis Court",     icon: (a) => <IconTennis active={a} /> },
];

const bedroomOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
const bathroomOptions = ["Any", "1+", "2+", "3+", "4+"];

/* ─── Main component ─── */
export function FiltersModal({ onClose, onApply }: {
  onClose: () => void;
  onApply?: (filters: FiltersState) => void;
}) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("Any");
  const [bathrooms, setBathrooms] = useState("Any");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [amenities, setAmenities] = useState<Set<Amenity>>(new Set());
  const [bedroomOpen, setBedroomOpen] = useState(false);
  const [bathroomOpen, setBathroomOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  function handleReset() {
    setMinPrice(""); setMaxPrice(""); setBedrooms("Any"); setBathrooms("Any");
    setMinArea(""); setMaxArea(""); setAmenities(new Set());
  }

  function handleApply() {
    onApply?.({ minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, amenities });
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-[1100px] max-h-[94vh] overflow-y-auto rounded-[20px] border border-[#d1d5dc] bg-white sm:rounded-[24px]"
        style={{ boxShadow: "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)" }}
      >
        <div className="flex flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:gap-8 lg:p-8">

          {/* ── Price Range ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[19px] lg:text-[20px] lg:leading-8" style={{ fontFamily: poppins }}>
              Price Range
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconDollar />
                </div>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] py-3 pl-11 pr-4 text-[14px] sm:rounded-[14px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconDollar />
                </div>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] py-3 pl-11 pr-4 text-[14px] sm:rounded-[14px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
            </div>
          </div>

          {/* ── Property Details ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[19px] lg:text-[20px] lg:leading-8" style={{ fontFamily: poppins }}>
              Property Details
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

              {/* Bedrooms dropdown */}
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconBed />
                </div>
                <button
                  onClick={() => { setBedroomOpen((o) => !o); setBathroomOpen(false); }}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] pl-11 pr-4 text-left flex items-center justify-between sm:rounded-[14px] sm:pl-12"
                >
                  <span className="text-[14px] leading-6 tracking-[-0.16px] text-[#6a7282] sm:text-[16px]" style={{ fontFamily: montserrat }}>
                    {bedrooms === "Any" ? "Bedrooms" : `${bedrooms} Bedrooms`}
                  </span>
                  <IconChevron />
                </button>
                {bedroomOpen && (
                  <div className="absolute top-[50px] sm:top-[54px] left-0 w-full bg-white border border-[#e5e7eb] rounded-[12px] shadow-lg z-30 py-1">
                    {bedroomOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setBedrooms(opt); setBedroomOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-[15px] hover:bg-[#f3f4f6] transition-colors ${bedrooms === opt ? "text-[#1e4f86] font-medium" : "text-[#6a7282]"}`}
                        style={{ fontFamily: montserrat }}
                      >
                        {opt === "Any" ? "Any" : `${opt} Bedrooms`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bathrooms dropdown */}
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconBath />
                </div>
                <button
                  onClick={() => { setBathroomOpen((o) => !o); setBedroomOpen(false); }}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] pl-11 pr-4 text-left flex items-center justify-between sm:rounded-[14px] sm:pl-12"
                >
                  <span className="text-[14px] leading-6 tracking-[-0.16px] text-[#6a7282] sm:text-[16px]" style={{ fontFamily: montserrat }}>
                    {bathrooms === "Any" ? "Bathrooms" : `${bathrooms} Bathrooms`}
                  </span>
                  <IconChevron />
                </button>
                {bathroomOpen && (
                  <div className="absolute top-[50px] sm:top-[54px] left-0 w-full bg-white border border-[#e5e7eb] rounded-[12px] shadow-lg z-30 py-1">
                    {bathroomOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setBathrooms(opt); setBathroomOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-[15px] hover:bg-[#f3f4f6] transition-colors ${bathrooms === opt ? "text-[#1e4f86] font-medium" : "text-[#6a7282]"}`}
                        style={{ fontFamily: montserrat }}
                      >
                        {opt === "Any" ? "Any" : `${opt} Bathrooms`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Min Area */}
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconGrid />
                </div>
                <input
                  type="number"
                  placeholder="Min Area (sq ft)"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] py-3 pl-11 pr-4 text-[14px] sm:rounded-[14px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>

              {/* Max Area */}
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconGrid />
                </div>
                <input
                  type="number"
                  placeholder="Max Area (sq ft)"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#d7dce3] bg-[#f8f9fb] py-3 pl-11 pr-4 text-[14px] sm:rounded-[14px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
            </div>
          </div>

          {/* ── Amenities ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[19px] lg:text-[20px] lg:leading-8" style={{ fontFamily: poppins }}>
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {amenityList.map(({ label, icon }) => {
                const isActive = amenities.has(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleAmenity(label)}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-[14px] sm:py-[9px] ${
                      isActive
                        ? "bg-[#eaeff4] border-[1.2px] border-[#6889ae] text-[#1e4f86]"
                        : "bg-[#f3f4f6] text-[#6a7282]"
                    }`}
                  >
                    <span className="shrink-0">{icon(isActive)}</span>
                    <span className="text-[13px] font-medium leading-5 sm:text-[14px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Footer buttons ── */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
            <button
              onClick={handleReset}
              className="h-11 w-full rounded-[12px] bg-[#e5e7eb] px-5 text-[14px] font-medium leading-6 tracking-[-0.16px] text-[#2b3038] sm:h-12 sm:w-auto sm:rounded-[14px] sm:px-6 sm:text-[16px]"
              style={{ fontFamily: montserrat }}
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="h-11 w-full rounded-[12px] bg-[#1e4f86] px-5 text-[14px] leading-5 tracking-[-0.14px] text-white sm:h-12 sm:w-auto sm:px-6"
              style={{ fontFamily: montserrat }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type FiltersState = {
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
  amenities: Set<string>;
};