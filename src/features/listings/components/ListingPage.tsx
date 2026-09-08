"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";
import { queryKeys } from "@/lib/query-keys";
import { useShallow } from "zustand/react/shallow";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";
import svgPaths from "./svgPaths";
import { FiltersModal, type FiltersState } from "./FiltersModal";
import {
  LISTINGS_PAGE_SIZE as PAGE_SIZE,
  useListingsQuery,
  useMapListingsQuery,
} from "@/hooks/queries/useListingsQuery";
import {
  useListingFilterStore,
  type PropertyType as PropertyTypeFilter,
  type TransactionType as TransactionTypeFilter,
} from "@/stores/useListingFilterStore";
import type { PublicListingDto } from "../types/listing-dto";
import { PropertyMapModal } from "@/components/maps/PropertyMapModal";
import { propertyTypeLabel } from "../utils/format";
import { PropertyCard } from "./PropertyCard";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
const heroImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const cloudsImg =
"https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.webp";
/* ─── icon helpers ─── */
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
const { t } = useTranslation("listings");
const items = getPageItems(current, total);
return (
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mt-8 sm:mt-10">
  <span
    className="text-[14px] sm:text-[16px] text-[#4B4F52] text-center sm:text-left"
    style={{ fontFamily: "Montserrat, sans-serif" }}
  >
    {t("pagination.pageOf", { current, total })}
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
      aria-label={t("pagination.goToPageAriaLabel")}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <option key={p} value={p}>
          {t("pagination.pageOption", { page: p })}
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
// Built inside the component (not module scope) so labels re-render on language change.
function getPropertyTypeOptions(
  t: TFunction,
): { value: PropertyTypeFilter; label: string }[] {
  return [
    { value: "", label: t("filterOptions.allTypes") },
    { value: "APARTMENT", label: propertyTypeLabel("APARTMENT", t) },
    { value: "HOUSE", label: propertyTypeLabel("HOUSE", t) },
    { value: "COMMERCIAL_OFFICE", label: propertyTypeLabel("COMMERCIAL_OFFICE", t) },
    { value: "LOT", label: propertyTypeLabel("LOT", t) },
    { value: "TOWNHOUSE", label: propertyTypeLabel("TOWNHOUSE", t) },
  ];
}
function getTransactionOptions(
  t: (key: string) => string,
): { value: TransactionTypeFilter; label: string }[] {
  return [
    { value: "", label: t("filterOptions.buyOrRent") },
    { value: "SALE", label: t("filterOptions.buy") },
    { value: "RENT", label: t("filterOptions.rent") },
  ];
}
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
        <div className="flex items-center gap-[10px] min-w-0 flex-1">
          {icon}
          <span
            className={`text-[16px] leading-[24px] truncate min-w-0 max-xl:text-[14px] ${
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
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#e5e7eb] rounded-[16px] shadow-lg z-20 py-1 max-h-[280px] overflow-y-auto overscroll-contain">
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
const { t } = useTranslation("listings");
const propertyTypeOptions = useMemo(() => getPropertyTypeOptions(t), [t]);
const transactionOptions = useMemo(() => getTransactionOptions(t), [t]);
const heroRef = useRef<HTMLElement>(null);
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"],
});
const heroImgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

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
const [debouncedLocation, setDebouncedLocation] = useState(filters.location);
const locationRef = useRef<HTMLDivElement>(null);
// Syncing the input text from the filters prop (an external input).
// eslint-disable-next-line react-hooks/set-state-in-effect
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
  const timer = setTimeout(() => setDebouncedLocation(locationInput), 250);
  return () => clearTimeout(timer);
}, [locationInput]);
const { data: locData } = useQuery({
  queryKey: queryKeys.locationSuggestions(debouncedLocation),
  queryFn: () =>
    fetch(`/api/listings/locations?q=${encodeURIComponent(debouncedLocation)}`)
      .then((r) => (r.ok ? r.json() : { locations: [] })),
  staleTime: 5 * 60 * 1000,
  placeholderData: (prev: unknown) => prev,
});
const locationSuggestions: string[] = (locData as { locations?: string[] } | undefined)?.locations ?? [];

const { data, isLoading, isError } = useListingsQuery(page);
const listings: PublicListingDto[] = useMemo(() => data?.listings ?? [], [data]);
const total = data?.total ?? 0;

const { data: mapData } = useMapListingsQuery(isMapOpen);
const mapListings: PublicListingDto[] = useMemo(() => mapData?.listings ?? [], [mapData]);

const { data: featuredData } = useQuery({
  queryKey: ["listings", "public-featured"],
  queryFn: async () => {
    const res = await fetch("/api/listings?featured=true");
    if (!res.ok) throw new Error("Failed to fetch featured listings");
    return res.json();
  },
});
const suggestions: PublicListingDto[] = (featuredData?.listings ?? []).slice(0, 3);

const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
const safePage = Math.min(page, totalPages);
// Snap back to page 1 whenever the result set changes (syncing from filters, an external input).
const filterKey = JSON.stringify(filters);
// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(() => setPage(1), [filterKey]);

const resultsHeading = isLoading
  ? t("results.searching")
  : isError
    ? t("results.error")
    : `${filters.location ? `${filters.location}: ` : ""}${t("results.found", { count: total })}`;

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
<section ref={heroRef} className="relative flex min-h-[420px] justify-center overflow-hidden border-b border-black/10">
   {/* bg photo */}
   <div className="absolute inset-0 overflow-hidden">
      <motion.img
         src={heroImg}
         alt=""
         className="absolute w-full h-[130%] -top-[15%] object-cover"
         style={{ y: heroImgY }}
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
   <Reveal
     as="div"
     amount={0.6}
     className="relative flex w-full max-w-[760px] flex-col items-center gap-2 px-4 pb-8 text-center"
     style={{ paddingTop: "var(--space-fluid-hero-pt-sm)" }}
   >
   <div className="inline-flex items-center gap-2 rounded-full border border-[#ccdeef] bg-[#f0f6fa] px-3 py-1.5">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: "linear-gradient(135deg, #005ea4 0%, #006fc2 100%)" }}
      />
         <span
         className="text-[11px] sm:text-[12px] font-medium text-[#232323] uppercase tracking-[1.2px] whitespace-nowrap"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {t("hero.badge")}
         </span>
      </div>
      <div className="flex flex-col gap-3 sm:gap-4 items-center">
         <SplitHeading
           as="h1"
           text={t("hero.title")}
           className="font-medium text-[#101010] leading-[1.2] tracking-[-1.5px]"
           style={{ fontFamily: "Poppins, sans-serif", fontSize: "var(--text-fluid-h2)" }}
           amount={0.6}
         />
         <p
         className="max-w-[38ch] font-medium text-[#4f4f4f] leading-[1.5] tracking-[-0.01em]"
         style={{ fontFamily: "Montserrat, sans-serif", fontSize: "var(--text-fluid-subtitle-sm)" }}
         >
         {t("hero.subtitle")}
         </p>
      </div>
   </Reveal>
</section>
{/* ── Search Bar Card ── */}
<div className="bg-white px-6 lg:px-10 flex justify-center ">
  <Reveal
    delay={0.3}
    amount={0.6}
    className="relative z-10 -mt-[69px] w-full max-w-[1440px] bg-white border border-[#e5e7eb] rounded-[24px] px-[10px] py-[10px] flex flex-col items-center justify-center min-h-[138px] max-xl:rounded-[18px] max-xl:px-4 max-xl:py-4 max-xl:min-h-0">
  <div className="flex flex-wrap gap-3.5 items-end justify-center w-full max-xl:grid max-xl:grid-cols-2 max-md:grid-cols-1 max-xl:gap-4">
    {/* Location */}
    <div className="flex flex-col gap-3 items-start flex-1 min-w-[200px] max-w-[361px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[16px] text-[#0d2138] leading-[24px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("searchBar.locationLabel")}
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
              placeholder={t("searchBar.locationPlaceholder")}
              className="w-full min-w-0 bg-transparent text-[16px] text-[#0d2138] placeholder:text-[#6a7282] leading-[24px] outline-none max-xl:text-[14px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              aria-label={t("searchBar.locationAriaLabel")}
            />
          </div>

          {locationInput ? (
            <button
              type="button"
              onClick={() => commitLocation("")}
              aria-label={t("searchBar.clearLocationAriaLabel")}
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
          <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#e5e7eb] rounded-[16px] shadow-lg z-20 py-1 max-h-[280px] overflow-y-auto overscroll-contain">
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
        {t("searchBar.propertyTypeLabel")}
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
        placeholder={t("searchBar.propertyTypePlaceholder")}
        options={propertyTypeOptions}
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
        {t("searchBar.transactionTypeLabel")}
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
        placeholder={t("searchBar.transactionTypePlaceholder")}
        options={transactionOptions}
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
        {t("searchBar.moreFiltersButton")}
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

        <span className="relative z-10">{t("searchBar.searchButton")}</span>
      </button>
    </div>
  </div>
</Reveal>
</div>
{/* ── Listings Grid ── */}
<section className="bg-white py-8 sm:py-10 lg:py-14">
   <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
      {/* Section heading */}
      <Reveal className="flex flex-col items-center gap-5 text-center mb-10 sm:mb-12" amount={0.4}>
         <div className="flex items-center gap-3 w-full max-w-[380px]">
            <div className="h-px flex-1 bg-[#e2e5ea]" />
            <span
              className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("grid.badge")}
            </span>
            <div className="h-px flex-1 bg-[#e2e5ea]" />
         </div>
         <div className="max-w-[573px]">
            <SplitHeading
              as="h2"
              text={t("grid.title")}
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            <p
              className="mt-3 text-[14px] sm:text-[16px] text-[#4f4f4f]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("grid.subtitle")}
            </p>
         </div>
      </Reveal>
      {/* Results header */}
      <Reveal className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 sm:mb-8" amount={0.5}>
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
            {t("results.mapButton")}
         </button>
      </Reveal>
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
      ) : listings.length > 0 ? (
      <Reveal
        key={`${filterKey}-${safePage}`}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8 sm:gap-y-10"
        stagger={0.08}
        amount={0.1}
      >
         {listings.map((item) => (
         <RevealItem key={item.slug}>
           <PropertyCard property={item} />
         </RevealItem>
         ))}
      </Reveal>
      ) : (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
         <p
         className="text-[20px] font-medium text-[#0d2138]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {isError ? t("results.emptyErrorTitle") : t("results.emptyNoResultsTitle")}
         </p>
         <p
         className="text-[15px] text-[#6a7282] max-w-[420px]"
         style={{ fontFamily: "Montserrat, sans-serif" }}
         >
         {isError
         ? t("results.emptyErrorMessage")
         : t("results.emptyNoResultsMessage")}
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
            {t("results.clearFiltersButton")}
         </button>
         ) : null}
      </div>
      )}
      {/* Pagination */}
      {!isLoading && total > PAGE_SIZE ? (
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
         <Reveal className="flex flex-col items-center gap-5 mb-8 sm:mb-10 lg:mb-12 text-center" amount={0.4}>
            <div className="flex items-center gap-3 w-full max-w-[380px]">
               <div className="h-px flex-1 bg-[#e2e5ea]" />
               <span
                 className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap"
                 style={{ fontFamily: "Montserrat, sans-serif" }}
               >
                 {t("suggestions.badge")}
               </span>
               <div className="h-px flex-1 bg-[#e2e5ea]" />
            </div>
            <SplitHeading
              as="h2"
              text={t("suggestions.title")}
              className="text-[28px] sm:text-[34px] lg:text-[40px] xl:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            <p
            className="-mt-2 text-[14px] sm:text-[15px] lg:text-[16px] leading-[22px] sm:leading-[24px] text-[#4f4f4f] tracking-[-0.01em] max-w-[520px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            {t("suggestions.subtitle")}
            </p>
         </Reveal>
         {/* 3-card row */}
         <Reveal className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6" stagger={0.12} amount={0.15}>
            {suggestions.map((item) => (
            <RevealItem key={item.slug}>
              <PropertyCard property={item} />
            </RevealItem>
            ))}
         </Reveal>
      </div>
   </div>
</section>
) : null}
<ConsultationBanner />
{isMapOpen ? (
  <PropertyMapModal listings={mapListings} onClose={() => setIsMapOpen(false)} />
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