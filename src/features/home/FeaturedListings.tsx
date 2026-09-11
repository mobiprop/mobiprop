"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";
import { useHomeListings } from "./useHomeListings";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { PropertyCard } from "@/features/listings/components/PropertyCard";

export function FeaturedListings() {
  const { t } = useTranslation("home");

  const { data, isLoading, isError, refetch } = useHomeListings(true);
  const properties = (data?.listings ?? []).filter((property) => property.isFeatured).slice(0, 6);

  return (
    <section className="bg-white home-section">
      <div className="property-section-container flex flex-col items-center gap-10">
        <SectionHeading badge={t("featuredListings.badge")} title={t("featuredListings.title")} subtitle={t("featuredListings.subtitle")} />

        {/* Grid */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex w-full flex-col gap-4 animate-pulse">
                  <div className="aspect-[421/280] w-full rounded-[16px] bg-[#eef1f5]" />
                  <div className="h-5 w-2/3 rounded bg-[#eef1f5]" />
                  <div className="h-4 w-1/2 rounded bg-[#eef1f5]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="home-empty" role="status"><p>{t("explorer.error")}</p><button type="button" className="home-button mt-5" onClick={() => refetch()}>{t("explorer.retry")}</button></div>
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
