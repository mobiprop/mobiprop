import "server-only";

import { cache } from "react";
import { randomUUID } from "crypto";
import type { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { notifyAdmins } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { geocodeAddress } from "@/lib/maps";
import { optimizeListingImage } from "@/lib/images";
import { removePropertyImages, uploadPropertyImage } from "@/lib/supabase/storage";
import {
  createListingSchema,
  updateListingSchema,
  listingStatusSchema,
  listingFeaturedSchema,
  LISTING_IMAGE_MAX_BYTES,
  LISTING_IMAGE_MAX_COUNT,
  LISTING_IMAGE_MIME_TYPES,
  type AmenityKey,
} from "@/schemas/listing.schema";
import { PropertyStatus, UserRole } from "@/generated/prisma/enums";
import type { Prisma, Profile } from "@/generated/prisma/client";

import type {
  DashboardListingDto,
  DashboardListingMetrics,
  ListingImageDto,
  PublicListingDto,
} from "./types/listing-dto";

export type ListingActionError = { ok: false; error: string; status: number };
export type ListingActionResult<T> = ({ ok: true } & T) | ListingActionError;

function firstIssueMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}

function forbidden(): ListingActionError {
  return { ok: false, error: "You don't have permission to perform this action.", status: 403 };
}

function notFound(): ListingActionError {
  return { ok: false, error: "Listing not found.", status: 404 };
}

// ── Record-level access ───────────────────────────────────────────────────────

type PropertyRecord = { createdById: string | null; assignedAgentId: string | null };

/**
 * ADMIN/MANAGER manage all listings; AGENT only listings they created or are
 * assigned to. Called after the role-level permission check passed.
 */
function canManageRecord(profile: Profile, property: PropertyRecord): boolean {
  if (profile.role === UserRole.ADMIN || profile.role === UserRole.MANAGER) return true;
  return property.createdById === profile.id || property.assignedAgentId === profile.id;
}

/** Prisma `where` scoping listings an AGENT may see; empty for ADMIN/MANAGER. */
function recordScope(profile: Profile): Prisma.PropertyWhereInput {
  if (profile.role === UserRole.ADMIN || profile.role === UserRole.MANAGER) return {};
  return { OR: [{ createdById: profile.id }, { assignedAgentId: profile.id }] };
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

const listingInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  amenities: { include: { amenity: true } },
} satisfies Prisma.PropertyInclude;

type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof listingInclude }>;

function toImageDto(image: PropertyWithRelations["images"][number]): ListingImageDto {
  return {
    id: image.id,
    url: image.url,
    sortOrder: image.sortOrder,
    isCover: image.isCover,
    altText: image.altText,
  };
}

function coverUrl(images: PropertyWithRelations["images"]): string | null {
  return (images.find((i) => i.isCover) ?? images[0])?.url ?? null;
}

function toDashboardDto(property: PropertyWithRelations): DashboardListingDto {
  return {
    id: property.id,
    listingId: property.listingId,
    slug: property.slug,
    title: property.title,
    description: property.description,
    type: property.type,
    status: property.status,
    operationType: property.operationType,
    salePrice: property.salePrice === null ? null : Number(property.salePrice),
    rentPrice: property.rentPrice === null ? null : Number(property.rentPrice),
    location: property.location,
    fullAddress: property.fullAddress,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    areaSqft: property.areaSqft,
    yearBuilt: property.yearBuilt,
    isFeatured: property.isFeatured,
    viewsCount: property.viewsCount,
    assignedAgentId: property.assignedAgentId,
    createdById: property.createdById,
    publishedAt: property.publishedAt?.toISOString() ?? null,
    createdAt: property.createdAt.toISOString(),
    amenities: property.amenities.map((a) => a.amenity.key as AmenityKey),
    images: property.images.map(toImageDto),
    coverImageUrl: coverUrl(property.images),
  };
}

