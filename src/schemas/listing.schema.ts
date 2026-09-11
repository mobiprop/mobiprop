import { z } from "zod";

import {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
  Currency,
} from "@/generated/prisma/enums";

// Canonical amenity catalog. Keys must match the rows seeded by the
// add_listings_module migration (amenities.key). `group` drives the 3
// titled sections in the upload wizard's Features step (client's explicit
// grouping) — CREDIT_APPROVED isn't a physical feature and wasn't in the
// client's list, so it's placed under PROPERTY as the closest fit.
export const AMENITY_OPTIONS = [
  { key: "LIVING_ROOM", label: "Living Room", group: "PROPERTY" },
  { key: "LIVING_DINING_ROOM", label: "Living-dining Room", group: "PROPERTY" },
  { key: "BALCONY", label: "Balcony", group: "PROPERTY" },
  { key: "WALK_IN_CLOSET", label: "Walk-in Closet", group: "PROPERTY" },
  { key: "EN_SUITE_BEDROOM", label: "En-suite Bedroom", group: "PROPERTY" },
  { key: "STAFF_QUARTERS", label: "Staff Quarters", group: "PROPERTY" },
  { key: "LAUNDRY", label: "Laundry", group: "PROPERTY" },
  { key: "PARKING", label: "Parking", group: "PROPERTY" },
  { key: "FURNISHED", label: "Furnished", group: "PROPERTY" },
  { key: "APPROVED_FOR_PROFESSIONAL_USE", label: "Approved for Professional Use", group: "PROPERTY" },
  { key: "PET_FRIENDLY", label: "Pet Friendly", group: "PROPERTY" },
  { key: "CREDIT_APPROVED", label: "Credit Approved", group: "PROPERTY" },

  { key: "AIR_CONDITIONING", label: "Air Conditioning", group: "EQUIPMENT" },
  { key: "CENTRAL_AIR_CONDITIONING", label: "Central Air Conditioning", group: "EQUIPMENT" },
  { key: "CENTRAL_HEATING", label: "Central Heating", group: "EQUIPMENT" },
  { key: "RADIATORS", label: "Radiators", group: "EQUIPMENT" },
  { key: "RADIANT_FLOORS", label: "Radiant Floors", group: "EQUIPMENT" },
  { key: "BALANCED_FLUE_GAS_HEATER", label: "Balanced-flue Gas Heater", group: "EQUIPMENT" },
  { key: "GAS", label: "Gas", group: "EQUIPMENT" },
  { key: "WATER", label: "Water", group: "EQUIPMENT" },
  { key: "INTERNET", label: "Internet", group: "EQUIPMENT" },
  { key: "ELEVATOR", label: "Elevator", group: "EQUIPMENT" },
  { key: "SECURITY", label: "Security", group: "EQUIPMENT" },

  { key: "GARDEN", label: "Garden", group: "AMENITIES_EXTERIOR" },
  { key: "POOL", label: "Pool", group: "AMENITIES_EXTERIOR" },
  { key: "BARBECUE", label: "Barbecue", group: "AMENITIES_EXTERIOR" },
  { key: "COVERED_ENTERTAINING_AREA", label: "Covered Entertaining Area", group: "AMENITIES_EXTERIOR" },
  { key: "SOLARIUM", label: "Solarium", group: "AMENITIES_EXTERIOR" },
  { key: "GYM", label: "Gym", group: "AMENITIES_EXTERIOR" },
  { key: "MULTIPURPOSE_ROOM", label: "Multipurpose Room", group: "AMENITIES_EXTERIOR" },
  { key: "TENNIS_COURT", label: "Tennis Court", group: "AMENITIES_EXTERIOR" },
  { key: "PADEL_COURT", label: "Padel Court", group: "AMENITIES_EXTERIOR" },
  { key: "GOLF_COURSE", label: "Golf Course", group: "AMENITIES_EXTERIOR" },
  { key: "POLO_FIELD", label: "Polo Field", group: "AMENITIES_EXTERIOR" },
] as const;

export type AmenityKey = (typeof AMENITY_OPTIONS)[number]["key"];

const AMENITY_KEYS = AMENITY_OPTIONS.map((a) => a.key) as [AmenityKey, ...AmenityKey[]];

// Image upload constraints (mirrored client-side for previews and enforced
// server-side). Images upload directly to storage via signed URLs (the
// serverless function never receives the bytes), so the only ceiling is this
// per-file cap and the storage bucket's fileSizeLimit — not Vercel's ~4.5MB
// request-body limit.
export const LISTING_IMAGE_MAX_BYTES = 15 * 1024 * 1024; // 15MB per file (originals; converted to WebP before upload)
export const LISTING_IMAGE_MAX_COUNT = 40;
export const LISTING_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const imageMimeSchema = z
  .string()
  .refine((type) => LISTING_IMAGE_MIME_TYPES.includes(type), "Only JPG, PNG, and WebP images are allowed.");

/**
 * Request to mint signed upload tickets — sent before the browser uploads
 * directly to storage. We validate the claimed metadata for early/friendly
 * rejection; the authoritative size/type check happens against the stored
 * object when the upload is confirmed.
 */
export const listingUploadTicketRequestSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        type: imageMimeSchema,
        size: z.number().int().positive().max(LISTING_IMAGE_MAX_BYTES, "An image exceeds the size limit."),
      }),
    )
    .min(1, "At least one file is required.")
    .max(LISTING_IMAGE_MAX_COUNT, `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`),
});
export type ListingUploadTicketRequest = z.infer<typeof listingUploadTicketRequestSchema>;

/**
 * One image that the browser has already uploaded to storage. `imageId` /
 * `storagePath` are server-minted (returned in the upload ticket) and verified
 * against actual storage objects before any DB row is written.
 */
