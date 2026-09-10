"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useHomeListings } from "./useHomeListings";
import { ListingsMap } from "./ListingsMap";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import { AreaIcon, BathIcon, BedIcon, MarkerIcon, ArrowUpRight, operationBadge } from "@/features/listings/components/PropertyCard";
import { formatArea, formatBaths, formatBeds, listingDisplayPrice } from "@/features/listings/utils/format";

const FILTERS = [
  ["", "all"], ["HOUSE", "house"], ["APARTMENT", "apartment"],
  ["COMMERCIAL_OFFICE", "commercialOffice"], ["LOT", "lot"],
] as const;

export function ListingsExplorer() {
  const { t } = useTranslation("home");
  const { t: listingT } = useTranslation("listings");
  const query = useHomeListings();
  const [type, setType] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isSaved, toggleSave } = useSavedListings();
  const listings = useMemo(() => (query.data?.listings ?? []).filter((item) => !type || item.type === type), [query.data, type]);
  const selected = listings.find((item) => item.id === selectedId) ?? listings[0];
  // Show four cards as in Figma, bringing a selected map result into the list.
  const visible = listings.slice(0, 4);
  if (selected && !visible.some((item) => item.id === selected.id)) visible[3] = selected;

  return (
    <section className="home-section bg-white" aria-label={t("explorer.title")}>
      <div className="home-container flex flex-col items-center gap-10">
        <SectionHeading badge={t("explorer.badge")} title={t("explorer.title")} subtitle={t("explorer.subtitle")} />
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={t("hero.propertyTypeLabel")}>
          {FILTERS.map(([value, key]) => (
            <button key={key} type="button" aria-pressed={type === value}
              onClick={() => { setType(value); setSelectedId(null); }}
              className={`home-filter ${type === value ? "home-filter-active" : ""}`}>
              {key === "all" ? t("featuredSpots.filters.all") : t(`hero.propertyTypeOptions.${key}`)}
            </button>
          ))}
        </div>
        {query.isLoading ? (
          <div className="home-explorer-grid w-full" role="status" aria-label={t("explorer.loading")}>
            <div className="flex flex-col gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 rounded-2xl bg-[#f0f6fa] animate-pulse" />)}</div>
            <div className="min-h-80 rounded-[20px] bg-[#f0f6fa] animate-pulse" />
          </div>
        ) : query.isError ? (
          <div className="home-empty" role="status"><p>{t("explorer.error")}</p><button className="home-button mt-5" type="button" onClick={() => query.refetch()}>{t("explorer.retry")}</button></div>
        ) : listings.length === 0 ? (
          <div className="home-empty" role="status"><p>{t("explorer.empty")}</p>{type && <button type="button" className="home-button mt-5" onClick={() => setType("")}>{t("explorer.reset")}</button>}</div>
        ) : (
          <div className="home-explorer-grid w-full">
            <div className="flex min-w-0 flex-col gap-4" aria-live="polite">
              <p className="sr-only">{t("explorer.results", { count: listings.length })}</p>
              {visible.map((property) => (
                <article key={property.id} className={`home-listing-row ${selected?.id === property.id ? "is-selected" : ""}`}>
                  <Link className="home-listing-photo" href={`/listings/${property.slug}`}>
                    {(property.coverImageUrl || property.images[0]?.url) ? <Image src={property.coverImageUrl || property.images[0].url} alt={property.title} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 100vw" className="object-cover" /> : <span className="flex h-full items-center justify-center p-4 text-sm text-[#4f4f4f]">{t("explorer.noPhoto")}</span>}
                    <span className="absolute left-3 top-3 rounded-full bg-[#005089] px-2.5 py-1 text-xs text-white">{operationBadge(property, listingT)}</span>
                  </Link>
                  <div className="home-listing-details">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/listings/${property.slug}`} className="min-w-0">
                        <p className="text-xl font-semibold text-[#0064af]">{listingDisplayPrice(property, listingT)}</p>
                        <h3 className="mt-1 truncate text-sm text-[#4f4f4f]">{property.title}</h3>
                      </Link>
                      <button type="button" aria-pressed={isSaved(property.listingId)} aria-label={isSaved(property.listingId) ? listingT("card.removeSavedAriaLabel") : listingT("card.saveAriaLabel")}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e9e9e9]"
                        onClick={() => toggleSave(property.listingId, () => setLoginOpen(true))}>
                        <Heart size={16} strokeWidth={1.25} className={isSaved(property.listingId) ? "fill-red-500 text-red-500" : "text-[#9a9a9a]"} />
                      </button>
                    </div>
                    <button type="button" className="mt-3 flex min-w-0 items-center gap-1.5 text-left text-sm text-[#4f4f4f]" onClick={() => setSelectedId(property.id)} aria-pressed={selected?.id === property.id} aria-label={t("explorer.showOnMap", { title: property.title })}>
                      <MarkerIcon /><span className="truncate underline-offset-4 hover:underline">{property.location}</span>
                    </button>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#e9e9e9] pt-3 text-xs text-[#191919]">
                      <span className="flex items-center gap-1"><BedIcon />{formatBeds(property.bedrooms, listingT)}</span>
                      <span className="flex items-center gap-1"><BathIcon />{formatBaths(property.bathrooms, listingT)}</span>
                      <span className="flex items-center gap-1"><AreaIcon />{formatArea(property.totalAreaM2)}</span>
                      <Link href={`/listings/${property.slug}`} className="ml-auto flex size-8 items-center justify-center rounded-full hover:bg-[#f0f6fa]" aria-label={`${listingT("card.viewProperty")}: ${property.title}`}><ArrowUpRight /></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <ListingsMap listings={listings} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
          </div>
        )}
        <Link className="home-button" href={type ? `/listings?propertyType=${encodeURIComponent(type)}` : "/listings"}>{t("explorer.viewAll")}</Link>
      </div>
      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}
