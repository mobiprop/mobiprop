"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";
import svgPaths from "@/assets/svg-6s7nojygyu";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";
import {
  formatArea,
  formatBaths,
  formatBeds,
  listingDisplayPrice,
} from "@/features/listings/utils/format";

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/featurelisting1.webp";

function MarkerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M16.25 7.5H12.5V3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M3.75 12.5H7.5V16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M12.5 16.25V12.5H16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M7.5 3.75V7.5H3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p48eb680} stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 16.25V3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 13.125H19.375V16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.75 6.25H1.875" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M5.625 15V16.875" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M14.375 15V16.875" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p376e01f0} stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p3f8783b0} stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p35ecd900} stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function ArrowUpRight({ color = "#005089" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M15.6252 4.99915V13.1242C15.6252 13.2899 15.5593 13.4489 15.4421 13.5661C15.3249 13.6833 15.1659 13.7492 15.0002 13.7492C14.8344 13.7492 14.6755 13.6833 14.5582 13.5661C14.441 13.4489 14.3752 13.2899 14.3752 13.1242V6.50775L5.44237 15.4413C5.3251 15.5586 5.16604 15.6245 5.00018 15.6245C4.83433 15.6245 4.67527 15.5586 4.558 15.4413C4.44072 15.3241 4.37484 15.165 4.37484 14.9992C4.37484 14.8333 4.44072 14.6742 4.558 14.557L13.4916 5.62415H6.87518C6.70942 5.62415 6.55045 5.55831 6.43324 5.4411C6.31603 5.32389 6.25018 5.16491 6.25018 4.99915C6.25018 4.83339 6.31603 4.67442 6.43324 4.55721C6.55045 4.44 6.70942 4.37415 6.87518 4.37415H15.0002C15.1659 4.37415 15.3249 4.44 15.4421 4.55721C15.5593 4.67442 15.6252 4.83339 15.6252 4.99915Z"
        fill={color}
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <path d="M7.5 4.5L13 10L7.5 15.5" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageCarousel({ property }: { property: PublicListingDto }) {
  const images = useMemo(() => {
    const sorted = [...property.images].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.length > 0
      ? sorted
      : [{ id: "fallback", url: property.coverImageUrl ?? fallbackImg, sortOrder: 0, isCover: true, altText: null }];
  }, [property.images, property.coverImageUrl]);
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];

  function go(e: React.MouseEvent, delta: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="hover-shine relative h-[230px] sm:h-[250px] lg:h-[280px] w-full overflow-hidden">
      <Image
        src={active.url}
        alt={active.altText ?? property.title}
        fill
        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {images.length > 1 && (
        <>
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => go(e, -1)}
              aria-label="Previous photo"
              className="size-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={(e) => go(e, 1)}
              aria-label="Next photo"
              className="size-8 rounded-full bg-white/90 flex items-center justify-center shadow-md"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((img, i) => (
              <span
                key={img.id}
                className={`h-1 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: PublicListingDto }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(property.listingId);
  const { t } = useTranslation("home");

  return (
    <>
      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Link
        href={`/listings/${property.slug}`}
        className="flex w-full min-w-0 flex-col rounded-[16px] border border-[#e9e9e9] bg-white overflow-hidden group"
      >
        <div className="relative">
          <ImageCarousel property={property} />

          <div className="absolute top-[19px] left-[19px]">
            <span
              className="bg-[#005089] px-3 py-1.5 rounded-full text-[13px] sm:text-[14px] text-white capitalize"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {property.operationType === "RENT" ? t("hero.tabRent") : t("hero.tabBuy")}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(property.listingId, () => setLoginOpen(true));
            }}
            aria-label={saved ? "Remove from saved" : "Save property"}
            className="absolute top-[19px] right-[19px] bg-white rounded-full size-8 flex items-center justify-center shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill={saved ? "#e74c3c" : "none"}>
              <path
                d={svgPaths.p2a65c600}
                stroke={saved ? "#e74c3c" : "#9A9A9A"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-col gap-5 px-[19px] pt-5 pb-[19px]">
          <div className="flex min-w-0 flex-col gap-3">
            <span
              className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#00223a] tracking-[-0.5px] truncate"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {property.title}
            </span>

            <div className="flex min-w-0 items-center gap-1.5">
              <MarkerIcon />
              <span
                className="text-[15px] sm:text-[16px] text-[#4f4f4f] truncate"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {property.location}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="h-px w-full bg-[#e9e9e9]" />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <BedIcon />
                <span className="text-[14px] sm:text-[15px] text-[#191919]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {formatBeds(property.bedrooms, t)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <BathIcon />
                <span className="text-[14px] sm:text-[15px] text-[#191919]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {formatBaths(property.bathrooms, t)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AreaIcon />
                <span className="text-[14px] sm:text-[15px] text-[#191919]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {formatArea(property.totalAreaM2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span
              className="bg-clip-text text-transparent text-[19px] sm:text-[20px] lg:text-[22px] font-semibold whitespace-nowrap"
              style={{
                fontFamily: "Poppins, sans-serif",
                backgroundImage: "linear-gradient(164deg, #005ea4 0%, #006fc2 100%)",
              }}
            >
              {listingDisplayPrice(property, t)}
            </span>

            <span className="flex items-center gap-1 rounded-[13px] border border-[#ccdeef] bg-[#f0f6fa] pl-3.5 pr-3 py-2.5 text-[14px] sm:text-[15px] text-[#005089] whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("featuredListings.viewProperty")}
              <ArrowUpRight />
            </span>
          </div>
        </div>
      </Link>
    </>
  );
}

export function FeaturedListings() {
  const { t } = useTranslation("home");

  // All ACTIVE listings come back featured-first, newest-first; the homepage
  // shows the top 6 regardless of sale/rent — the Figma redesign dropped the
  // inline tab filter in favor of the "View All Listings" CTA to /listings,
  // which has the real filtering UI.
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "home-featured"],
    queryFn: async () => {
      const res = await fetch("/api/listings");
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
  });
  const allListings: PublicListingDto[] = data?.listings ?? [];
  const properties = allListings.slice(0, 6);

  if (!isLoading && allListings.length === 0) return null;

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <Reveal className="flex flex-col items-center gap-5" amount={0.4}>
          <div className="flex items-center gap-3 w-full max-w-[380px]">
            <div className="h-px flex-1 bg-[#e2e5ea]" />
            <span
              className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("featuredListings.badge")}
            </span>
            <div className="h-px flex-1 bg-[#e2e5ea]" />
          </div>

          <div className="text-center max-w-[573px]">
            <SplitHeading
              as="h2"
              text={t("featuredListings.title")}
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            <p
              className="mt-3 text-[14px] sm:text-[16px] text-[#4f4f4f]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("featuredListings.subtitle")}
            </p>
          </div>
        </Reveal>

        {/* Grid */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex w-full flex-col gap-4 animate-pulse">
                  <div className="h-[230px] sm:h-[250px] lg:h-[280px] w-full rounded-[16px] bg-[#eef1f5]" />
                  <div className="h-5 w-2/3 rounded bg-[#eef1f5]" />
                  <div className="h-4 w-1/2 rounded bg-[#eef1f5]" />
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <Reveal
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              stagger={0.12}
              amount={0.15}
            >
              {properties.map((p) => (
                <RevealItem key={p.slug}>
                  <PropertyCard property={p} />
                </RevealItem>
              ))}
            </Reveal>
          ) : (
            <p
              className="text-center text-[15px] text-[#6a7282] py-8"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("featuredListings.noneAvailable")}
            </p>
          )}
        </div>

        {!isLoading && properties.length > 0 && (
          <Link
            href="/listings"
            className="flex h-12 items-center justify-center rounded-[13px] px-7 text-[16px] font-medium text-white"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: "linear-gradient(165deg, #005ea4 0%, #006fc2 100%)",
            }}
          >
            {t("featuredListings.viewAll")}
          </Link>
        )}
      </div>
    </section>
  );
}
