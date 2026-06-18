"use client";

import { useState } from "react";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import { ScheduleTourModal } from "./ScheduleTourModal";
import svgPaths from "./singleListingSvgPaths";
import type { PublicListingAgent } from "../listing-actions";
import type { PublicListingDto } from "../types/listing-dto";
import type { AmenityKey } from "@/schemas/listing.schema";
import { AMENITY_OPTIONS } from "@/schemas/listing.schema";
import {
  PROPERTY_TYPE_LABELS,
  formatRentPrice,
  formatSalePrice,
} from "../utils/format";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleListingPage/property-1.png";
const agentImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleListingPage/emily.png";
const footerBgImg =
  "/assets/figma-temp/SingleListingPage/3fba757107af3080a480784b8edf8f9a8a4c4646.png";

const amenityIcons: { key: AmenityKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "PARKING",
    label: "Parking",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p1d98b900}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p36e7a000}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 17H15"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p29835400}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "GARDEN",
    label: "Garden",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p360d1bb0}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M7.0002 16V22"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M13.0002 19V22"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p15de6d20}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "POOL",
    label: "Pool",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p23954e80}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p7d13a80}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p1597c000}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "GYM",
    label: "Gym",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p16cc3700}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p2165cae0}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p37d02340}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "BALCONY",
    label: "Balcony",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 9L12 3L6 9"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M12 3V17"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M4.9998 21H18.9998"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "ELEVATOR",
    label: "Elevator",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.4 14.4L9.6 9.6"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p3f75e300}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M21.5 21.5L20.1 20.1"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p39715080}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p3f4a1500}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "SECURITY",
    label: "Security",
    icon: (
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
        <path
          d={svgPaths.p2b59380}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "FURNISHED",
    label: "Furnished",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p10c26880}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.pbc36600}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M4.0002 18V20"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M19.9998 18V20"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M12 4.00005V13"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "PET_FRIENDLY",
    label: "Pet Friendly",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p3835b200}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p2f030500}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p2c5da200}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.pfabe780}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

// Icon catalog for the stats strip; values come from the listing at render time.
const statCatalog = [
  {
    label: "Type",
    value: "For Sale",
    icon: <img src="/assets/figma-temp/UserProfile/type.svg" alt="Type" width={29} height={29} />,
  },
  {
    label: "Price",
    value: "$12,500,000",
    icon: <img src="/assets/figma-temp/UserProfile/price.svg" alt="Price" width={32} height={22} />,
  },
  {
    label: "Beds",
    value: "5",
    icon: <img
  src="/assets/figma-temp/UserProfile/bed.svg"
  alt="Beds"
  width={32}
  height={24}
  style={{ maxWidth: "32px", height: "auto" }}
/>,
  },
  {
    label: "Baths",
    value: "6",
    icon: <img src="/assets/figma-temp/UserProfile/bath.svg" alt="Baths" width={32} height={27} />,
  },
  {
    label: "Size",
    value: "8,100 sq ft",
    icon: <img src="/assets/figma-temp/UserProfile/size.svg" alt="Size" width={28} height={24} />,
  },
  {
    label: "Parking",
    value: "3",
    icon: <img src="/assets/figma-temp/UserProfile/parking.svg" alt="Parking" width={32} height={25} />,
  },
  {
    label: "Lot Size",
    value: "1.1 acres",
    icon: <img src="/assets/figma-temp/UserProfile/lot-size.svg" alt="Lot Size" width={24} height={24} />,
  },
  {
    label: "Built in",
    value: "2021",
    icon: <img src="/assets/figma-temp/UserProfile/built.svg" alt="Built in" width={26} height={28} />,
  },
  {
    label: "Floors",
    value: "2 stories",
    icon: <img src="/assets/figma-temp/UserProfile/floor.svg" alt="Floors" width={24} height={28} />,
  },
  {
    label: "Property ID",
    value: "PHF-3128-RN",
    copy: true,
    icon: (
      <img
        src="/assets/figma-temp/UserProfile/property.svg"
        alt="Property ID"
        width={28}
        height={24}
      />
    ),
  },
];

const OPERATION_LABELS: Record<PublicListingDto["operationType"], string> = {
  SALE: "For Sale",
  RENT: "For Rent",
  SALE_AND_RENT: "For Sale & Rent",
};

function statIcon(label: string): React.ReactNode {
  return statCatalog.find((s) => s.label === label)?.icon ?? null;
}

