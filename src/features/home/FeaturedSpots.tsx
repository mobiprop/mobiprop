"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import svgPaths from "@/assets/svg-6s7nojygyu";
import type { PublicFeaturedLocationDto } from "../listings/listing-actions";

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/pilar.webp";

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
  emphasize,
}: {
  spot: PublicFeaturedLocationDto;
  imgHeight: string;
  emphasize: boolean;
}) {
  return (
    <Link href={`/listings?location=${encodeURIComponent(spot.name)}`} className="flex flex-col gap-5 group">
      <div className={`${imgHeight} rounded-[24px] overflow-hidden bg-[#f3f4f6]`}>
        <img
          src={spot.coverImageUrl ?? fallbackImg}
          alt={spot.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#0d2138] leading-[24px] sm:leading-[26px] lg:leading-[28px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {spot.name}
          </p>
          <p
            className="mt-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {spot.activeListings} {spot.activeListings === 1 ? "listing" : "listings"}
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
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "featured-locations"],
    queryFn: async () => {
      const res = await fetch("/api/listings/featured-locations");
      if (!res.ok) throw new Error("Failed to fetch featured locations");
      return res.json();
    },
  });
  const spots: PublicFeaturedLocationDto[] = data?.locations ?? [];

  if (!isLoading && spots.length === 0) return null;

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
              Location
            </span>
          </div>
          <div className="text-center">
            <h2
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Featured Spots
            </h2>
            <p
              className="mt-3 text-[14px] sm:text-[16px] text-[#2b3038] max-w-[460px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Explore the areas with the most listings right now
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-5 animate-pulse">
                <div className="h-[300px] lg:h-[400px] rounded-[24px] bg-[#f3f4f6]" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-1/2 rounded bg-[#f3f4f6]" />
                  <div className="h-4 w-1/3 rounded bg-[#f3f4f6]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Top row: 2 large cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {spots.slice(0, 2).map((spot, i) => (
                <SpotCard key={spot.id} spot={spot} imgHeight="h-[300px] lg:h-[400px]" emphasize={i === 0} />
              ))}
            </div>

            {/* Bottom row: up to 3 smaller cards */}
            {spots.length > 2 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {spots.slice(2).map((spot) => (
                  <SpotCard key={spot.id} spot={spot} imgHeight="h-[240px]" emphasize={false} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
