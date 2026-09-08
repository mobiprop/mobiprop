"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";
import { PropertyCard } from "@/features/listings/components/PropertyCard";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";

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