function toPublicDto(property: PropertyWithRelations): PublicListingDto {
  return {
    listingId: property.listingId,
    slug: property.slug,
    title: property.title,
    description: property.description,
    type: property.type,
    status: property.status,
    operationType: property.operationType,
    salePrice: property.salePrice === null ? null : Number(property.salePrice),
    rentPrice: property.rentPrice === null ? null : Number(property.rentPrice),
    location: property.location,
    fullAddress: property.fullAddress,
    city: property.city,
    province: property.province,
    country: property.country,
    latitude: property.latitude === null ? null : Number(property.latitude),
    longitude: property.longitude === null ? null : Number(property.longitude),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    areaSqft: property.areaSqft,
    lotSizeSqft: property.lotSizeSqft,
    parkingSpaces: property.parkingSpaces,
    yearBuilt: property.yearBuilt,
    floors: property.floors,
    isFeatured: property.isFeatured,
    publishedAt: property.publishedAt?.toISOString() ?? null,
    amenities: property.amenities.map((a) => a.amenity.key as AmenityKey),
    images: property.images.map(toImageDto),
    coverImageUrl: coverUrl(property.images),
  };
}

// ── Listing id / slug generation (server-side only, never trusted from client) ─

async function nextListingId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(listing_id FROM 5) AS INTEGER)) AS max FROM properties
  `;
  return `LST-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Image file validation ─────────────────────────────────────────────────────

function validateListingFiles(files: File[], existingCount = 0): ListingActionError | null {
  if (existingCount + files.length > LISTING_IMAGE_MAX_COUNT) {
    return { ok: false, error: `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`, status: 400 };
  }
  for (const file of files) {
    if (!LISTING_IMAGE_MIME_TYPES.includes(file.type)) {
      return { ok: false, error: "Only JPG, PNG, and WebP images are allowed.", status: 400 };
    }
    if (file.size > LISTING_IMAGE_MAX_BYTES) {
      return { ok: false, error: "Each image must be 10MB or smaller.", status: 400 };
    }
    if (file.size === 0) {
      return { ok: false, error: "One of the uploaded images is empty.", status: 400 };
    }
  }
  return null;
}

type UploadedImage = {
  id: string;
  url: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  format: string;
};

/**
 * The plan requires an audit entry whenever the WebP pipeline fell back to
 * storing a validated original (uploaded format other than webp).
 */
async function logOptimizationFallbacks(
  actorId: string,
  propertyId: string,
  uploaded: UploadedImage[],
): Promise<void> {
  const fallbacks = uploaded.filter((u) => u.format !== "webp");
  if (fallbacks.length === 0) return;
  await logActivity({
    actorId,
    action: "PROPERTY_IMAGE_OPTIMIZATION_FALLBACK",
    entityType: "PROPERTY",
    entityId: propertyId,
    newValues: { files: fallbacks.map((f) => f.originalFileName), count: fallbacks.length },
  });
}

