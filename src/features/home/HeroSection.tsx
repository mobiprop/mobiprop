"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";

const heroImg = "/hero/hero-home.webp";

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.83333 13.8333C8.5 11.1667 11.1667 8.77885 11.1667 5.83333C11.1667 2.88781 8.77885 0.5 5.83333 0.5C2.88781 0.5 0.5 2.88781 0.5 5.83333C0.5 8.77885 3.16667 11.1667 5.83333 13.8333Z" stroke="#005089" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.83301 7.83331C6.93758 7.83331 7.83301 6.93788 7.83301 5.83331C7.83301 4.72874 6.93758 3.83331 5.83301 3.83331C4.72844 3.83331 3.83301 4.72874 3.83301 5.83331C3.83301 6.93788 4.72844 7.83331 5.83301 7.83331Z" stroke="#005089" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.83333 5.83333H11.0333C11.7801 5.83333 12.1534 5.83333 12.4387 5.97866C12.6895 6.10649 12.8935 6.31046 13.0213 6.56135C13.1667 6.84656 13.1667 7.21993 13.1667 7.96667V12.5M7.83333 12.5V2.63333C7.83333 1.8866 7.83333 1.51323 7.68801 1.22801C7.56018 0.97713 7.3562 0.773156 7.10532 0.645325C6.8201 0.500001 6.44674 0.500001 5.7 0.500001H3.3C2.55326 0.500001 2.17989 0.500001 1.89468 0.645325C1.6438 0.773156 1.43982 0.97713 1.31199 1.22801C1.16667 1.51323 1.16667 1.8866 1.16667 2.63333V12.5M13.8333 12.5H0.5M3.5 3.16667H5.5M3.5 5.83333H5.5M3.5 8.5H5.5" stroke="#005089" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path d="M2.5 9.83333C2.5 11.3061 3.69391 12.5 5.16667 12.5H7.83333C9.30609 12.5 10.5 11.3061 10.5 9.83333C10.5 8.36057 9.30609 7.16667 7.83333 7.16667H5.16667C3.69391 7.16667 2.5 5.97276 2.5 4.5C2.5 3.02724 3.69391 1.83333 5.16667 1.83333H7.83333C9.30609 1.83333 10.5 3.02724 10.5 4.5M6.5 0.5V13.8333" stroke="#005089" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
      <path d="M1 1L6 6L11 1" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="white" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
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

/** Field label + value button matching the Figma search bar fields. */
function SearchField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-1.5">
      <p
        className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.6px] text-[#4f4f4f]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {label}
      </p>
      <div className="flex h-[46px] items-center gap-2 rounded-xl border border-[#e9e9e9] bg-[#fafafa] px-3">
        {icon}
        {children}
        <ChevronDown />
      </div>
    </div>
  );
}