function buildStats(listing: PublicListingDto) {
  const stats: { label: string; value: string; copy?: boolean; icon: React.ReactNode }[] = [];
  const push = (label: string, value: string, copy = false) =>
    stats.push({ label, value, copy, icon: statIcon(label) });

  push("Type", OPERATION_LABELS[listing.operationType]);
  if (listing.salePrice !== null) push("Price", formatSalePrice(listing.salePrice));
  else if (listing.rentPrice !== null) push("Price", formatRentPrice(listing.rentPrice));
  if (listing.bedrooms !== null) push("Beds", String(listing.bedrooms));
  if (listing.bathrooms !== null) push("Baths", String(listing.bathrooms));
  if (listing.areaSqft !== null) push("Size", `${listing.areaSqft.toLocaleString("en-US")} sq ft`);
  if (listing.parkingSpaces !== null) push("Parking", String(listing.parkingSpaces));
  if (listing.lotSizeSqft !== null)
    push("Lot Size", `${listing.lotSizeSqft.toLocaleString("en-US")} sq ft`);
  if (listing.yearBuilt !== null) push("Built in", String(listing.yearBuilt));
  if (listing.floors !== null)
    push("Floors", listing.floors === 1 ? "1 story" : `${listing.floors} stories`);
  push("Property ID", listing.listingId, true);
  return stats;
}

// Generic check icon for amenities without a bespoke Figma icon.
function AmenityCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#1E4F86" strokeWidth="1.5" />
      <path
        d="M8.5 12.2L11 14.7L15.5 9.8"
        stroke="#1E4F86"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Recognizes youtube.com/watch, youtu.be, /embed/, and /shorts/ links so we