/** Optimize + upload each file; on failure, removes already-uploaded objects. */
async function uploadAll(propertyId: string, files: File[]): Promise<UploadedImage[]> {
  const uploaded: UploadedImage[] = [];
  try {
    for (const file of files) {
      const optimized = await optimizeListingImage(file);
      const imageId = randomUUID();
      const { url, storagePath } = await uploadPropertyImage(propertyId, imageId, optimized);
      uploaded.push({
        id: imageId,
        url,
        storagePath,
        originalFileName: file.name,
        mimeType: optimized.mimeType,
        sizeBytes: optimized.sizeBytes,
        width: optimized.width,
        height: optimized.height,
        format: optimized.format,
      });
    }
    return uploaded;
  } catch (error) {
    await removePropertyImages(uploaded.map((u) => u.storagePath));
    throw error;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createListing(
  input: unknown,
  files: File[],
  coverIndex: number,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };
  }
  const data = parsed.data;

  if (data.isFeatured && !hasPermission(profile.role, "listings:feature")) {
    return { ok: false, error: "You don't have permission to feature listings.", status: 403 };
  }

  if (files.length === 0 && data.status !== PropertyStatus.DRAFT) {
    return { ok: false, error: "At least one image is required to publish a listing.", status: 400 };
  }
  const fileError = validateListingFiles(files);
  if (fileError) return fileError;

  const propertyId = randomUUID();

  let uploaded: UploadedImage[];
  try {
    uploaded = await uploadAll(propertyId, files);
  } catch (error) {
    console.error("[listings] image upload failed", error);
    return { ok: false, error: "Image upload failed. Please try again.", status: 500 };
  }

  const safeCover = coverIndex >= 0 && coverIndex < uploaded.length ? coverIndex : 0;

  // Best-effort: coordinates power the public map; a geocoding failure never
  // blocks the listing.
  const coords = await geocodeAddress(`${data.fullAddress}, ${data.location}`);

  try {
    // listingId has a unique constraint; retry once in case two staff submit
    // at the same moment.
    let property: PropertyWithRelations | null = null;
    for (let attempt = 0; attempt < 2 && !property; attempt++) {
      const listingId = await nextListingId();
      try {
        property = await prisma.property.create({
          data: {
            id: propertyId,
            listingId,
            slug: `${slugify(data.title)}-${listingId.toLowerCase()}`,
            title: data.title,
            description: data.description,
            type: data.type,
            status: data.status,
            operationType: data.operationType,
            salePrice: data.salePrice,
            rentPrice: data.rentPrice,
            location: data.location,
            fullAddress: data.fullAddress,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            toilets: data.toilets,
            areaSqft: data.areaSqft,
            yearBuilt: data.yearBuilt,
            isFeatured: data.isFeatured,
            createdById: profile.id,
            updatedById: profile.id,
            publishedAt: data.status === PropertyStatus.ACTIVE ? new Date() : null,
            images: {
              create: uploaded.map((image, i) => ({
                id: image.id,
                url: image.url,
                storagePath: image.storagePath,
                originalFileName: image.originalFileName,
                mimeType: image.mimeType,
                sizeBytes: image.sizeBytes,
                width: image.width,
                height: image.height,
                format: image.format,
                sortOrder: i,
                isCover: i === safeCover,
              })),
            },
            amenities: {
              create: data.amenities.map((key) => ({ amenity: { connect: { key } } })),
            },
          },
          include: listingInclude,
        });
      } catch (error) {
        const isUniqueClash =
          typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
        if (!isUniqueClash || attempt === 1) throw error;
      }
    }
    if (!property) throw new Error("Failed to create listing record");

    await logActivity({
      actorId: profile.id,
      action: "PROPERTY_CREATED",
      entityType: "PROPERTY",
      entityId: property.id,
      newValues: {
        listingId: property.listingId,
        title: property.title,
        type: property.type,
        status: property.status,
        operationType: property.operationType,
        isFeatured: property.isFeatured,
        imageCount: uploaded.length,
      },
    });
    await logOptimizationFallbacks(profile.id, property.id, uploaded);
    await notifyAdmins(
      {
        type: "LISTING_CREATED",
        title: "New listing created",
        body: `${profile.fullName ?? profile.email} created "${property.title}" (${property.listingId}).`,
        entityType: "PROPERTY",
        entityId: property.id,
      },
      profile.id,
    );

    return { ok: true, listing: toDashboardDto(property) };
  } catch (error) {
    console.error("[listings] create failed", error);
    // DB write failed after storage upload — clean up the orphaned objects.
    await removePropertyImages(uploaded.map((u) => u.storagePath));
    return { ok: false, error: "Failed to create listing. Please try again.", status: 500 };
  }
}

// ── Dashboard list + metrics ──────────────────────────────────────────────────

export async function listDashboardListings(search?: string, limit?: number): Promise<
  ListingActionResult<{ listings: DashboardListingDto[]; metrics: DashboardListingMetrics }>
