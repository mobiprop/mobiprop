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
  fullAddress: string;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  areaSqft: number | null;
  yearBuilt: number | null;
  isFeatured: boolean;
  viewsCount: number;
  assignedAgentId: string | null;
  createdById: string | null;
  publishedAt: string | null;
  createdAt: string;
  amenities: AmenityKey[];
  images: ListingImageDto[];
  coverImageUrl: string | null;
};

export type DashboardListingMetrics = {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  featuredListings: number;
};

/** Safe subset for the public website — never exposes internal/CRM fields. */
export type PublicListingDto = {
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
  city: string | null;
  country: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  isFeatured: boolean;
  amenities: AmenityKey[];
  images: ListingImageDto[];
  coverImageUrl: string | null;
};
