// Serializable listing shapes shared by server actions, API routes, and the
// dashboard/public UI. Plain types only — no server imports — so client
// components can use them freely.

import type {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
} from "@/generated/prisma/enums";
import type { AmenityKey } from "@/schemas/listing.schema";

export type ListingImageDto = {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  altText: string | null;
  /** Native pixel size, when known. Migrated listings can be undersized —
   *  the gallery uses this to avoid upscaling a small source past quality. */
  width: number | null;
  height: number | null;
};

/** Full shape for the dashboard table/grid and the edit modal. Staff only. */
export type DashboardListingDto = {
  id: string;
  listingId: string;
  slug: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  operationType: PropertyOperationType;
  salePrice: number | null;
  rentPrice: number | null;
  location: string;
  locationId: string | null;
  fullAddress: string;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  totalAreaM2: number | null;
  coveredAreaM2: number | null;
  semiCoveredAreaM2: number | null;
  lotSizeM2: number | null;
  lotFrontageM2: number | null;
  lotDepthM2: number | null;
  yearBuilt: number | null;
  isFeatured: boolean;
  videoUrl: string | null;
  viewsCount: number;
  assignedAgentId: string | null;
  createdById: string | null;
  publishedAt: string | null;
  createdAt: string;
  amenities: AmenityKey[];
  images: ListingImageDto[];
  coverImageUrl: string | null;
  /** Seller/owner-of-record Contact, if one has been linked (CRM plan §5/§9). */
  ownerContact: { id: string; fullName: string } | null;
};

export type DashboardListingMetrics = {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  featuredListings: number;
};

/** Safe subset for the public website — never exposes internal/CRM fields. */
export type PublicListingDto = {
  id: string;
  listingId: string;
  slug: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  operationType: PropertyOperationType;
  salePrice: number | null;
  rentPrice: number | null;
  location: string;
  fullAddress: string;
  city: string | null;
  province: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  totalAreaM2: number | null;
  coveredAreaM2: number | null;
  semiCoveredAreaM2: number | null;
  lotSizeM2: number | null;
  lotFrontageM2: number | null;
  lotDepthM2: number | null;
  parkingSpaces: number | null;
  yearBuilt: number | null;
  floors: number | null;
  isFeatured: boolean;
  videoUrl: string | null;
  publishedAt: string | null;
  amenities: AmenityKey[];
  images: ListingImageDto[];
  coverImageUrl: string | null;
};
