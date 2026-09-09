"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import svgPaths from "@/assets/svg-6s7nojygyu";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import type { PublicListingDto } from "../types/listing-dto";
import { formatArea, formatBaths, formatBeds, listingDisplayPrice } from "../utils/format";

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/featurelisting1.webp";

export function MarkerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="#4F4F4F" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M16.25 7.5H12.5V3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M3.75 12.5H7.5V16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M12.5 16.25V12.5H16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M7.5 3.75V7.5H3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

export function BedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p48eb680} stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 16.25V3.75" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 13.125H19.375V16.25" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.75 6.25H1.875" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

export function BathIcon() {
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

export function ArrowUpRight({ color = "#005089" }: { color?: string }) {
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

/** "Venta", "Alquiler", or "Venta & Alquiler" for a dual sale-and-rent listing. */
export function operationBadge(property: PublicListingDto, t: (key: string) => string): string {
  if (property.operationType === "SALE_AND_RENT") {
    return `${t("card.sale")} & ${t("card.rent")}`;
  }
  return property.operationType === "RENT" ? t("card.rent") : t("card.sale");
}

/** Property card matching Figma's listing card (image carousel, navy operation
 * badge, gradient price, "Ver Propiedad" pill) — shared by the homepage's
 * featured listings and the /listings grid so both stay visually identical. */
export function PropertyCard({ property }: { property: PublicListingDto }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(property.listingId);
  const { t } = useTranslation("listings");

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
              className="bg-[#005089] px-3 py-1.5 rounded-full text-[13px] sm:text-[14px] text-white capitalize whitespace-nowrap"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {operationBadge(property, t)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(property.listingId, () => setLoginOpen(true));
            }}
            aria-label={saved ? t("card.removeSavedAriaLabel") : t("card.saveAriaLabel")}
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
              {t("card.viewProperty")}
              <ArrowUpRight />
            </span>
          </div>
        </div>
      </Link>
    </>
  );
}