> {
  const gate = await requirePermission("listings:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = recordScope(gate.profile);
  const where: import("@/generated/prisma/client").Prisma.PropertyWhereInput = {
    ...scope,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { listingId: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [properties, viewsAggregate] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      ...(limit && { take: limit }),
    }),
    prisma.property.aggregate({ where: scope, _sum: { viewsCount: true } }),
  ]);

  return {
    ok: true,
    listings: properties.map(toDashboardDto),
    metrics: {
      totalListings: properties.length,
      activeListings: properties.filter((p) => p.status === PropertyStatus.ACTIVE).length,
      totalViews: viewsAggregate._sum.viewsCount ?? 0,
      featuredListings: properties.filter((p) => p.isFeatured).length,
    },
  };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateListing(
  id: string,
  input: unknown,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const parsed = updateListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };
  }
  const data = parsed.data;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();

  if (
    data.status !== undefined &&
    data.status !== existing.status &&
    !hasPermission(profile.role, "listings:pause")
  ) {
    return { ok: false, error: "You don't have permission to change listing status.", status: 403 };
  }
  if (
    data.isFeatured !== undefined &&
    data.isFeatured !== existing.isFeatured &&
    !hasPermission(profile.role, "listings:feature")
  ) {
    return { ok: false, error: "You don't have permission to feature listings.", status: 403 };
  }

  const { amenities, ...fields } = data;

  // Re-geocode when the address changed (best-effort, never blocks the save).
  const addressChanged =
    (data.fullAddress !== undefined && data.fullAddress !== existing.fullAddress) ||
    (data.location !== undefined && data.location !== existing.location);
  const coords = addressChanged
    ? await geocodeAddress(
        `${data.fullAddress ?? existing.fullAddress}, ${data.location ?? existing.location}`,
      )
    : null;

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...fields,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      updatedById: profile.id,
      ...(data.status === PropertyStatus.ACTIVE && !existing.publishedAt
        ? { publishedAt: new Date() }
        : {}),
      ...(amenities !== undefined
        ? {
            amenities: {
              deleteMany: {},
              create: amenities.map((key) => ({ amenity: { connect: { key } } })),
            },
          }
        : {}),
    },
    include: listingInclude,
  });

  // Log only the fields that actually changed (audit requires old vs new).
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    const before = existing[key];
    const after = property[key];
    const normalize = (v: unknown) => (v instanceof Date ? v.toISOString() : v?.toString() ?? null);
    if (normalize(before) !== normalize(after)) {
      oldValues[key] = normalize(before);
      newValues[key] = normalize(after);
    }
  }
  if (amenities !== undefined) {
    const beforeKeys = existing.amenities.map((a) => a.amenity.key).sort();
    const afterKeys = [...amenities].sort();
    if (beforeKeys.join(",") !== afterKeys.join(",")) {
      oldValues.amenities = beforeKeys;
      newValues.amenities = afterKeys;
    }
  }

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_UPDATED",
    entityType: "PROPERTY",
    entityId: property.id,
    oldValues: oldValues as Prisma.InputJsonValue,
    newValues: newValues as Prisma.InputJsonValue,
  });

  if (oldValues.status !== undefined) {
    await notifyAdmins(
      {
        type: "LISTING_STATUS_CHANGED",
        title: "Listing status changed",
        body: `${profile.fullName ?? profile.email} changed "${property.title}" (${property.listingId}) to ${property.status}.`,
        entityType: "PROPERTY",
        entityId: property.id,
      },
      profile.id,
    );
  }

  return { ok: true, listing: toDashboardDto(property) };
}

// ── Status (pause/activate/sold/rented) ───────────────────────────────────────

export async function setListingStatus(
  id: string,
  input: unknown,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:pause");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const parsed = listingStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();

  const property = await prisma.property.update({
    where: { id },
    data: {
      status: parsed.data.status,
      updatedById: profile.id,
      ...(parsed.data.status === PropertyStatus.ACTIVE && !existing.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    },
    include: listingInclude,
  });

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_STATUS_CHANGED",
    entityType: "PROPERTY",
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status: property.status },
  });
  await notifyAdmins(
    {
      type: "LISTING_STATUS_CHANGED",
      title: "Listing status changed",
      body: `${profile.fullName ?? profile.email} changed "${property.title}" (${property.listingId}) to ${property.status}.`,
      entityType: "PROPERTY",
      entityId: id,
    },
    profile.id,
  );

  return { ok: true, listing: toDashboardDto(property) };
}

// ── Featured toggle ───────────────────────────────────────────────────────────

export async function setListingFeatured(
  id: string,
  input: unknown,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:feature");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const parsed = listingFeaturedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();

  const property = await prisma.property.update({
    where: { id },
    data: { isFeatured: parsed.data.isFeatured, updatedById: profile.id },
    include: listingInclude,
  });

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_FEATURED_CHANGED",
    entityType: "PROPERTY",
    entityId: id,
    oldValues: { isFeatured: existing.isFeatured },
    newValues: { isFeatured: property.isFeatured },
  });

  return { ok: true, listing: toDashboardDto(property) };
}

// ── Delete (ADMIN only via listings:delete) ───────────────────────────────────

