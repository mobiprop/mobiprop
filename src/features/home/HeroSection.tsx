"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";

const heroImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/homehero.webp";

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 11.6667 14.3333" fill="none">
      <path
        d={svgPaths.p1fff3000}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={svgPaths.p1a179d80}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14.3333 13" fill="none">
      <path
        d={svgPaths.p3c430c00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 9 14.3333" fill="none">
      <path
        d={svgPaths.p16a08f00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 11 6" fill="none">
      <path
        d="M0.5 0.5L5.5 5.5L10.5 0.5"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PROPERTY_TYPE_VALUES = [
  { value: "", labelKey: "hero.propertyTypeOptions.any" },
  { value: "APARTMENT", labelKey: "hero.propertyTypeOptions.apartment" },
  { value: "HOUSE", labelKey: "hero.propertyTypeOptions.house" },
  { value: "COMMERCIAL_OFFICE", labelKey: "hero.propertyTypeOptions.commercialOffice" },
  { value: "LOT", labelKey: "hero.propertyTypeOptions.lot" },
  { value: "TOWNHOUSE", labelKey: "hero.propertyTypeOptions.townhouse" },
] as const;

const PRICE_VALUES = [
  { value: { min: "", max: "" }, labelKey: "hero.priceOptions.any" },
  { value: { min: "", max: "100000" }, labelKey: "hero.priceOptions.upTo100k" },
  { value: { min: "100000", max: "500000" }, labelKey: "hero.priceOptions.100kTo500k" },
  { value: { min: "500000", max: "1000000" }, labelKey: "hero.priceOptions.500kTo1m" },
  { value: { min: "1000000", max: "5000000" }, labelKey: "hero.priceOptions.1mTo5m" },
  { value: { min: "5000000", max: "" }, labelKey: "hero.priceOptions.over5m" },
] as const;

/** Pill-styled dropdown matching the Figma hero search fields. */
function HeroDropdown({
  icon,
  options,
  selectedIndex,
  onSelect,
}: {
  icon: React.ReactNode;
  options: { label: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
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

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-[50px] lg:h-[54px] w-full items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-4 lg:px-5 cursor-pointer"
      >
        <div className="flex min-w-0 items-center gap-3 text-[#4a5565]">
          {icon}
          <span
            className="truncate text-[14px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {options[selectedIndex]?.label}
          </span>
        </div>
        <ChevronDown />
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 max-h-[280px] overflow-y-auto overscroll-contain rounded-[16px] border border-[#e2e5ea] bg-white py-1 shadow-lg">
          {options.map((opt, index) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onSelect(index);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[14px] hover:bg-[#f3f4f6] transition-colors cursor-pointer ${
                index === selectedIndex ? "text-[#00528f] font-medium" : "text-[#4a5565]"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const { t } = useTranslation("home");
  const propertyTypeOptions = PROPERTY_TYPE_VALUES.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));
  const priceOptions = PRICE_VALUES.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");
  const [location, setLocation] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [priceIndex, setPriceIndex] = useState(0);

  // Available-location suggestions for the typed search.
  const [locationOpen, setLocationOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const locationRef = useRef<HTMLDivElement>(null);

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
      fetch(`/api/listings/locations?q=${encodeURIComponent(location)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { locations: [] }))
        .then((data) => setSuggestions(data.locations ?? []))
        .catch(() => undefined);
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [location]);

  function handleSearch() {
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    const propertyType = propertyTypeOptions[typeIndex].value;
    if (propertyType) params.set("propertyType", propertyType);
    params.set("transactionType", activeTab === "buy" ? "SALE" : "RENT");
    const price = priceOptions[priceIndex].value;
    if (price.min) params.set("minPrice", price.min);
    if (price.max) params.set("maxPrice", price.max);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <section className="relative w-full min-h-[760px] sm:min-h-[820px] lg:min-h-[960px] xl:min-h-[950px]">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImg}
          alt="Luxury property"
          className="h-full w-full object-fill"
        />
        <div className="absolute inset-0 bg-[rgba(20,78,128,0.12)]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.62)] to-[rgba(255,255,255,0.9)]" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-70px)] flex-col items-center px-4 pt-[70px] pb-6 sm:pt-[90px] lg:pt-[95px]">
  <div className="mx-auto max-w-[760px] text-center text-white">
    <h1
      className="mb-4 sm:mb-5 capitalize text-[32px] sm:text-[42px] md:text-[54px] lg:text-[60px] leading-[39px] sm:leading-[50px] md:leading-[64px] lg:leading-[70px]"
      style={{
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        letterSpacing: "0",
      }}
    >
      {t("hero.title")}
    </h1>

    <p
      className="mx-auto max-w-[620px] text-[14px] sm:text-[16px] lg:text-[17px] leading-[22px] sm:leading-[24px] opacity-95"
      style={{
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {t("hero.subtitle")}
    </p>
  </div>

  <div className="mt-auto w-full max-w-[1370px] px-0 pb-4 sm:px-4 lg:pb-6">
    <div className="flex pl-0">
      <button
        onClick={() => setActiveTab("buy")}
        className={`h-[52px] sm:h-[56px] lg:h-[60px] w-[130px] sm:w-[145px] text-[14px] font-medium transition-all border-t border-l border-r rounded-tl-2xl ${
          activeTab === "buy"
            ? "bg-white text-[#00528f] border-[#e8e8e8]"
            : "bg-[rgba(0,0,0,0.58)] text-white border-[#d5d5d552]"
        }`}
        style={{
          fontFamily: "Montserrat, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {t("hero.tabBuy")}
      </button>

      <button
        onClick={() => setActiveTab("rent")}
        className={`h-[52px] sm:h-[56px] lg:h-[60px] w-[130px] sm:w-[145px] text-[14px] font-normal transition-all border-t border-r ${
          activeTab === "rent"
            ? "bg-white text-[#00528f] border-[#e8e8e8]"
            : "bg-[rgba(0,0,0,0.58)] text-white border-[#d5d5d552]"
        }`}
        style={{
          fontFamily: "Montserrat, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {t("hero.tabRent")}
      </button>
    </div>

    <div className="rounded-b-[16px] rounded-tr-[16px] border border-[#e8e8e8] bg-white shadow-[0px_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col items-stretch gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:gap-5 lg:px-8 lg:py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("hero.locationLabel")}
          </p>

          <div ref={locationRef} className="relative w-full">
            <div className="flex h-[50px] lg:h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-4 lg:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-3 text-[#4a5565]">
                <LocationIcon />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLocationOpen(true);
                  }}
                  onFocus={() => setLocationOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder={t("hero.locationPlaceholder")}
                  className="w-full min-w-0 bg-transparent text-[14px] text-[#0d2138] placeholder:text-[#4a5565] outline-none"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  aria-label={t("hero.locationLabel")}
                />
              </div>
              <ChevronDown />
            </div>

            {locationOpen && suggestions.length > 0 ? (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 max-h-[280px] overflow-y-auto overscroll-contain rounded-[16px] border border-[#e2e5ea] bg-white py-1 shadow-lg">
                {suggestions.map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => {
                      setLocation(sugg);
                      setLocationOpen(false);
                    }}
                    className="w-full truncate px-4 py-2.5 text-left text-[14px] text-[#4a5565] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("hero.propertyTypeLabel")}
          </p>

          <HeroDropdown
            icon={<BuildingIcon />}
            options={propertyTypeOptions}
            selectedIndex={typeIndex}
            onSelect={setTypeIndex}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("hero.priceLabel")}
          </p>

          <HeroDropdown
            icon={<DollarIcon />}
            options={priceOptions}
            selectedIndex={priceIndex}
            onSelect={setPriceIndex}
          />
        </div>

        <button
          onClick={handleSearch}
          className="relative h-[50px] lg:h-[54px] flex-shrink-0 overflow-hidden whitespace-nowrap rounded-[48px] px-8 text-[15px] lg:text-[16px] font-medium text-white transition-opacity hover:opacity-90 lg:w-[212px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(to bottom, #005ea4, #006fc2)",
            border: "1px solid #0088ff",
          }}
        >
          <span
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "url('/assets/figma-temp/BlogPage/btn-img.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <span className="relative z-10">{t("hero.searchButton")}</span>
        </button>
      </div>
    </div>
  </div>
</div>
    </section>
  );
}
