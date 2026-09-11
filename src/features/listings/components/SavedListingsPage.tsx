"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryKeys } from "@/lib/query-keys";
import Link from "next/link";
import type { Currency } from "@/generated/prisma/enums";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";

type SavedListing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  operationType: string;
  salePrice: number | null;
  rentPrice: number | null;
  saleCurrency: Currency;
  rentCurrency: Currency;
  bedrooms: number | null;
  bathrooms: number | null;
  totalAreaM2: number | null;
  coverImageUrl: string | null;
  savedAt: string;
};

function SavedCard({ listing, onRemove }: { listing: SavedListing; onRemove: (id: string) => void }) {
  return <PropertyCard property={{ ...listing, listingId: listing.id, operationType: listing.operationType as PropertyCardData["operationType"] }} savedOverride onToggleSaved={() => onRemove(listing.id)} />;
}

export function SavedListingsPageContent({ initialListings }: { initialListings: SavedListing[] }) {
  const { t } = useTranslation("savedListings");
  const queryClient = useQueryClient();
  const queryKey = queryKeys.savedListingsPage();

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/saved-listings/list");
      if (!res.ok) return { listings: [] as SavedListing[] };
      return res.json() as Promise<{ listings: SavedListing[] }>;
    },
    initialData: { listings: initialListings },
    staleTime: 2 * 60 * 1000,
  });
  const listings = data.listings;

  const removeMutation = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/saved-listings/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("No se pudo quitar la propiedad de favoritos."); },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ listings: SavedListing[] }>(queryKey);
      queryClient.setQueryData<{ listings: SavedListing[] }>(queryKey, (old) => ({
        listings: (old?.listings ?? []).filter((l: SavedListing) => l.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const handleRemove = (id: string) => removeMutation.mutate(id);

  return (
    <div
      className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto py-10 sm:py-14"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-semibold text-[#0d2138] leading-tight"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t("header.title")}
        </h1>
        <p className="mt-1 text-[14px] text-[#6a7282]">
          {listings.length === 0
            ? t("header.noneYet")
            : t("header.count", { count: listings.length })}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f3f4f6]">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path
                d="M27.2 5.87a7.6 7.6 0 0 0-10.74 0L16 6.33l-.46-.46A7.6 7.6 0 0 0 4.8 16.61l.46.46L16 27.8l10.74-10.73.46-.46a7.6 7.6 0 0 0 0-10.74Z"
                stroke="#d1d5dc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-medium text-[#0d2138]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t("empty.title")}
            </p>
            <p className="mt-1 text-[14px] text-[#6a7282]">
              {t("empty.description")}
            </p>
          </div>
          <Link
            href="/listings"
            className="mt-2 inline-block rounded-xl bg-[#1a4878] px-6 py-3 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            {t("empty.browseListings")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {listings.map((listing) => (
            <SavedCard key={listing.id} listing={listing} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
