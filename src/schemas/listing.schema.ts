import { z } from "zod";

import {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
} from "@/generated/prisma/enums";

// Canonical amenity catalog. Keys must match the rows seeded by the
// add_listings_module migration (amenities.key).
export const AMENITY_OPTIONS = [
  { key: "PARKING", label: "Parking" },
  { key: "GARDEN", label: "Garden" },
  { key: "POOL", label: "Pool" },
  { key: "GYM", label: "Gym" },
  { key: "BALCONY", label: "Balcony" },
  { key: "ELEVATOR", label: "Elevator" },
  { key: "SECURITY", label: "Security" },
  { key: "FURNISHED", label: "Furnished" },
  { key: "PET_FRIENDLY", label: "Pet Friendly" },
  { key: "CREDIT_APPROVED", label: "Credit Approved" },
  { key: "INTERNET", label: "Internet" },
  { key: "GAS", label: "Gas" },
  { key: "RADIANT_FLOORS", label: "Radiant Floors" },
  { key: "AIR_CONDITIONING", label: "Air Conditioning" },
  { key: "BARBECUE", label: "Barbecue" },
  { key: "LAUNDRY", label: "Laundry" },
  { key: "WATER", label: "Water" },
  { key: "TENNIS_COURT", label: "Tennis Court" },
] as const;

export type AmenityKey = (typeof AMENITY_OPTIONS)[number]["key"];

const AMENITY_KEYS = AMENITY_OPTIONS.map((a) => a.key) as [AmenityKey, ...AmenityKey[]];

// Image upload constraints (mirrored client-side for previews and enforced
// server-side before optimization/storage).
export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10MB per file (pre-optimization)
export const LISTING_IMAGE_MAX_COUNT = 24;
export const LISTING_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Form inputs arrive as strings; turn "" into undefined so "required" and
// "optional" both behave, then coerce to number.
const numberFromInput = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number(),
);

const requiredCount = (label: string) =>
  numberFromInput.pipe(
    z
      .number({ error: `${label} is required` })
      .int(`${label} must be a whole number`)
      .min(0, `${label} can't be negative`),
  );

const optionalPrice = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().positive("Price must be greater than 0").optional(),
);

const CURRENT_YEAR = new Date().getFullYear();

export const listingBaseSchema = z.object({
  // Step 1 — Basic Info
  title: z
    .string()
    .trim()
    .min(3, "Listing name must be at least 3 characters")
    .max(150, "Listing name must be at most 150 characters"),
  type: z.enum(PropertyType, { error: "Listing type is required" }),
  status: z.enum(PropertyStatus, { error: "Status is required" }),
  operationType: z.enum(PropertyOperationType, { error: "Operation type is required" }),
  salePrice: optionalPrice,
  rentPrice: optionalPrice,
  location: z.string().trim().min(2, "Location is required"),
  fullAddress: z.string().trim().min(5, "Full address is required"),
  isFeatured: z.boolean().default(false),
  // Empty string from the dropdown means "unassigned"; only ADMIN/MANAGER
  // (listings:assign) may set this — enforced in listing-actions.ts.
  assignedAgentId: z.string().uuid().optional().or(z.literal("")),

  // Step 2 — Listing Details
  bedrooms: requiredCount("Bedrooms"),
  bathrooms: requiredCount("Bathrooms"),
  toilets: requiredCount("Toilettes"),
  areaSqft: numberFromInput.pipe(
    z.number({ error: "Area is required" }).int().positive("Area must be greater than 0"),
  ),
  yearBuilt: numberFromInput.pipe(
    z
      .number({ error: "Year built is required" })
      .int()
      .min(1800, "Year built must be 1800 or later")
      .max(CURRENT_YEAR, `Year built can't be after ${CURRENT_YEAR}`),
  ),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  amenities: z.array(z.enum(AMENITY_KEYS)).default([]),
});

// Prices are conditionally required based on the operation type (the UI shows
// Sale Price / Rent Price / both accordingly).
function validatePrices(
  data: { operationType: PropertyOperationType; salePrice?: number; rentPrice?: number },
  ctx: z.RefinementCtx,
) {
  const needsSale =
    data.operationType === PropertyOperationType.SALE ||
    data.operationType === PropertyOperationType.SALE_AND_RENT;
  const needsRent =
    data.operationType === PropertyOperationType.RENT ||
    data.operationType === PropertyOperationType.SALE_AND_RENT;

  if (needsSale && data.salePrice === undefined) {
    ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price is required" });
  }
  if (needsRent && data.rentPrice === undefined) {
    ctx.addIssue({ code: "custom", path: ["rentPrice"], message: "Rent price is required" });
  }
}

export const createListingSchema = listingBaseSchema.superRefine(validatePrices);

export const updateListingSchema = listingBaseSchema.partial().superRefine((data, ctx) => {
  if (data.operationType) {
    validatePrices(
      { operationType: data.operationType, salePrice: data.salePrice, rentPrice: data.rentPrice },
      ctx,
    );
  }
});

export const listingStatusSchema = z.object({
  status: z.enum(PropertyStatus, { error: "Status is required" }),
});

export const listingFeaturedSchema = z.object({
  isFeatured: z.boolean({ error: "isFeatured is required" }),
});

export type ListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

// Field groups used by the modal to validate one step at a time
// (react-hook-form `trigger(...)` before allowing Next Step).
export const LISTING_STEP_FIELDS: Record<number, (keyof ListingInput)[]> = {
  0: ["title", "type", "status", "operationType", "salePrice", "rentPrice", "location", "fullAddress", "isFeatured", "assignedAgentId"],
  1: ["bedrooms", "bathrooms", "toilets", "areaSqft", "yearBuilt", "description", "amenities"],
};
