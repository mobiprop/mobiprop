"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

function IconDollar() { return <img src="/pages/filter-2464-4782.svg" alt="" width={18} height={18}/>; }
function IconBed() { return <img src="/pages/filter-2464-4802.svg" alt="" width={18} height={18}/>; }
function IconBath() { return <img src="/pages/filter-2464-4819.svg" alt="" width={18} height={18}/>; }
function IconGrid() { return <img src="/pages/filter-2464-4841.svg" alt="" width={18} height={18}/>; }
function IconChevron() { return <img src="/pages/filter-2464-4807.svg" alt="" width={18} height={18}/>; }
function IconCreditCard({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4851.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4851.svg) center / contain no-repeat"}}/>; }
function IconFlame({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4856.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4856.svg) center / contain no-repeat"}}/>; }
function IconRadiant({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4860.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4860.svg) center / contain no-repeat"}}/>; }
function IconWifi({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4864.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4864.svg) center / contain no-repeat"}}/>; }
function IconAC({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4871.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4871.svg) center / contain no-repeat"}}/>; }
function IconGrill({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4877.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4877.svg) center / contain no-repeat"}}/>; }
function IconWasher({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4884.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4884.svg) center / contain no-repeat"}}/>; }
function IconWater({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4892.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4892.svg) center / contain no-repeat"}}/>; }
function IconTennis({active}:{active:boolean}) { return <span aria-hidden="true" className="inline-block size-4 shrink-0" style={{backgroundColor:active?"#005089":"#6a7282",mask:"url(/pages/filter-2464-4897.svg) center / contain no-repeat",WebkitMask:"url(/pages/filter-2464-4897.svg) center / contain no-repeat"}}/>; }

type Amenity = "Credit Approved" | "Gas" | "Radiant Slab" | "Internet" | "Air Conditioning" | "Barbecue" | "Laundry" | "Water" | "Tennis Court";

const amenityList: { label: Amenity; i18nKey: string; icon: (active: boolean) => React.ReactNode }[] = [
  { label: "Credit Approved",  i18nKey: "filtersModal.amenities.creditApproved",  icon: (a) => <IconCreditCard active={a} /> },
  { label: "Gas",              i18nKey: "filtersModal.amenities.gas",             icon: (a) => <IconFlame active={a} /> },
  { label: "Radiant Slab",     i18nKey: "filtersModal.amenities.radiantSlab",     icon: (a) => <IconRadiant active={a} /> },
  { label: "Internet",         i18nKey: "filtersModal.amenities.internet",        icon: (a) => <IconWifi active={a} /> },
  { label: "Air Conditioning", i18nKey: "filtersModal.amenities.airConditioning", icon: (a) => <IconAC active={a} /> },
  { label: "Barbecue",         i18nKey: "filtersModal.amenities.barbecue",        icon: (a) => <IconGrill active={a} /> },
  { label: "Laundry",          i18nKey: "filtersModal.amenities.laundry",         icon: (a) => <IconWasher active={a} /> },
  { label: "Water",            i18nKey: "filtersModal.amenities.water",           icon: (a) => <IconWater active={a} /> },
  { label: "Tennis Court",     i18nKey: "filtersModal.amenities.tennisCourt",     icon: (a) => <IconTennis active={a} /> },
];

// Stable values ("Any", "1+", …) consumed by ListingPage's `applyModalFilters` —
// must stay in English; only the rendered text is translated.
const bedroomOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
const bathroomOptions = ["Any", "1+", "2+", "3+", "4+"];

/* ─── Main component ─── */
export function FiltersModal({ onClose, onApply, initialValues }: {
  onClose: () => void;
  initialValues?: FiltersState;
  onApply?: (filters: FiltersState) => void;
}) {
  const { t } = useTranslation("listings");
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice ?? "");
  const [bedrooms, setBedrooms] = useState(initialValues?.bedrooms ?? "Any");
  const [bathrooms, setBathrooms] = useState(initialValues?.bathrooms ?? "Any");
  const [minArea, setMinArea] = useState(initialValues?.minArea ?? "");
  const [maxArea, setMaxArea] = useState(initialValues?.maxArea ?? "");
  const [amenities, setAmenities] = useState<Set<Amenity>>(() => new Set([...(initialValues?.amenities ?? [])].filter((a): a is Amenity => amenityList.some(item => item.label === a))));
  const [bedroomOpen, setBedroomOpen] = useState(false);
  const [bathroomOpen, setBathroomOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    overlayRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a); else next.add(a);
      return next;
    });
  }

  function handleReset() {
    setMinPrice(""); setMaxPrice(""); setBedrooms("Any"); setBathrooms("Any");
    setMinArea(""); setMaxArea(""); setAmenities(new Set());
  }

  const invalidRange = [[minPrice, maxPrice], [minArea, maxArea]].some(([min, max]) =>
    [min, max].some(value => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) ||
    (min !== "" && max !== "" && Number(min) > Number(max)));

  function handleApply() {
    if (invalidRange) return;
    onApply?.({ minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, amenities });
    onClose();
  }

  function bedroomOptionLabel(opt: string) {
    return opt === "Any" ? t("filtersModal.anyOption") : t("filtersModal.bedroomsOption", { value: opt });
  }

  function bathroomOptionLabel(opt: string) {
    return opt === "Any" ? t("filtersModal.anyOption") : t("filtersModal.bathroomsOption", { value: opt });
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("filtersModal.priceRangeTitle")}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const items = overlayRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]');
        if (!items?.length) return;
        const first=items[0], last=items[items.length-1];
        if (event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-[1100px] max-h-[94vh] overflow-y-auto rounded-[20px] border border-[#d1d5dc] bg-white sm:rounded-[24px]"
        style={{ boxShadow: "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)" }}
      >
        <button type="button" onClick={onClose} aria-label={t("filtersModal.close")} className="absolute right-4 top-3 z-10 flex size-9 items-center justify-center rounded-full text-2xl text-[#0d2138] hover:bg-[#f0f6fa] focus-visible:outline-2 focus-visible:outline-[#005089]">×</button>
        <div className="flex flex-col gap-6 p-4 sm:gap-7 sm:p-6 lg:gap-[26px] lg:p-8">

          {invalidRange && <p id="filter-range-error" role="alert" className="text-sm text-red-700">{t("filtersModal.invalidRange")}</p>}
          {/* ── Price Range ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[18px] lg:text-[18px] lg:leading-8" style={{ fontFamily: poppins }}>
              {t("filtersModal.priceRangeTitle")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconDollar />
                </div>
                <input
                  type="number"
                  min="0"
                  aria-label={t("filtersModal.minPricePlaceholder")}
                  placeholder={t("filtersModal.minPricePlaceholder")}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] py-3 pl-11 pr-4 text-[14px] sm:rounded-[16px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconDollar />
                </div>
                <input
                  type="number"
                  min="0"
                  aria-label={t("filtersModal.maxPricePlaceholder")}
                  placeholder={t("filtersModal.maxPricePlaceholder")}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] py-3 pl-11 pr-4 text-[14px] sm:rounded-[16px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
            </div>
          </div>

          {/* ── Property Details ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[18px] lg:text-[18px] lg:leading-8" style={{ fontFamily: poppins }}>
              {t("filtersModal.propertyDetailsTitle")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

              {/* Bedrooms dropdown */}
              <div className="relative h-12 sm:h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconBed />
                </div>
                <button
                  onClick={() => { setBedroomOpen((o) => !o); setBathroomOpen(false); }}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] pl-11 pr-4 text-left flex items-center justify-between sm:rounded-[16px] sm:pl-12"
                >
                  <span className="text-[14px] leading-6 tracking-[-0.16px] text-[#6a7282] sm:text-[16px]" style={{ fontFamily: montserrat }}>
                    {bedrooms === "Any" ? t("filtersModal.bedroomsLabel") : bedroomOptionLabel(bedrooms)}
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
                        {bedroomOptionLabel(opt)}
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
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] pl-11 pr-4 text-left flex items-center justify-between sm:rounded-[16px] sm:pl-12"
                >
                  <span className="text-[14px] leading-6 tracking-[-0.16px] text-[#6a7282] sm:text-[16px]" style={{ fontFamily: montserrat }}>
                    {bathrooms === "Any" ? t("filtersModal.bathroomsLabel") : bathroomOptionLabel(bathrooms)}
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
                        {bathroomOptionLabel(opt)}
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
                  min="0"
                  aria-label={t("filtersModal.minAreaPlaceholder")}
                  placeholder={t("filtersModal.minAreaPlaceholder")}
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] py-3 pl-11 pr-4 text-[14px] sm:rounded-[16px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  min="0"
                  aria-label={t("filtersModal.maxAreaPlaceholder")}
                  placeholder={t("filtersModal.maxAreaPlaceholder")}
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="h-12 w-full sm:h-[52px] rounded-[12px] border border-[#e9e9e9] bg-[#fcfcfc] py-3 pl-11 pr-4 text-[14px] sm:rounded-[16px] sm:pl-12 sm:text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px] outline-none focus:ring-2 focus:ring-[#6889ae] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontFamily: montserrat }}
                />
              </div>
            </div>
          </div>

          {/* ── Amenities ── */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="whitespace-nowrap text-[17px] font-medium leading-7 tracking-[-0.2px] text-[#0d2138] sm:text-[18px] lg:text-[18px] lg:leading-8" style={{ fontFamily: poppins }}>
              {t("filtersModal.amenitiesTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {amenityList.map(({ label, i18nKey, icon }) => {
                const isActive = amenities.has(label);
                return (
                  <button
                    key={label}
                    aria-pressed={isActive}
                    onClick={() => toggleAmenity(label)}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-[14px] sm:py-[9px] ${
                      isActive
                        ? "bg-[#eaeff4] border-[1.2px] border-[#6889ae] text-[#1e4f86]"
                        : "bg-[#f3f4f6] text-[#6a7282]"
                    }`}
                  >
                    <span className="shrink-0">{icon(isActive)}</span>
                    <span className="text-[13px] font-medium leading-5 sm:text-[14px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
                      {t(i18nKey)}
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
              className="h-11 w-full rounded-[12px] bg-[#e5e7eb] px-5 text-[14px] font-medium leading-6 tracking-[-0.16px] text-[#2b3038] sm:h-12 sm:w-auto sm:rounded-[16px] sm:px-6 sm:text-[16px]"
              style={{ fontFamily: montserrat }}
            >
              {t("filtersModal.resetButton")}
            </button>
            <button
              onClick={handleApply}
              disabled={invalidRange}
              aria-describedby={invalidRange ? "filter-range-error" : undefined}
              className="h-11 w-full rounded-[12px] bg-[#1e4f86] px-5 text-[14px] leading-5 tracking-[-0.14px] text-white sm:h-12 sm:w-auto sm:px-6"
              style={{ fontFamily: montserrat }}
            >
              {t("filtersModal.applyButton")}
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