export const listingImageDescriptorSchema = z.object({
  imageId: z.uuid(),
  storagePath: z.string().min(1).max(512),
  originalFileName: z.string().min(1).max(255),
  mimeType: imageMimeSchema,
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
});
export type ListingImageDescriptor = z.infer<typeof listingImageDescriptorSchema>;

export const listingImageDescriptorsSchema = z
  .array(listingImageDescriptorSchema)
  .max(LISTING_IMAGE_MAX_COUNT, `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`);

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

// Update-only variant: distinguishes "field omitted, don't touch it" (undefined)
// from "explicitly clear this price" (null) — e.g. switching a listing from
// SALE_AND_RENT back to SALE-only must actually null out rentPrice in the DB,
// not just leave the previous value in place.
const clearablePrice = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value === null ? null : Number(value)),
  z.union([z.number().positive("Price must be greater than 0"), z.null()]).optional(),
);

const optionalArea = (label: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z
      .number()
      
      .positive(`${label} must be greater than 0`)
      .optional(),
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
  // Independent — a SALE_AND_RENT listing can be priced for sale and for
  // rent in different currencies (e.g. sale in USD, rent in ARS).
  saleCurrency: z.enum(Currency).default(Currency.USD),
  rentCurrency: z.enum(Currency).default(Currency.USD),
  // Must reference a real row in the dashboard's Locations sector — set
  // together with `location` (display text) by the form's location picker.
  locationId: z.string().trim().min(1, "Location is required"),
  location: z.string().trim().min(2, "Location is required"),
  fullAddress: z.string().trim().min(5, "Full address is required"),
  isFeatured: z.boolean().default(false),
  // Empty string from the dropdown means "unassigned"; only ADMIN/MANAGER
  // (listings:assign) may set this — enforced in listing-actions.ts.
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional().or(z.literal("")),
  // The seller/owner-of-record Contact for this listing (CRM plan §5/§9).
  // Not stored on Property directly — written to ContactProperty (role
  // OWNER) by the action. Empty string means "no owner set".
  ownerContactId: z.string().min(1).optional().or(z.literal("")),
  // YouTube/Vimeo/direct video link shown above the map on the public page.
  videoUrl: z.string().trim().url("Enter a valid video URL").optional().or(z.literal("")),

  // Step 2 — Listing Details
  bedrooms: requiredCount("Bedrooms"),
  bathrooms: requiredCount("Bathrooms"),
  toilets: requiredCount("Toilettes"),
  // Total area applies to every listing type — whole property area for
  // non-LOT types, parcel area for LOT. Covered/semi-covered/lot size are
  // shown for non-LOT types; lot frontage/depth replace them for LOT (see
  // UploadListingModal, which renders the relevant subset per `type`).
  totalAreaM2: numberFromInput.pipe(
    z.number({ error: "Total area is required" }).positive("Total area must be greater than 0"),
  ),
  coveredAreaM2: optionalArea("Covered area"),
  semiCoveredAreaM2: optionalArea("Semi-covered area"),
  lotSizeM2: optionalArea("Lot size"),
  lotFrontageM2: optionalArea("Lot frontage"),
  lotDepthM2: optionalArea("Lot depth"),
  yearBuilt: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z
      .number()
      .int()
      .min(1800, "Year built must be 1800 or later")
      .max(CURRENT_YEAR, `Year built can't be after ${CURRENT_YEAR}`)
      .optional(),
  ),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  amenities: z.array(z.enum(AMENITY_KEYS)).default([]),
});

// Prices are conditionally required based on the operation type (the UI shows
// Sale Price / Rent Price / both accordingly).
function validatePrices(
  data: { operationType: PropertyOperationType; salePrice?: number | null; rentPrice?: number | null },
  ctx: z.RefinementCtx,
) {
  const needsSale =
    data.operationType === PropertyOperationType.SALE ||
    data.operationType === PropertyOperationType.SALE_AND_RENT;
  const needsRent =
    data.operationType === PropertyOperationType.RENT ||
    data.operationType === PropertyOperationType.SALE_AND_RENT;

  if (needsSale && data.salePrice == null) {
    ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price is required" });
  }
  if (needsRent && data.rentPrice == null) {
    ctx.addIssue({ code: "custom", path: ["rentPrice"], message: "Rent price is required" });
  }
}

export const createListingSchema = listingBaseSchema.superRefine(validatePrices);

export const updateListingSchema = listingBaseSchema
  .partial()
  // `.partial()` only wraps each field in `.optional()`; it doesn't remove a
  // field's `.default(...)`, so an omitted `isFeatured`/`amenities` in a
  // partial PATCH body would otherwise be silently coerced to `false`/`[]`
  // and overwrite the existing value. Re-declare both as plain optionals.
  .extend({
    isFeatured: z.boolean().optional(),
    amenities: z.array(z.enum(AMENITY_KEYS)).optional(),
    saleCurrency: z.enum(Currency).optional(),
    rentCurrency: z.enum(Currency).optional(),
    salePrice: clearablePrice,
    rentPrice: clearablePrice,
  })
  .superRefine((data, ctx) => {
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
  0: ["title", "type", "status", "operationType", "salePrice", "rentPrice", "saleCurrency", "rentCurrency", "locationId", "location", "fullAddress", "isFeatured", "assignedAgentId", "ownerContactId"],
  1: [
    "bedrooms",
    "bathrooms",
    "toilets",
    "totalAreaM2",
    "coveredAreaM2",
    "semiCoveredAreaM2",
    "lotSizeM2",
    "lotFrontageM2",
    "lotDepthM2",
    "yearBuilt",
    "description",
  ],
  2: ["amenities"],
  3: ["videoUrl"],
};
