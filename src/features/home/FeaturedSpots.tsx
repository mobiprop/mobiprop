"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import svgPaths from "@/assets/svg-6s7nojygyu";

const ASSET_BASE =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal";

// Static per the client's latest Figma — was DB-driven ("most active listings
// per location") until they asked for these exact 5 spots, in this order,
// regardless of live inventory. `searchLocation` is the Listings page's
// `?location=` value, which does a case-insensitive `contains` match against
// each property's location string, so it must match the real DB value
// (confirmed against production data), not necessarily this card's display title.
type FeaturedSpot = {
  title: string;
  category: string;
  imageUrl: string;
  searchLocation: string;
};

const FEATURED_SPOTS: FeaturedSpot[] = [
  {
    title: "Martindale",
    category: "Country Club",
    imageUrl: `${ASSET_BASE}/featured-martindale.webp`,
    searchLocation: "Martindale",
  },
  {
    title: "Altos del Pilar",
    category: "Barrio Privado",
    imageUrl: `${ASSET_BASE}/featured-altos-del-pilar.webp`,
    searchLocation: "Altos del Pilar",
  },
  {
    title: "Ayres de Pilar",
    category: "Barrio Privado",
    imageUrl: `${ASSET_BASE}/featured-ayres-de-pilar.webp`,
    searchLocation: "Ayres del Pilar",
  },
  {
    title: "Bouquet Pilar",
    category: "Condominio",
    imageUrl: `${ASSET_BASE}/featured-bouquet-pilar.webp`,
    searchLocation: "Bouquet",
  },
  {
    title: "Vilahaus",
    category: "Condominio",
    imageUrl: `${ASSET_BASE}/featured-vilahaus.webp`,
    searchLocation: "Vila Haus",
  },
];

function ArrowUpRight({ color = "#0D2138" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22.5352 22.5352" fill="none">
      <path d={svgPaths.p34775480} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.87793" />
      <path d={svgPaths.pc406604} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.87793" />
    </svg>
  );
}

function SpotCard({
  spot,
  imgHeight,
  sizes,
  emphasize,
}: {
  spot: FeaturedSpot;
  imgHeight: string;
  sizes: string;
  emphasize: boolean;
}) {
  return (
    <Link
      href={`/listings?location=${encodeURIComponent(spot.searchLocation)}`}
      className="flex flex-col gap-5 group"
    >
      <div className={`relative ${imgHeight} rounded-[24px] overflow-hidden bg-[#f3f4f6]`}>
        <Image
          src={spot.imageUrl}
          alt={spot.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#0d2138] leading-[24px] sm:leading-[26px] lg:leading-[28px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {spot.title}
          </p>
          <p
            className="mt-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {spot.category}
          </p>
        </div>

        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-[#d1d5dc] ${
            emphasize ? "bg-[#1e4f86]" : "bg-[#f8fafc]"
          }`}
        >
          <ArrowUpRight color={emphasize ? "white" : "#0D2138"} />
        </div>
      </div>
    </Link>
  );
}

export function FeaturedSpots() {
  const { t } = useTranslation("home");
  const [topRow, bottomRow] = [FEATURED_SPOTS.slice(0, 2), FEATURED_SPOTS.slice(2)];

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-35px)] max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("featuredSpots.badge")}
            </span>
          </div>
          <div className="text-center">
            <h2
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("featuredSpots.title")}
            </h2>
            <p
              className="mt-3 text-[14px] sm:text-[16px] text-[#2b3038] max-w-[460px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("featuredSpots.subtitle")}
            </p>
          </div>
        </div>

        {/* Top row: 2 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {topRow.map((spot, i) => (
            <SpotCard
              key={spot.title}
              spot={spot}
              imgHeight="h-[300px] lg:h-[400px]"
              sizes="(min-width: 768px) 50vw, 100vw"
              emphasize={i === 0}
            />
          ))}
        </div>

        {/* Bottom row: 3 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bottomRow.map((spot) => (
            <SpotCard
              key={spot.title}
              spot={spot}
              imgHeight="h-[240px]"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              emphasize={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