function FieldDropdown({
  options,
  selectedIndex,
  onSelect,
}: {
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
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-w-0 truncate text-left text-[14px] text-[#4f4f4f]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {options[selectedIndex]?.label}
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 max-h-[280px] w-[260px] overflow-y-auto overscroll-contain rounded-2xl border border-[#e9e9e9] bg-white py-1 shadow-lg">
          {options.map((opt, index) => (
            <button
              key={opt.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(index);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-[#f3f4f6] ${
                index === selectedIndex ? "font-medium text-[#005089]" : "text-[#4f4f4f]"
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

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

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
    <section
      ref={heroRef}
      className="w-[calc(100%-32px)] max-w-[1920px] mx-auto pt-4"
    >
      <div className="relative w-full overflow-hidden rounded-[20px]">
        <motion.img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ y: imgY, scale: 1.12 }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(5,22,44,0.054) 0%, rgba(5,22,44,0.036) 45%, rgba(81,81,81,0.071) 74.8%, rgba(102,102,102,0.071) 86.25%, rgba(248,250,252,0.046) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 54%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* min-h keeps the photo from collapsing before content loads; actual
           height is intrinsic (content + padding), never a fixed px, so it
           holds correct proportions continuously across every viewport width
           instead of only at hand-tuned breakpoints. */}
        <div
          className="relative z-10 flex min-h-[500px] flex-col pb-6"
          style={{ paddingInline: "var(--space-fluid-section-px)" }}
        >
          <div style={{ paddingTop: "var(--space-fluid-hero-pt)" }}>
            <motion.div
              className="flex max-w-[720px] flex-col gap-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-[#fafafa]" />
                <span
                  className="text-[12px] uppercase tracking-[1.2px] text-white"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
                >
                  {t("hero.badge")}
                </span>
              </div>

              <h1
                className="text-white"
                style={{
                  fontFamily: "Neue Haas Grotesk Display Pro, Poppins, sans-serif",
                  fontWeight: 400,
                  fontSize: "var(--text-fluid-h1)",
                  lineHeight: 1.25,
                }}
              >
                {t("hero.titlePrefix")}
                <span style={{ fontFamily: "'IvyPresto Display', Georgia, serif", fontStyle: "italic" }}>
                  {t("hero.titleAccent")}
                </span>
              </h1>

              <p
                className="max-w-[38ch] text-white/90"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "var(--text-fluid-subtitle)",
                  lineHeight: 1.45,
                }}
              >
                {t("hero.subtitle")}
              </p>
            </motion.div>
          </div>

          {/* Search bar */}
          <motion.div
            className="mt-10 w-full max-w-[1360px] sm:mt-14"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          >
            <div className="flex w-fit">
              {(["buy", "rent"] as const).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative h-12 px-7 text-[14px] font-medium capitalize tracking-[0.35px] transition-colors ${
                      active
                        ? "rounded-tl-xl bg-white text-[#005089] shadow-[0px_1px_1.5px_rgba(0,0,0,0.1)]"
                        : "rounded-tr-xl bg-white/10 text-white"
                    }`}
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {tab === "buy" ? t("hero.tabBuy") : t("hero.tabRent")}
                    {active && (
                      <span className="absolute bottom-[6px] left-1/2 h-0.5 w-[42px] -translate-x-1/2 rounded-full bg-[#005089]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 rounded-bl-2xl rounded-br-2xl rounded-tr-2xl bg-white p-5 shadow-[0px_25px_25px_rgba(0,0,0,0.06)] sm:p-6 xl:flex-row xl:items-end xl:gap-3">
              <SearchField label={t("hero.locationLabel")} icon={<PinIcon />}>
                <div ref={locationRef} className="relative min-w-0 flex-1">
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
                    className="w-full min-w-0 bg-transparent text-[14px] text-[#4f4f4f] placeholder:text-[#9a9a9a] outline-none"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    aria-label={t("hero.locationLabel")}
                  />
                  {locationOpen && suggestions.length > 0 ? (
                    <div className="absolute top-[calc(100%+8px)] left-0 z-50 max-h-[280px] w-[260px] overflow-y-auto overscroll-contain rounded-2xl border border-[#e9e9e9] bg-white py-1 shadow-lg">
                      {suggestions.map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => {
                            setLocation(sugg);
                            setLocationOpen(false);
                          }}
                          className="w-full truncate px-4 py-2.5 text-left text-[14px] text-[#4f4f4f] transition-colors hover:bg-[#f3f4f6]"
                          style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </SearchField>

              <div className="hidden h-[46px] w-px bg-[#e9e9e9] xl:block" />

              <SearchField label={t("hero.propertyTypeLabel")} icon={<BuildingIcon />}>
                <FieldDropdown options={propertyTypeOptions} selectedIndex={typeIndex} onSelect={setTypeIndex} />
              </SearchField>

              <div className="hidden h-[46px] w-px bg-[#e9e9e9] xl:block" />

              <SearchField label={t("hero.priceLabel")} icon={<DollarIcon />}>
                <FieldDropdown options={priceOptions} selectedIndex={priceIndex} onSelect={setPriceIndex} />
              </SearchField>

              <button
                onClick={handleSearch}
                className="flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-xl px-6 text-[14px] font-medium text-white sm:mb-0"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(167deg, #005ea4 0%, #006fc2 100%)",
                }}
              >
                <SearchIcon />
                {t("hero.searchButton")}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
