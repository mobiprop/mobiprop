// Display helpers for the dashboard Listings page (list & grid views).
// Real data comes from /api/dashboard/listings as DashboardListingDto.

import type {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
} from "@/generated/prisma/enums";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";

export const TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  COMMERCIAL_OFFICE: "Commercial Office",
  LOT: "Lot",
  TOWNHOUSE: "Townhouse",
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PAUSED: "Paused",
  RENTED: "Rented",
  SOLD: "Sold",
  DRAFT: "Draft",
};

export const OPERATION_LABELS: Record<PropertyOperationType, string> = {
  SALE: "Sale",
  RENT: "Rent",
  SALE_AND_RENT: "Both",
};

export const TYPE_BADGE: Record<PropertyType, { bg: string; text: string }> = {
  APARTMENT:         { bg: "#fef3c6", text: "#bb4d00" },
  HOUSE:             { bg: "#dff2fe", text: "#0069a8" },
  COMMERCIAL_OFFICE: { bg: "#dcfce7", text: "#008236" },
  LOT:               { bg: "#ede9fe", text: "#6d28d9" },
  TOWNHOUSE:         { bg: "#fce7f3", text: "#a3004c" },
};

export const STATUS_BADGE: Record<PropertyStatus, { bg: string; text: string }> = {
  ACTIVE:   { bg: "#dcfce7", text: "#008236" },
  INACTIVE: { bg: "#f3f4f6", text: "#4a5565" },
  PAUSED:   { bg: "#fef3c6", text: "#e17100" },
  RENTED:   { bg: "#dff2fe", text: "#0069a8" },
  SOLD:     { bg: "#fee2e2", text: "#e7000b" },
  DRAFT:    { bg: "#ede9fe", text: "#6d28d9" },
};

export const FALLBACK_LISTING_IMAGE = "/assets/figma-temp/UserProfile/prop-0.png";

const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "$450,000" / "$1,200/mo" / "$450,000 · $1,200/mo" depending on operation. */
export function formatListingPrice(listing: DashboardListingDto): string {
  const sale = listing.salePrice !== null ? `$${priceFormat.format(listing.salePrice)}` : null;
  const rent = listing.rentPrice !== null ? `$${priceFormat.format(listing.rentPrice)}/mo` : null;
  if (sale && rent) return `${sale} · ${rent}`;
  return sale ?? rent ?? "—";
}