// can derive a thumbnail (img.youtube.com) and an embeddable player URL
// without storing anything beyond the raw link the agent pastes in.
function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1] || null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/shorts/")[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoPreviewSection({ videoUrl, title }: { videoUrl: string | null; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;

  return (
    <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-8 sm:py-12 lg:py-16">
      <h2
        className="text-[#0d2138] mb-4 sm:mb-6 text-[22px] sm:text-[24px] leading-[28px]"
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 500,
          letterSpacing: "-0.24px",
        }}
      >
        Video Preview
      </h2>

      <div className="relative rounded-[14px] sm:rounded-[20px] overflow-hidden h-[300px] sm:h-[400px] md:h-[470px] lg:h-[536px] bg-[#0d2138]">
        {!videoUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M15 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.2M17 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M21 8l-4 3v2l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontFamily: "Montserrat, sans-serif" }} className="text-[14px] sm:text-[16px]">
              Preview Not Available
            </p>
          </div>
        ) : isPlaying ? (
          youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={`${title} — video preview`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Play video preview for ${title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1e4f86] to-[#0d2138]" />
            )}

            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />

            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FF0000] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 sm:size-20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="white" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SingleListingPageContent({
  listing,
  agent,
}: {
  listing: PublicListingDto;
  agent: PublicListingAgent | null;
}) {
  const [copied, setCopied] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(listing.listingId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = `${listing.title} — ${listing.location}`;
  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const images = listing.images;
  const mainImage = images.find((img) => img.isCover) ?? images[0] ?? null;
  const sideImages = images.filter((img) => img !== mainImage).slice(0, 3);

  const stats = buildStats(listing);
  const listingAmenities = listing.amenities.map((key) => ({
    key,
    label: AMENITY_OPTIONS.find((opt) => opt.key === key)?.label ?? key,
    icon: amenityIcons.find((item) => item.key === key)?.icon ?? <AmenityCheckIcon />,
  }));

  const badges = [
    OPERATION_LABELS[listing.operationType],
    PROPERTY_TYPE_LABELS[listing.type],
    ...(listing.yearBuilt !== null ? [String(listing.yearBuilt)] : []),
  ];

  return (
    <div className="w-full bg-white">
      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {/* Breadcrumb */}
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-5">
        <p
          className="text-[#0d2138]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.24px",
            lineHeight: "28px",
          }}
        >
          Property details
        </p>
      </div>

      {/* Photo Gallery */}
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Main Image */}
          <div className="relative w-full lg:flex-1 rounded-[14px] sm:rounded-[20px] overflow-hidden h-[280px] sm:h-[400px] lg:h-[536px]">
            <img
              src={mainImage?.url ?? fallbackImg}
              alt={mainImage?.altText ?? listing.title}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5">
              {badges.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/90 px-2.5 sm:px-3 py-1 rounded-[36px] text-[#0d2138] text-[11px] sm:text-[14px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Side Images */}
          {sideImages.length > 0 ? (
          <div className="grid grid-cols-3 lg:flex lg:flex-col gap-2 sm:gap-4 w-full lg:w-[342px] lg:shrink-0">
            {sideImages.map((img, i) => (
            <div
              key={img.id}
              className="relative rounded-[10px] sm:rounded-[12px] overflow-hidden h-[90px] sm:h-[130px] lg:h-[168px]"
            >
              <img
                src={img.url}
                alt={img.altText ?? `${listing.title} view ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {i === sideImages.length - 1 && images.length > sideImages.length + 1 ? (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white rounded-[50px] px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1">
                <span
                  className="text-[#232323] text-[10px] sm:text-[13px] lg:text-[14px] whitespace-nowrap"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  +{images.length - sideImages.length - 1} more
                </span>
              </div>
              ) : null}
            </div>
            ))}
          </div>
          ) : null}
        </div>

        {/* Property Info Row */}
        <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-8">
          {/* Title & Location */}
          <div className="flex flex-col gap-2 max-w-full md:max-w-[520px]">
            <h1
              className="text-[#232323] text-[22px] sm:text-[28px] lg:text-[32px] leading-[32px] sm:leading-[38px] lg:leading-[44px]"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 500,
                letterSpacing: "-0.32px",
              }}
            >
              {listing.title}
            </h1>

            <div
              className="flex items-start sm:items-center gap-2 text-[rgba(0,0,0,0.62)] text-[13px] sm:text-[15px] lg:text-[16px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg
                className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] shrink-0 mt-[2px] sm:mt-0"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d={svgPaths.p23b22400}
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
                <path
                  d="M9 6.75V12.375"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
                <path
                  d={svgPaths.p2e9ace80}
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
              </svg>

              <span className="leading-[20px]">
                {listing.fullAddress || listing.location}
              </span>
            </div>
          </div>

          {/* Prices */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 sm:gap-6 md:gap-2">
            {listing.salePrice !== null ? (
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1e4f86]" />
                <span
                  className="text-[#1e4f86] text-[14px] sm:text-[16px]"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Sale
                </span>
              </div>

              <span
                className="text-[#1e4f86] text-[20px] sm:text-[22px] lg:text-[24px]"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  letterSpacing: "-0.24px",
                }}
              >
                {formatSalePrice(listing.salePrice)}
              </span>
            </div>
            ) : null}

            {listing.rentPrice !== null ? (
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-[#4896b6]" />
                <span
                  className="text-[#4896b6] text-[14px] sm:text-[16px]"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Rent
                </span>
              </div>

              <span
                className="text-[#4896b6] text-[20px] sm:text-[22px] lg:text-[24px]"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  letterSpacing: "-0.24px",
                }}
              >
                {formatRentPrice(listing.rentPrice)}
              </span>
            </div>
            ) : null}
          </div>
        </div>

        {/* Share Bar */}
        {/* Share Bar */}
        <div className="mt-5 sm:mt-6 pb-6 border-b border-[#e5e7eb] flex flex-wrap items-center gap-3 sm:gap-4">
          <span
            className="text-[#2b3038] text-[14px] sm:text-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}
          >
            Share:
          </span>

          {/* Social Icons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Facebook */}
            <button
              onClick={() =>
                openShare(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                )
              }
              aria-label="Share on Facebook"
              className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 relative top-[2px]"
                fill="none"
              >
                <path
                  d="M13.6 22V13.4H16.5L17 10H13.6V7.8C13.6 6.8 13.9 6.1 15.3 6.1H17.1V3.1C16.8 3.1 15.7 3 14.5 3C11.9 3 10.1 4.6 10.1 7.5V10H7.2V13.4H10.1V22H13.6Z"
                  fill="white"
                />
              </svg>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() =>
                openShare(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                )
              }
              aria-label="Share on X"
              className="w-6 h-6 overflow-clip relative cursor-pointer shrink-0"
            >
              <svg viewBox="0 0 20 18" className="w-6 h-6">
                <path d={svgPaths.p7cd5f00} fill="#000000" />
              </svg>
            </button>

            {/* Instagram */}
            <button
              onClick={() => openShare("https://www.instagram.com/")}
              aria-label="Open Instagram"
              className="w-6 h-6 rounded-[6px] flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[30px] h-[30px]"
                fill="none"
              >
                <rect
                  x="5"
                  y="5"
                  width="14"
                  height="14"
                  rx="4"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3.2"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="16.6" cy="7.4" r="1.1" fill="white" />
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() =>
                openShare(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                )
              }
              aria-label="Share on LinkedIn"
              className="w-6 h-6 overflow-clip relative cursor-pointer rounded-[3px] shrink-0"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="absolute inset-0 w-full h-full"
              >
                <path
                  d={svgPaths.p25763d00}
                  fill="#0B65C2"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>

              <svg
                viewBox="0 0 14 14"
                fill="none"
                className="absolute inset-[20.83%] w-[58.34%] h-[58.34%]"
              >
                <path
                  d={svgPaths.p270e9700}
                  fill="white"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() =>
                openShare(
                  `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
                )
              }
              aria-label="Share on WhatsApp"
              className="w-8 h-8 relative cursor-pointer shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[30px] h-[30px]"
                fill="white"
              >
                <path d="M19.1 4.9A9.8 9.8 0 0 0 3.7 16.7L2.4 21.5l4.9-1.3A9.8 9.8 0 0 0 19.1 4.9Zm-7.1 14a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3a8 8 0 1 1 6.7 3.6Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1c-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.3-.3-.5-.4Z" />
              </svg>

              <svg
                viewBox="0 0 18.2089 18.1286"
                fill="none"
                className="absolute inset-[11.84%] w-[76.29%] h-[75.53%]"
              >
                <path d={svgPaths.p36a91e00} fill="url(#wa_grad)" />
                <defs>
                  <linearGradient
                    id="wa_grad"
                    x1="8.919"
                    x2="9.011"
                    y1="1.088"
                    y2="16.58"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#57D163" />
                    <stop offset="1" stopColor="#23B33A" />
                  </linearGradient>
                </defs>
              </svg>

              <svg
                viewBox="0 0 11.1241 10.271"
                fill="none"
                className="absolute w-[46.35%] h-[42.79%]"
                style={{ inset: "28.61% 26.65% 28.59% 27%" }}
              >
                <path
                  d={svgPaths.p3bc74772}
                  fill="white"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[32px] border border-[#d1d5dc] text-[#2b3038] text-[13px] sm:text-[14px] hover:bg-gray-50 transition-colors shrink-0"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14.2581 14.2447"
              fill="none"
            >
              <path
                d={svgPaths.p3d13b600}
                stroke="#2B3038"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>

          {/* Save button */}
          <button
            onClick={() => toggleSave(listing.listingId, () => setLoginOpen(true))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-4xl border text-[13px] sm:text-[14px] transition-colors shrink-0 ${
              saved
                ? "border-[#e74c3c] text-[#e74c3c] bg-[#fff5f5] hover:bg-[#ffe8e8]"
                : "border-[#d1d5dc] text-[#2b3038] hover:bg-gray-50"
            }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
            aria-label={saved ? "Remove from saved" : "Save property"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill={saved ? "#e74c3c" : "none"}>
              <path
                d="M13.6 2.9a3.8 3.8 0 0 0-5.38 0L8 3.12l-.22-.22a3.8 3.8 0 0 0-5.38 5.38L8 13.87l5.6-5.59a3.8 3.8 0 0 0 0-5.38Z"
                stroke={saved ? "#e74c3c" : "#6A7282"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Description */}

      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-6 sm:py-8">
        <h2
          className="text-[#0d2138] mb-4 sm:mb-6 text-[22px] sm:text-[24px] leading-[28px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.24px",
          }}
        >
          Description
        </h2>

        <p
          className="text-[#0d2138] text-[14px] sm:text-[15px] md:text-[16px] mb-4 leading-[22px] sm:leading-[24px] whitespace-pre-line"
          style={{
            fontFamily: "Montserrat, sans-serif",
            letterSpacing: "-0.16px",
          }}
        >
          {listing.description}
        </p>
      </div>

      {/* Property Details Stats heading */}
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto pt-3 sm:pt-4">
        <h2
          className="text-[#0d2138] mb-4 sm:mb-6 text-[22px] sm:text-[24px] leading-[28px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.24px",
          }}
        >
          Property details
        </h2>
      </div>
      {/* Property Details Stats */}
      <div className="bg-[#F8FAFC] ">
        <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-4">
          <div className="bg-[#f8fafc] rounded-[4px] px-0 py-[28px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-[30px]">
              {stats.map((stat, i) => (
                <div key={stat.label} className="relative min-h-[78px] px-0">
                  <div className="flex flex-col items-start text-left lg:gap-1">
                    <div className="mb-[10px] flex h-[22px] w-[22px] items-center justify-center text-[#0f1f35] [&>svg]:h-[22px] [&>svg]:w-[22px] [&>svg]:stroke-[1.8]">
                      {stat.icon}
                    </div>

                    <p
                      className="text-[#2b3038] text-[14px] sm:text-[18px] leading-[18px]"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 500,
                        letterSpacing: "-0.18px",
                      }}
                    >
                      {stat.label}
                    </p>

                    <p
                      className="mt-[3px] flex items-center gap-[4px] text-[#2b3038]/60 text-[12px] sm:text-[16px] leading-[18px]"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 400,
                      }}
                    >
                      {stat.value}

                      {stat.copy && (
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(stat.value)
                          }
                          className="inline-flex h-[12px] w-[12px] items-center justify-center text-[#0D2138]"
                          aria-label="Copy property ID"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="11"
                              height="11"
                              rx="1.5"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M5 15H4.5C3.67 15 3 14.33 3 13.5V4.5C3 3.67 3.67 3 4.5 3H13.5C14.33 3 15 3.67 15 4.5V5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </p>
                  </div>  

                  {/* Desktop separator */}
                  {i % 6 !== 5 && i !== stats.length - 1 && (
                    <span className="hidden lg:block absolute left-[60%] top-1/2 h-[78px] w-px -translate-y-1/2 bg-[#e5e7eb]" />
                  )}

                  {/* Tablet separator */}
                  {(i + 1) % 3 !== 0 && (
                    <span className="hidden sm:block lg:hidden absolute left-[60%] top-1/2 h-[78px] w-px -translate-y-1/2 bg-[#e5e7eb]" />
                  )}

                  {/* Mobile separator */}
                  {(i + 1) % 2 !== 0 && (
                    <span className="block sm:hidden absolute left-[60%] top-1/2 h-[78px] w-px -translate-y-1/2 bg-[#e5e7eb]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features & Amenities */}
      {listingAmenities.length > 0 ? (
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-8 sm:py-12 lg:py-16">
        <h2
          className="text-[#0d2138] mb-4 sm:mb-6 text-[22px] sm:text-[24px] leading-[28px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.24px",
          }}
        >
          Features & Amenities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {listingAmenities.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-[#e5e7eb] rounded-[10px] sm:rounded-[12px] flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 min-h-[48px] sm:min-h-[50px]"
            >
              <div className="shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[20px] sm:[&>svg]:h-[20px]">
                {item.icon}
              </div>

              <span
                className="text-[#2b3038] text-[15px] sm:text-[16px] lg:text-[18px] leading-[20px] sm:leading-[22px]"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 500,
                  letterSpacing: "-0.18px",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {/* Video Preview — always shown; falls back to "Preview Not Available"
          when the listing has no video set. */}
      <VideoPreviewSection videoUrl={listing.videoUrl} title={listing.title} />

      {/* On the Map — hidden until the listing has geocoded coordinates */}
      {listing.latitude !== null && listing.longitude !== null ? (
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto py-6 sm:py-8">
  <h2
    className="text-[#0d2138] mb-4 sm:mb-6 text-[22px] sm:text-[24px] leading-[28px]"
    style={{
      fontFamily: "Poppins, sans-serif",
      fontWeight: 500,
      letterSpacing: "-0.24px",
    }}
  >
    On the Map
  </h2>

  <div className="relative rounded-[14px] sm:rounded-[20px] overflow-hidden h-[300px] sm:h-[400px] md:h-[470px] lg:h-[536px]">
    <PropertyLocationMap
      latitude={listing.latitude}
      longitude={listing.longitude}
      title={listing.title}
    />

    {/* Location Card */}
    <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-[290px] max-w-[calc(100%-24px)] rounded-[14px] bg-white px-4 py-3.5 shadow-sm">
  {/* Location Name */}
  <p
    className="mb-2 truncate text-[16px] leading-[22px] text-[#232323]"
    style={{
      fontFamily: "Montserrat, sans-serif",
      fontWeight: 500,
      letterSpacing: "-0.16px",
    }}
  >
    {listing.location}
  </p>

  {/* Full Address */}
  <p
    className="mb-3 truncate text-[14px] leading-[20px] text-[#6B6B6B]"
    style={{
      fontFamily: "Poppins, sans-serif",
      fontWeight: 400,
      letterSpacing: "-0.14px",
    }}
  >
    {listing.fullAddress}
  </p>

  {/* Rating and Reviews */}
  <div className="flex items-center gap-2 whitespace-nowrap">
    <span
      className="text-[16px] font-medium text-[#232323]"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      5.0
    </span>

    <div className="flex items-center gap-[2px] text-[19px] leading-none text-[#F5A000]">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>★</span>
      ))}
    </div>

    <span
      className="text-[14px] text-[#369BCB]"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {(6546).toLocaleString()} reviews
    </span>
  </div>
</div>
  </div>
</div>
      ) : null}

      {/* Agent Contact Banner */}
      <div className="w-[calc(100%-38px)] max-w-[1196px] mx-auto py-8 sm:py-12 lg:py-16">
  <div className="bg-[#112b4a] rounded-[22px] sm:rounded-[28px] lg:rounded-[36px] relative overflow-hidden min-h-[auto] lg:min-h-[320px]">
    {/* Background image */}
    <div className="absolute inset-0">
      <img
        src={footerBgImg}
        alt=""
        className="w-full h-full object-cover opacity-10"
      />
    </div>

    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-stretch gap-7 lg:gap-8 p-5 sm:p-8 lg:p-16">
      {agent ? (
      <>
      {/* Left: Agent */}
      <div className="flex flex-col items-start gap-4 sm:gap-5 lg:w-[280px]">
        <div className="rounded-full overflow-hidden w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] shrink-0">
          <img
            src={agent.avatarUrl ?? agentImg}
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <p
            className="text-white text-[20px] sm:text-[24px] mb-1 leading-[28px] sm:leading-[32px]"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.24px",
            }}
          >
            {agent.name}
          </p>

          <p
            className="text-white text-[14px] sm:text-[16px] opacity-80"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Listing Agent
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-[#2B3038] self-stretch" />

      {/* Mobile Divider */}
      <div className="block lg:hidden w-full  bg-white/15" />
      </>
      ) : null}

      {/* Middle: CTA text */}
      <div className="flex flex-col gap-3 sm:gap-4 flex-1">
        <h2
          className="text-white text-[26px] sm:text-[30px] lg:text-[36px] leading-[34px] sm:leading-[40px] lg:leading-[48px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            letterSpacing: "-0.36px",
          }}
        >
          Ready to see this property
        </h2>

        <p
          className="text-white text-[14px] sm:text-[16px] opacity-80 leading-[22px] sm:leading-[24px]"
          style={{
            fontFamily: "Montserrat, sans-serif",
            letterSpacing: "-0.16px",
          }}
        >
          Book a private tour or send a message directly to{" "}
          {agent ? agent.name.split(" ")[0] : "our team"}.
          <br className="hidden sm:block" />
          No commitment needed
        </p>
      </div>

      {/* Right: Buttons */}
      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:gap-5 w-full lg:w-[257px] justify-center">
        <button
          onClick={() => setTourModalOpen(true)}
          className="w-full rounded-[48px] px-6 sm:px-8 py-3.5 sm:py-4 text-white text-[14px] sm:text-[16px] transition-opacity hover:opacity-90"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(to bottom, #005ea4, #006fc2)",
            border: "1px solid #0088ff",
          }}
        >
          Schedule a Visit
        </button>

        <button
          className="w-full rounded-[48px] px-6 sm:px-8 py-3.5 sm:py-4 text-white text-[14px] sm:text-[16px] border border-[#b9c8d9] hover:bg-white/10 transition-colors"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Send Inquiry
        </button>
      </div>
    </div>
  </div>
</div>

      {/* Footer spacer */}
      <div className="h-8" />

      {/* Tour request modal */}
      {tourModalOpen && (
        <ScheduleTourModal
          propertyId={listing.id}
          propertyTitle={listing.title}
          onClose={() => setTourModalOpen(false)}
        />
      )}
    </div>
  );
}
