// Display formatting shared by the public listing cards/pages. Client-safe.

import type { PropertyType } from "@/generated/prisma/enums";
import type { PublicListingDto } from "../types/listing-dto";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  COMMERCIAL_OFFICE: "Commercial Office",
  LOT: "Lot",
  TOWNHOUSE: "Townhouse",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatSalePrice(value: number): string {
  return priceFormatter.format(value);
}

export function formatRentPrice(value: number): string {
  return `${priceFormatter.format(value)}/mo`;
}

/** Primary display price: sale price first, rent price (with /mo) otherwise. */
export function listingDisplayPrice(listing: PublicListingDto): string {
  if (listing.salePrice !== null && listing.operationType !== "RENT") {
    return formatSalePrice(listing.salePrice);
  }
  if (listing.rentPrice !== null) return formatRentPrice(listing.rentPrice);
  if (listing.salePrice !== null) return formatSalePrice(listing.salePrice);
  return "Price on request";
}

/** Card tags, e.g. ["Sale", "Apartment"] or ["Sale", "Rent", "House"]. */
export function listingTags(listing: PublicListingDto): string[] {
  const tags: string[] = [];
  if (listing.operationType === "SALE" || listing.operationType === "SALE_AND_RENT") {
    tags.push("Sale");
  }
  if (listing.operationType === "RENT" || listing.operationType === "SALE_AND_RENT") {
    tags.push("Rent");
  }
  tags.push(PROPERTY_TYPE_LABELS[listing.type]);
  return tags;
}

export function formatArea(areaM2: number | null): string {
  return areaM2 === null ? "—" : `${areaM2.toLocaleString("en-US")} m²`;
}

export function formatBeds(bedrooms: number | null): string {
  return bedrooms === null ? "—" : `${bedrooms} Bed`;
}

export function formatBaths(bathrooms: number | null): string {
  return bathrooms === null ? "—" : `${bathrooms} Bath`;
}
