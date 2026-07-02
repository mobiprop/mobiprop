"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import Link from "next/link";
import {
  PROPERTY_TYPE_LABELS,
  formatArea,
  formatBaths,
  formatBeds,
  listingDisplayPrice,
} from "../utils/format";

type SavedListing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  operationType: string;
  salePrice: number | null;
  rentPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  totalAreaM2: number | null;
  coverImageUrl: string | null;
  savedAt: string;
};

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-1.webp";

function PinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <path
        d="M6 13S1 8.5 1 5a5 5 0 0 1 10 0c0 3.5-5 8-5 8Z"
        stroke="#6a7282"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="5" r="1.5" stroke="#6a7282" strokeWidth="1.25" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M16.25 7.5H12.5V3.75" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 12.5H7.5V16.25" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 16.25V12.5H16.25" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 3.75V7.5H3.75" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M1.875 16.25V3.75" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.875 13.125H19.375V16.25" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3.75" y="7.5" width="5" height="3.75" rx="1" stroke="#6a7282" strokeWidth="1.25" />
      <rect x="10.625" y="7.5" width="7.5" height="3.75" rx="1" stroke="#6a7282" strokeWidth="1.25" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 10h15v3.75a3.75 3.75 0 0 1-3.75 3.75H6.25A3.75 3.75 0 0 1 2.5 13.75V10Z" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 10V5a2.5 2.5 0 0 1 5 0v5" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SavedCard({
  listing,
  onRemove,
}: {
  listing: SavedListing;
  onRemove: (id: string) => void;
}) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(listing.id);
  };

  const displayPrice = listingDisplayPrice({
    salePrice: listing.salePrice,
    rentPrice: listing.rentPrice,
    operationType: listing.operationType as "SALE" | "RENT" | "SALE_AND_RENT",
  } as Parameters<typeof listingDisplayPrice>[0]);

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-[#e5e7eb] bg-white hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-[200px] sm:h-[220px] overflow-hidden">
        <img
          src={listing.coverImageUrl ?? fallbackImg}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className="bg-white/90 px-2.5 py-0.5 rounded-full text-[12px] text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {listing.operationType === "RENT" ? "Rent" : "Sale"}
          </span>
          <span
            className="bg-white/90 px-2.5 py-0.5 rounded-full text-[12px] text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {PROPERTY_TYPE_LABELS[listing.type as keyof typeof PROPERTY_TYPE_LABELS] ?? listing.type}
          </span>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          aria-label="Remove from saved"
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-[#fff0f0] transition-colors disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#e74c3c">
            <path
              d="M13.6 2.9a3.8 3.8 0 0 0-5.38 0L8 3.12l-.22-.22a3.8 3.8 0 0 0-5.38 5.38L8 13.87l5.6-5.59a3.8 3.8 0 0 0 0-5.38Z"
              stroke="#e74c3c"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p
              className="text-[16px] font-medium text-[#0d2138] leading-[22px] truncate"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {listing.title}
            </p>
            <div className="flex items-center gap-1">
              <PinIcon />
              <span
                className="text-[13px] text-[#6a7282] truncate"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {listing.location}
              </span>
            </div>
          </div>
          <p
            className="text-[16px] font-semibold text-[#2b3038] whitespace-nowrap"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {displayPrice}
          </p>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-[#f3f4f6]">
          {listing.totalAreaM2 !== null && (
            <div className="flex items-center gap-1.5">
              <AreaIcon />
              <span className="text-[12px] text-[#6a7282]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {formatArea(listing.totalAreaM2)}
              </span>
            </div>
          )}
          {listing.bedrooms !== null && (
            <div className="flex items-center gap-1.5">
              <BedIcon />
              <span className="text-[12px] text-[#6a7282]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {formatBeds(listing.bedrooms)}
              </span>
            </div>
          )}
          {listing.bathrooms !== null && (
            <div className="flex items-center gap-1.5">
              <BathIcon />
              <span className="text-[12px] text-[#6a7282]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {formatBaths(listing.bathrooms)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SavedListingsPageContent({ initialListings }: { initialListings: SavedListing[] }) {
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
    mutationFn: (id: string) => fetch(`/api/saved-listings/${id}`, { method: "DELETE" }),
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
      className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto py-10 sm:py-14"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-semibold text-[#0d2138] leading-tight"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Saved Properties
        </h1>
        <p className="mt-1 text-[14px] text-[#6a7282]">
          {listings.length === 0
            ? "No saved properties yet."
            : `${listings.length} saved ${listings.length === 1 ? "property" : "properties"}`}
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
              No saved properties yet
            </p>
            <p className="mt-1 text-[14px] text-[#6a7282]">
              Browse listings and tap the heart icon to save properties here.
            </p>
          </div>
          <Link
            href="/listings"
            className="mt-2 inline-block rounded-xl bg-[#1a4878] px-6 py-3 text-[14px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            Browse Listings
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