export async function deleteListing(id: string): Promise<ListingActionResult<object>> {
  const gate = await requirePermission("listings:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();

  await prisma.property.delete({ where: { id } });
  await removePropertyImages(existing.images.map((i) => i.storagePath));

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_DELETED",
    entityType: "PROPERTY",
    entityId: id,
    oldValues: {
      listingId: existing.listingId,
      title: existing.title,
      type: existing.type,
      status: existing.status,
      operationType: existing.operationType,
      location: existing.location,
      imageCount: existing.images.length,
    },
  });
  await notifyAdmins(
    {
      type: "LISTING_DELETED",
      title: "Listing deleted",
      body: `${profile.fullName ?? profile.email} deleted "${existing.title}" (${existing.listingId}).`,
      entityType: "PROPERTY",
      entityId: id,
    },
    profile.id,
  );

  return { ok: true };
}

// ── Images (add / remove / cover) ─────────────────────────────────────────────

export async function addListingImages(
  id: string,
  files: File[],
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();

  if (files.length === 0) return { ok: false, error: "No images were provided.", status: 400 };
  const fileError = validateListingFiles(files, existing.images.length);
  if (fileError) return fileError;

  let uploaded: UploadedImage[];
  try {
    uploaded = await uploadAll(id, files);
  } catch (error) {
    console.error("[listings] image upload failed", error);
    return { ok: false, error: "Image upload failed. Please try again.", status: 500 };
  }

  const baseOrder = Math.max(-1, ...existing.images.map((i) => i.sortOrder)) + 1;
  const hasCover = existing.images.some((i) => i.isCover);

  await prisma.propertyImage.createMany({
    data: uploaded.map((image, i) => ({
      id: image.id,
      propertyId: id,
      url: image.url,
      storagePath: image.storagePath,
      originalFileName: image.originalFileName,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      width: image.width,
      height: image.height,
      format: image.format,
      sortOrder: baseOrder + i,
      isCover: !hasCover && i === 0,
    })),
  });

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_IMAGE_UPLOADED",
    entityType: "PROPERTY",
    entityId: id,
    newValues: { addedCount: uploaded.length },
  });
  await logOptimizationFallbacks(profile.id, id, uploaded);

  const property = await prisma.property.findUniqueOrThrow({ where: { id }, include: listingInclude });
  return { ok: true, listing: toDashboardDto(property) };
}

export async function removeListingImage(
  id: string,
  imageId: string,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();

  const image = existing.images.find((i) => i.id === imageId);
  if (!image) return { ok: false, error: "Image not found.", status: 404 };

  if (existing.images.length === 1 && existing.status !== PropertyStatus.DRAFT) {
    return { ok: false, error: "A published listing needs at least one image.", status: 400 };
  }

  await prisma.propertyImage.delete({ where: { id: imageId } });

  // Removing the cover promotes the next image so a listing always has one.
  if (image.isCover) {
    const next = existing.images.filter((i) => i.id !== imageId).sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (next) {
      await prisma.propertyImage.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }

  await removePropertyImages([image.storagePath]);

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_IMAGE_REMOVED",
    entityType: "PROPERTY",
    entityId: id,
    oldValues: { imageId, storagePath: image.storagePath },
  });

  const property = await prisma.property.findUniqueOrThrow({ where: { id }, include: listingInclude });
  return { ok: true, listing: toDashboardDto(property) };
}

export async function setListingCoverImage(
  id: string,
  imageId: string,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!canManageRecord(profile, existing)) return forbidden();
  if (!existing.images.some((i) => i.id === imageId)) {
    return { ok: false, error: "Image not found.", status: 404 };
  }

  await prisma.$transaction([
    prisma.propertyImage.updateMany({ where: { propertyId: id }, data: { isCover: false } }),
    prisma.propertyImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_COVER_CHANGED",
    entityType: "PROPERTY",
    entityId: id,
    newValues: { coverImageId: imageId },
  });

  const property = await prisma.property.findUniqueOrThrow({ where: { id }, include: listingInclude });
  return { ok: true, listing: toDashboardDto(property) };
}

// ── Public listings (no auth — ACTIVE only, safe fields only) ─────────────────

export type PublicListingFilters = {
  location?: string;
  propertyType?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  featured?: boolean;
};

