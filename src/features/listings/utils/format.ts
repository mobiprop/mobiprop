// Display formatting shared by the public listing cards/pages. Client-safe.

import type { TFunction } from "i18next";
import type { PropertyType } from "@/generated/prisma/enums";
import type { PublicListingDto } from "../types/listing-dto";

/** English fallback labels — used where no translator is available (dashboard/admin views). */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  COMMERCIAL_OFFICE: "Commercial Office",
  LOT: "Lot",
  TOWNHOUSE: "Townhouse",
};

const PROPERTY_TYPE_LABEL_KEYS: Record<PropertyType, string> = {
  APARTMENT: "listings:card.apartment",
  HOUSE: "listings:card.house",
  COMMERCIAL_OFFICE: "listings:card.commercialOffice",
  LOT: "listings:card.lot",
  TOWNHOUSE: "listings:card.townhouse",
};

/** Translated property type label — the public-site version of PROPERTY_TYPE_LABELS. */
export function propertyTypeLabel(type: PropertyType, t: TFunction): string {
  return t(PROPERTY_TYPE_LABEL_KEYS[type]);
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatSalePrice(value: number): string {
  return priceFormatter.format(value);
}

export function formatRentPrice(value: number, t: TFunction): string {
  return `${priceFormatter.format(value)}${t("listings:card.perMonthSuffix")}`;
}

/** Primary display price: sale price first, rent price (with /mo) otherwise. */
export function listingDisplayPrice(listing: PublicListingDto, t: TFunction): string {
  if (listing.salePrice !== null && listing.operationType !== "RENT") {
    return formatSalePrice(listing.salePrice);
  }
  if (listing.rentPrice !== null) return formatRentPrice(listing.rentPrice, t);
  if (listing.salePrice !== null) return formatSalePrice(listing.salePrice);
  return t("listings:card.priceOnRequest");
}

/** Card tags, e.g. ["Sale", "Apartment"] or ["Sale", "Rent", "House"]. */
export function listingTags(listing: PublicListingDto, t: TFunction): string[] {
  const tags: string[] = [];
  if (listing.operationType === "SALE" || listing.operationType === "SALE_AND_RENT") {
    tags.push(t("listings:card.sale"));
  }
  if (listing.operationType === "RENT" || listing.operationType === "SALE_AND_RENT") {
    tags.push(t("listings:card.rent"));
  }
  tags.push(propertyTypeLabel(listing.type, t));
  return tags;
}

export function formatArea(areaM2: number | null): string {
  return areaM2 === null ? "—" : `${areaM2.toLocaleString("en-US")} m²`;
}

export function formatBeds(bedrooms: number | null, t: TFunction): string {
  return bedrooms === null ? "—" : `${bedrooms} ${t("listings:card.beds")}`;
}

export function formatBaths(bathrooms: number | null, t: TFunction): string {
  return bathrooms === null ? "—" : `${bathrooms} ${t("listings:card.baths")}`;
}
