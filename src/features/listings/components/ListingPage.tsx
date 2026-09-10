"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/lib/query-keys";
import { useShallow } from "zustand/react/shallow";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";
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
/* ─── icon helpers ─── */
function ChevronDown() {
return <img src="/listings/chevron-down.svg" alt="" width={16} height={16} className="size-4 shrink-0" />;
}
function MapIcon() { return <img src="/listings/map.svg" alt="" width={16} height={16} className="size-4" />; }
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
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mt-6 min-h-[68px] px-[22px] py-4">
  <span
    className="text-[14px] sm:text-[16px] text-[#4B4F52] text-center sm:text-left"
    style={{ fontFamily: "Montserrat, sans-serif" }}
  >
    {t("pagination.pageOf", { current, total })}
  </span>

  <div className="flex items-center justify-center gap-1 flex-wrap">
    <button
      onClick={() => onChange(Math.max(1, current - 1))}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white hover:bg-[#f8fafc] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      disabled={current === 1}
    >
      <img src="/listings/page-previous.svg" alt="" width={16} height={16} />
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
      <img src="/listings/page-next.svg" alt="" width={16} height={16} />
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
        className="w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-2.5 h-11 flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-[10px] min-w-0 flex-1">
          {icon}
          <span
            className={`text-[14px] leading-[20px] truncate min-w-0 max-xl:text-[14px] ${
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


const [page, setPage] = useState(1);
const [sort, setSort] = useState<"recent" | "oldest">("recent");
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

const { data, isLoading, isError } = useListingsQuery(page, sort);
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
<section ref={heroRef} className="relative flex min-h-[457px] justify-center overflow-hidden border-b border-black/10">
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
     <img src="/listings/hero.jpg" alt="" className="absolute max-w-none" style={{left: 0, top: -80, width: "100%", height: 537, objectFit: "cover"}} />
     <div className="absolute rounded-[50%]" style={{left: "-15.995%", top: 245, width: "131.92%", height: 887.292, background: "rgba(211,233,255,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute rounded-[50%]" style={{left: "-8.579%", top: 366.669, width: "117.142%", height: 792.331, background: "rgba(71,169,255,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute rounded-[50%]" style={{left: "7.715%", top: 474.687, width: "84.555%", height: 652.857, background: "rgba(0,55,134,.9)", filter: "blur(236.104px)"}} />
     <div className="absolute" style={{left: "-8.75%", top: -56, width: "117.847%", height: 543, background: "rgba(241,249,255,.95)", filter: "blur(192px)"}} />
   </div>
   {/* Text content */}
   <Reveal
     as="div"
     amount={0.6}
     className="relative flex w-full max-w-[725px] flex-col items-center gap-3 px-4 pb-8 text-center"
     style={{ paddingTop: "87px" }}
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
      <div className="flex flex-col gap-5 items-center">
         <SplitHeading
           as="h1"
           text={t("hero.title")}
           className="font-medium text-[#101010] leading-[1.2] tracking-[-1.5px]"
           style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(34px, 3.612vw, 52px)" }}
           amount={0.6}
         />
         <p
         className="max-w-[618px] font-medium text-[#4f4f4f] leading-[1.5] tracking-[-0.01em]"
         style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(16px, 1.25vw, 18px)" }}
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
    className="relative z-10 -mt-[70px] w-full max-w-[1091px] bg-white border border-[#e5e7eb] rounded-[16px] px-6 py-5 flex flex-col items-center justify-center min-h-[112px] max-xl:rounded-[18px] max-xl:px-4 max-xl:py-4 max-xl:min-h-0">
  <div className="flex flex-wrap gap-3.5 items-end justify-center w-full max-xl:grid max-xl:grid-cols-2 max-md:grid-cols-1 max-xl:gap-4">
    {/* Location */}
    <div className="flex flex-col gap-1.5 items-start flex-1 min-w-[200px] max-w-[291px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[14px] text-[#232323] leading-[20px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("searchBar.locationLabel")}
      </p>

      <div ref={locationRef} className="relative w-full">
        <div className="w-full bg-white border border-[#e5e7eb] rounded-xl px-4 py-2.5 h-11 flex items-center justify-between gap-3">
          <div className="flex items-center gap-[10px] min-w-0 flex-1">
            <img src="/listings/location.svg" alt="" width={18} height={18} className="size-[18px] shrink-0" />

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
              className="w-full min-w-0 bg-transparent text-[14px] text-[#0d2138] placeholder:text-[#6a7282] leading-[24px] outline-none max-xl:text-[14px]"
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
    <div className="flex flex-col gap-1.5 items-start flex-1 min-w-[180px] max-w-[247px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[14px] text-[#232323] leading-[20px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("searchBar.propertyTypeLabel")}
      </p>

      <SearchBarDropdown
        icon={
          <img src="/listings/home.svg" alt="" width={18} height={18} className="size-[18px] shrink-0" />
        }
        placeholder={t("searchBar.propertyTypePlaceholder")}
        options={propertyTypeOptions}
        value={filters.propertyType}
        onChange={(value) => store.setPropertyType(value)}
      />
    </div>

    {/* Transaction Type */}
    <div className="flex flex-col gap-1.5 items-start flex-1 min-w-[180px] max-w-[232px] max-xl:max-w-none max-xl:w-full max-xl:min-w-0 max-xl:gap-2">
      <p
        className="text-[14px] text-[#232323] leading-[20px] tracking-[-0.16px] max-xl:text-[14px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("searchBar.transactionTypeLabel")}
      </p>

      <SearchBarDropdown
        icon={
          <img src="/listings/building.svg" alt="" width={18} height={18} className="size-[18px] shrink-0" />
        }
        placeholder={t("searchBar.transactionTypePlaceholder")}
        options={transactionOptions}
        value={filters.transactionType}
        onChange={(value) => store.setTransactionType(value)}
      />
    </div>

    {/* Buttons */}
    <div className="flex items-center gap-2.5 flex-shrink-0 max-xl:col-span-full max-xl:w-full max-xl:flex-row max-md:flex-col max-xl:items-stretch max-xl:gap-3">
      <button
        onClick={() => setIsFiltersOpen(true)}
        className="flex items-center justify-center gap-2.5 h-11 bg-[#fcfcfc] border border-[#e9e9e9] rounded-xl px-4 py-2.5 text-[14px] text-[#6a7282] leading-[24px] tracking-[-0.16px] whitespace-nowrap hover:border-[#6889ae] hover:text-[#1e4f86] transition-colors max-xl:w-full max-xl:text-[14px] cursor-pointer"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        <img src="/listings/filters.svg" alt="" width={16} height={16} className="size-4 shrink-0" />{t("searchBar.moreFiltersButton")}
      </button>

      <button
        onClick={() => commitLocation(locationInput)}
        className="relative h-[44px] w-[120px] overflow-hidden whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] text-white transition-opacity hover:opacity-90 max-xl:w-full max-xl:text-[14px] cursor-pointer flex items-center justify-center gap-1"
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

        <img src="/listings/search.svg" alt="" width={18} height={18} className="relative size-[18px] shrink-0" /><span className="relative z-10">{t("searchBar.searchButton")}</span>
      </button>
    </div>
  </div>
</Reveal>
</div>
{/* ── Listings Grid ── */}
<section className="bg-white pt-16 pb-12 sm:pt-24 lg:pt-[150px] lg:pb-[150px]">
   <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto">
      {/* Section heading */}
      <Reveal className="flex flex-col items-center gap-5 text-center mb-10 sm:mb-[50px]" amount={0.4}>
         <div className="flex items-center gap-3 w-full max-w-[866px]">
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
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight lg:leading-[52px] tracking-[-1px]"
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
      <Reveal className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4" amount={0.5}>
         <h2
         className="text-[14px] font-normal text-[#4f4f4f] leading-[21px] tracking-[-0.01em]"
         style={{ fontFamily: "Poppins, sans-serif" }}
         >
         {resultsHeading}
         </h2>
         <div className="flex items-center gap-3">
           <div className="relative flex items-center h-10 rounded-xl border border-[#e9e9e9] bg-white">
             <img src="/listings/sort.svg" alt="" width={16} height={16} className="pointer-events-none absolute left-4" />
             <select aria-label={t("results.sortLabel")} value={sort} onChange={(event) => { setSort(event.target.value as "recent" | "oldest"); setPage(1); }} className="h-full appearance-none rounded-xl bg-transparent pl-10 pr-10 text-[14px] text-[#00223a]" style={{fontFamily: "Montserrat, sans-serif"}}>
               <option value="recent">{t("results.mostRecent")}</option>
               <option value="oldest">{t("results.oldest")}</option>
             </select>
             <img src="/listings/sort-chevron.svg" alt="" width={16} height={16} className="pointer-events-none absolute right-4" />
           </div>
         <button
            onClick={() =>
            setIsMapOpen(true)}
            className="w-fit flex items-center gap-2 bg-gradient-to-br from-[#005ea4] to-[#006fc2] h-10 px-4 py-2.5 rounded-xl text-[14px] text-white font-medium hover:bg-[#17446f] transition-colors cursor-pointer"
            style={{ fontFamily: "Montserrat, sans-serif" }}
            >
            <MapIcon />
            {t("results.mapButton")}
         </button>
         </div>
      </Reveal>
      {/* Card grid */}
      {isLoading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8">
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
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-8"
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
<section className="bg-white pb-16 lg:pb-[120px]">
   <div className="might">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto">
         {/* Section heading */}
         <Reveal className="flex flex-col items-center gap-5 mb-8 sm:mb-10 text-center" amount={0.4}>
            <div className="flex items-center gap-3 w-full max-w-[866px]">
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
              className="text-[28px] sm:text-[34px] lg:text-[40px] xl:text-[44px] font-medium text-[#00223a] leading-tight lg:leading-[52px] tracking-[-1px]"
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