export async function listPublicListings(
  filters: PublicListingFilters,
): Promise<{ listings: PublicListingDto[] }> {
  const where: Prisma.PropertyWhereInput = { status: PropertyStatus.ACTIVE };

  if (filters.location) {
    where.OR = [
      { location: { contains: filters.location, mode: "insensitive" } },
      { fullAddress: { contains: filters.location, mode: "insensitive" } },
      { city: { contains: filters.location, mode: "insensitive" } },
    ];
  }
  if (filters.propertyType && filters.propertyType !== "All") {
    where.type = filters.propertyType as Prisma.PropertyWhereInput["type"];
  }
  if (filters.transactionType === "SALE") {
    where.operationType = { in: ["SALE", "SALE_AND_RENT"] };
  } else if (filters.transactionType === "RENT") {
    where.operationType = { in: ["RENT", "SALE_AND_RENT"] };
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const range = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
    where.AND = [{ OR: [{ salePrice: range }, { rentPrice: range }] }];
  }
  if (filters.bedrooms !== undefined) where.bedrooms = { gte: filters.bedrooms };
  if (filters.bathrooms !== undefined) where.bathrooms = { gte: filters.bathrooms };
  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.areaSqft = {
      ...(filters.minArea !== undefined ? { gte: filters.minArea } : {}),
      ...(filters.maxArea !== undefined ? { lte: filters.maxArea } : {}),
    };
  }
  if (filters.amenities?.length) {
    where.amenities = { some: { amenity: { key: { in: filters.amenities } } } };
  }
  if (filters.featured) where.isFeatured = true;

  const properties = await prisma.property.findMany({
    where,
    include: listingInclude,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 100,
  });

  return { listings: properties.map(toPublicDto) };
}

/** Public-safe assigned agent info shown on the listing detail page. */
export type PublicListingAgent = {
  name: string;
  avatarUrl: string | null;
};

/**
 * Public: a single ACTIVE listing by slug, plus up to 3 similar ACTIVE
 * listings (same city/type first, newest fallback) and the assigned agent's
 * public info. Increments the view counter best-effort — a failed increment
 * never blocks the page. Wrapped in cache() so generateMetadata and the page
 * share one fetch (and one view increment) per request.
 */
export const getPublicListingBySlug = cache(async function getPublicListingBySlug(
  slug: string,
): Promise<{
  listing: PublicListingDto;
  similar: PublicListingDto[];
  agent: PublicListingAgent | null;
} | null> {
  const property = await prisma.property.findFirst({
    where: { slug, status: PropertyStatus.ACTIVE },
    include: listingInclude,
  });
  if (!property) return null;

  prisma.property
    .update({ where: { id: property.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => undefined);

  const [similar, agentProfile] = await Promise.all([
    prisma.property.findMany({
      where: {
        status: PropertyStatus.ACTIVE,
        id: { not: property.id },
        OR: [
          ...(property.city ? [{ city: property.city }] : []),
          { type: property.type },
        ],
      },
      include: listingInclude,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
    property.assignedAgentId
      ? prisma.profile.findUnique({
          where: { id: property.assignedAgentId },
          select: { fullName: true, avatarUrl: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    listing: toPublicDto(property),
    similar: similar.map(toPublicDto),
    agent: agentProfile?.fullName
      ? { name: agentProfile.fullName, avatarUrl: agentProfile.avatarUrl }
      : null,
  };
});

/**
 * Public: location suggestions for the search autocomplete — distinct
 * city/location values from ACTIVE listings matching the typed query.
 */
export async function listPublicLocationSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  const where: Prisma.PropertyWhereInput = { status: PropertyStatus.ACTIVE };
  if (q) {
    where.OR = [
      { location: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.property.findMany({
    where,
    select: { location: true, city: true },
    take: 50,
  });

  // Suggest values exactly as stored so a selected suggestion round-trips
  // through the `location` contains-filter.
  const lower = q.toLowerCase();
  const suggestions = new Set<string>();
  for (const row of rows) {
    if (row.city && (!lower || row.city.toLowerCase().includes(lower))) {
      suggestions.add(row.city);
    }
    if (!lower || row.location.toLowerCase().includes(lower)) {
      suggestions.add(row.location);
    }
  }
  return [...suggestions].slice(0, 8);
}
