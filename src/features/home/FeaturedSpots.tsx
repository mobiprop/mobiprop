"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";

import svgPaths from "@/assets/svg-6s7nojygyu";

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
    title: "Altos del Pilar",
    category: "Barrio Privado",
    imageUrl: "/spots/altos-del-pilar.webp",
    searchLocation: "Altos del Pilar",
  },
  {
    title: "Pilar Lagoon",
    category: "Barrio Privado",
    imageUrl: "/spots/pilar-lagoon.webp",
    searchLocation: "Pilar Lagoon",
  },
  {
    title: "Ayres de Pilar",
    category: "Barrio Privado",
    imageUrl: "/spots/ayres-de-pilar.webp",
    searchLocation: "Ayres del Pilar",
  },
  {
    title: "Bouquet Pilar",
    category: "Condominio",
    imageUrl: "/spots/bouquet-pilar.webp",
    searchLocation: "Bouquet",
  },
  {
    title: "Vilahaus",
    category: "Condominio",
    imageUrl: "/spots/vilahaus.webp",
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
  widthClass,
  sizes,
  emphasize,
}: {
  spot: FeaturedSpot;
  imgHeight: string;
  widthClass: string;
  sizes: string;
  emphasize: boolean;
}) {
  return (
    <Link
      href={`/listings?location=${encodeURIComponent(spot.searchLocation)}`}
      className={`flex flex-col gap-5 group ${widthClass}`}
    >
      <div className={`hover-shine relative ${imgHeight} rounded-[20px] overflow-hidden bg-[#f3f4f6]`}>
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
            className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#232323] leading-[1.4]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {spot.title}
          </p>
          <p
            className="mt-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#4f4f4f]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {spot.category}
          </p>
        </div>

        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${
            emphasize ? "border-transparent" : "border-[#bbbbbb]"
          }`}
          style={
            emphasize
              ? { background: "linear-gradient(135deg, #005ea4 0%, #006fc2 100%)" }
              : undefined
          }
        >
          <ArrowUpRight color={emphasize ? "white" : "#0D2138"} />
        </div>
      </div>
    </Link>
  );
}

export function FeaturedSpots() {
  const { t } = useTranslation("home");
  const [spot1, spot2, spot3, spot4, spot5] = FEATURED_SPOTS;

  return (
    <section className="bg-white home-section">
      <div className="home-container flex flex-col items-center gap-10">
        <SectionHeading badge={t("featuredSpots.badge")} title={t("featuredSpots.title")} subtitle={t("featuredSpots.subtitle")} />

        {/* Bento grid: two uneven rows, matching the Figma layout */}
        <div className="flex flex-col gap-7 w-full">
          <div className="grid grid-cols-1 md:grid-cols-[755fr_533fr] gap-6">
            <SpotCard
              spot={spot1}
              imgHeight="h-[260px] lg:h-[315px]"
              widthClass="min-w-0"
              sizes="(min-width: 768px) 57vw, 100vw"
              emphasize
            />
            <SpotCard
              spot={spot2}
              imgHeight="h-[260px] lg:h-[315px]"
              widthClass="min-w-0"
              sizes="(min-width: 768px) 41vw, 100vw"
              emphasize={false}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[310fr_644fr_310fr] gap-6">
            <SpotCard
              spot={spot3}
              imgHeight="h-[220px] lg:h-[315px]"
              widthClass="min-w-0"
              sizes="(min-width: 1024px) 24vw, 100vw"
              emphasize={false}
            />
            <SpotCard
              spot={spot4}
              imgHeight="h-[220px] lg:h-[315px]"
              widthClass="min-w-0"
              sizes="(min-width: 1024px) 49vw, 100vw"
              emphasize={false}
            />
            <SpotCard
              spot={spot5}
              imgHeight="h-[220px] lg:h-[315px]"
              widthClass="min-w-0"
              sizes="(min-width: 1024px) 24vw, 100vw"
              emphasize={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
