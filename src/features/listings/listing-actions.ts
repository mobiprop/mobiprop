import "server-only";

import { cache } from "react";
import { randomUUID } from "crypto";
import type { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  notifyListingAssigned,
  notifyListingCreated,
  notifyListingDeleted,
  notifyListingStatusChanged,
  notifyLeadAssigned,
} from "@/features/notifications/server/notify-events";
import { hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { geocodeAddress } from "@/lib/maps";
import {
  mintPropertyImageUploadTickets,
  removePropertyImages,
  verifyUploadedPropertyImages,
  type PropertyImageUploadTicket,
} from "@/lib/supabase/storage";
import {
  createListingSchema,
  updateListingSchema,
  listingStatusSchema,
  listingFeaturedSchema,
  listingUploadTicketRequestSchema,
  listingImageDescriptorsSchema,
  LISTING_IMAGE_MAX_COUNT,
  type AmenityKey,
  type ListingImageDescriptor,
} from "@/schemas/listing.schema";
import { PropertyStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import type { Profile } from "@/generated/prisma/client";

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

/** Confirms an assignee is a real, active staff profile (not USER-role). */
async function validateAssignee(agentId: string): Promise<ListingActionError | null> {
  const agent = await prisma.profile.findUnique({ where: { id: agentId }, select: { status: true, role: true } });
  if (!agent || agent.role === UserRole.USER || agent.status !== UserStatus.ACTIVE) {
    return { ok: false, error: "Selected agent is not an active staff member.", status: 422 };
  }
  return null;
}

/** Confirms a locationId references a real row in the Locations sector. */
async function validateLocationId(locationId: string): Promise<ListingActionError | null> {
  const location = await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } });
  if (!location) {
    return { ok: false, error: "Selected location was not found. Please pick one from the list.", status: 422 };
  }
  return null;
}

/** Confirms an owner-contact id references a real, non-deleted Contact. */
async function validateOwnerContact(contactId: string): Promise<ListingActionError | null> {
  const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { isDeleted: true } });
  if (!contact || contact.isDeleted) {
    return { ok: false, error: "Selected owner contact was not found.", status: 422 };
  }
  return null;
}

/** Sets/replaces the OWNER ContactProperty link for a listing (one OWNER row per property). */
async function syncOwnerContact(propertyId: string, ownerContactId: string | null): Promise<void> {
  await prisma.contactProperty.deleteMany({ where: { propertyId, role: "OWNER" } });
  if (ownerContactId) {
    await prisma.contactProperty.upsert({
      where: { contactId_propertyId: { contactId: ownerContactId, propertyId } },
      create: { contactId: ownerContactId, propertyId, role: "OWNER" },
      update: { role: "OWNER" },
    });
  }
}

// ── Record-level access ───────────────────────────────────────────────────────

type PropertyRecord = { createdById: string | null; assignedAgentId: string | null };

/**
 * ADMIN manages every listing. MANAGER manages their own + their team's
 * (agents whose teamLeaderId points to them). AGENT only listings they
 * created or are assigned to. Called after the role-level permission check
 * passed.
 */
async function canManageRecord(profile: Profile, property: PropertyRecord): Promise<boolean> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return true;
  return (
    (property.createdById !== null && scopeIds.includes(property.createdById)) ||
    (property.assignedAgentId !== null && scopeIds.includes(property.assignedAgentId))
  );
}

/** Prisma `where` scoping listings a profile may see; unrestricted for ADMIN. */
async function recordScope(profile: Profile): Promise<Prisma.PropertyWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return {};
  return { OR: [{ createdById: { in: scopeIds } }, { assignedAgentId: { in: scopeIds } }] };
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

const listingInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  amenities: { include: { amenity: true } },
  contacts: {
    where: { role: "OWNER" },
    take: 1,
    include: { contact: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.PropertyInclude;

type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof listingInclude }>;

function toImageDto(image: PropertyWithRelations["images"][number]): ListingImageDto {
  return {
    id: image.id,
    url: image.url,
    sortOrder: image.sortOrder,
    isCover: image.isCover,
    altText: image.altText,
    width: image.width,
    height: image.height,
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
    saleCurrency: property.saleCurrency,
    rentCurrency: property.rentCurrency,
    location: property.location,
    locationId: property.locationId,
    fullAddress: property.fullAddress,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    toilets: property.toilets,
    totalAreaM2: property.totalAreaM2,
    coveredAreaM2: property.coveredAreaM2,
    semiCoveredAreaM2: property.semiCoveredAreaM2,
    lotSizeM2: property.lotSizeM2,
    lotFrontageM2: property.lotFrontageM2,
    lotDepthM2: property.lotDepthM2,
    yearBuilt: property.yearBuilt,
    isFeatured: property.isFeatured,
    videoUrl: property.videoUrl,
    viewsCount: property.viewsCount,
    assignedAgentId: property.assignedAgentId,
    createdById: property.createdById,
    publishedAt: property.publishedAt?.toISOString() ?? null,
    createdAt: property.createdAt.toISOString(),
    amenities: property.amenities.map((a) => a.amenity.key as AmenityKey),
    images: property.images.map(toImageDto),
    coverImageUrl: coverUrl(property.images),
    ownerContact: property.contacts[0]
      ? {
          id: property.contacts[0].contact.id,
          fullName: `${property.contacts[0].contact.firstName} ${property.contacts[0].contact.lastName}`.trim(),
        }
      : null,
  };
}

function toPublicDto(property: PropertyWithRelations): PublicListingDto {
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
    saleCurrency: property.saleCurrency,
    rentCurrency: property.rentCurrency,
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
    totalAreaM2: property.totalAreaM2,
    coveredAreaM2: property.coveredAreaM2,
    semiCoveredAreaM2: property.semiCoveredAreaM2,
    lotSizeM2: property.lotSizeM2,
    lotFrontageM2: property.lotFrontageM2,
    lotDepthM2: property.lotDepthM2,
    parkingSpaces: property.parkingSpaces,
    yearBuilt: property.yearBuilt,
    floors: property.floors,
    isFeatured: property.isFeatured,
    videoUrl: property.videoUrl,
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

// ── Signed upload tickets (browser uploads directly to storage) ───────────────

/** Trimmed ticket shape returned to the browser to drive the direct upload. */
export type ClientUploadTicket = { imageId: string; storagePath: string; token: string };

function toClientTickets(tickets: PropertyImageUploadTicket[]): ClientUploadTicket[] {
  return tickets.map((t) => ({ imageId: t.imageId, storagePath: t.storagePath, token: t.token }));
}

/** Appends the underlying cause to an error message outside production only. */
function withDevDetail(message: string, error: unknown): string {
  if (process.env.NODE_ENV === "production") return message;
  const detail = error instanceof Error ? error.message : String(error);
  return `${message} (${detail})`;
}

/** Staff (listings:create): mint upload URLs for a not-yet-created listing. */
export async function prepareNewListingUploads(
  input: unknown,
): Promise<ListingActionResult<{ propertyId: string; tickets: ClientUploadTicket[] }>> {
  const gate = await requirePermission("listings:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = listingUploadTicketRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };

  const propertyId = randomUUID();
  try {
    const tickets = await mintPropertyImageUploadTickets(propertyId, parsed.data.files);
    return { ok: true, propertyId, tickets: toClientTickets(tickets) };
  } catch (error) {
    console.error("[listings] failed to mint upload tickets", error);
    return {
      ok: false,
      error: withDevDetail("Failed to prepare image upload. Please try again.", error),
      status: 500,
    };
  }
}

/** Staff (listings:uploadImages): mint upload URLs for an existing listing. */
export async function prepareExistingListingUploads(
  id: string,
  input: unknown,
): Promise<ListingActionResult<{ tickets: ClientUploadTicket[] }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!(await canManageRecord(gate.profile, existing))) return forbidden();

  const parsed = listingUploadTicketRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error), status: 400 };

  if (existing.images.length + parsed.data.files.length > LISTING_IMAGE_MAX_COUNT) {
    return { ok: false, error: `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`, status: 400 };
  }

  try {
    const tickets = await mintPropertyImageUploadTickets(id, parsed.data.files);
    return { ok: true, tickets: toClientTickets(tickets) };
  } catch (error) {
    console.error("[listings] failed to mint upload tickets", error);
    return {
      ok: false,
      error: withDevDetail("Failed to prepare image upload. Please try again.", error),
      status: 500,
    };
  }
}

// ── Uploaded-image confirmation ───────────────────────────────────────────────

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

function formatForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpeg";
  return "webp";
}

/**
 * Confirms the browser-uploaded objects exist in storage (authoritative
 * size/type read there, never trusted from the client) and builds the rows to
 * persist. Order follows the descriptors so cover/sort indices stay correct.
 */
async function confirmUploadedImages(
  propertyId: string,
  descriptors: ListingImageDescriptor[],
): Promise<UploadedImage[]> {
  const verified = await verifyUploadedPropertyImages(
    propertyId,
    descriptors.map((d) => d.storagePath),
  );
  return descriptors.map((descriptor, index) => {
    const object = verified[index];
    return {
      id: descriptor.imageId,
      url: object.url,
      storagePath: object.storagePath,
      originalFileName: descriptor.originalFileName,
      mimeType: object.mimeType,
      sizeBytes: object.sizeBytes,
      width: descriptor.width ?? null,
      height: descriptor.height ?? null,
      format: formatForMime(object.mimeType),
    };
  });
}

/**
 * The plan requires an audit entry whenever an image couldn't be converted to
 * WebP in the browser and the original format was stored instead.
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

// ── Create ────────────────────────────────────────────────────────────────────

export async function createListing(
  input: unknown,
  propertyId: string | null,
  images: unknown,
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

  const descriptorsParsed = listingImageDescriptorsSchema.safeParse(images);
  if (!descriptorsParsed.success) {
    return { ok: false, error: firstIssueMessage(descriptorsParsed.error), status: 400 };
  }
  const descriptors = descriptorsParsed.data;

  if (data.isFeatured && !hasPermission(profile.role, "listings:feature")) {
    return { ok: false, error: "You don't have permission to feature listings.", status: 403 };
  }

  if (data.assignedAgentId && !hasPermission(profile.role, "listings:assign")) {
    return { ok: false, error: "You don't have permission to assign a listing agent.", status: 403 };
  }
  if (data.assignedAgentId) {
    const assigneeError = await validateAssignee(data.assignedAgentId);
    if (assigneeError) return assigneeError;
  }

  if (data.ownerContactId) {
    const ownerError = await validateOwnerContact(data.ownerContactId);
    if (ownerError) return ownerError;
  }

  const locationError = await validateLocationId(data.locationId);
  if (locationError) return locationError;

  if (descriptors.length === 0 && data.status !== PropertyStatus.DRAFT) {
    return { ok: false, error: "At least one image is required to publish a listing.", status: 400 };
  }
  // Images present means the client minted tickets under a server-issued
  // propertyId; reuse it so the stored object paths line up. Empty galleries
  // (drafts) just need a fresh id.
  if (descriptors.length > 0 && !propertyId) {
    return { ok: false, error: "Missing upload reference. Please re-add the images.", status: 400 };
  }
  const listingPropertyId = propertyId ?? randomUUID();

  let uploaded: UploadedImage[];
  try {
    uploaded = await confirmUploadedImages(listingPropertyId, descriptors);
  } catch (error) {
    console.error("[listings] image confirmation failed", error);
    await removePropertyImages(descriptors.map((d) => d.storagePath));
    return { ok: false, error: "Image upload failed. Please try again.", status: 400 };
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
            id: listingPropertyId,
            listingId,
            slug: `${slugify(data.title)}-${listingId.toLowerCase()}`,
            title: data.title,
            description: data.description,
            type: data.type,
            status: data.status,
            operationType: data.operationType,
            salePrice: data.salePrice,
            rentPrice: data.rentPrice,
            saleCurrency: data.saleCurrency,
            rentCurrency: data.rentCurrency,
            location: data.location,
            locationId: data.locationId,
            fullAddress: data.fullAddress,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            toilets: data.toilets,
            totalAreaM2: data.totalAreaM2,
            coveredAreaM2: data.coveredAreaM2,
            semiCoveredAreaM2: data.semiCoveredAreaM2,
            lotSizeM2: data.lotSizeM2,
            lotFrontageM2: data.lotFrontageM2,
            lotDepthM2: data.lotDepthM2,
            yearBuilt: data.yearBuilt,
            isFeatured: data.isFeatured,
            videoUrl: data.videoUrl || null,
            assignedAgentId: data.assignedAgentId || null,
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

    if (data.ownerContactId) {
      await syncOwnerContact(property.id, data.ownerContactId);
      await logActivity({
        actorId: profile.id,
        action: "CONTACT_PROPERTY_LINKED",
        entityType: "CONTACT",
        entityId: data.ownerContactId,
        newValues: { propertyId: property.id, role: "OWNER" },
      });
      property = await prisma.property.findUniqueOrThrow({ where: { id: property.id }, include: listingInclude });
    }

    await notifyListingCreated({
      propertyId: property.id,
      title: property.title,
      listingId: property.listingId,
      actorId: profile.id,
      actorName: profile.fullName ?? profile.email,
    });

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

  const scope = await recordScope(gate.profile);
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

  try {
    const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
    if (!existing) return notFound();
    if (!(await canManageRecord(profile, existing))) return forbidden();

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

    if (data.locationId !== undefined && data.locationId !== existing.locationId) {
      const locationError = await validateLocationId(data.locationId);
      if (locationError) return locationError;
    }

    const {
      amenities,
      assignedAgentId: assignedAgentIdInput,
      videoUrl: videoUrlInput,
      ownerContactId: ownerContactIdInput,
      ...fields
    } = data;

    // "" means "clear the video" — store null rather than an empty string.
    const videoUrl = videoUrlInput === undefined ? undefined : videoUrlInput === "" ? null : videoUrlInput;

    let assignedAgentId: string | null | undefined;
    if (assignedAgentIdInput !== undefined && assignedAgentIdInput !== (existing.assignedAgentId ?? "")) {
      if (!hasPermission(profile.role, "listings:assign")) {
        return { ok: false, error: "You don't have permission to assign a listing agent.", status: 403 };
      }
      if (assignedAgentIdInput === "") {
        assignedAgentId = null;
      } else {
        const assigneeError = await validateAssignee(assignedAgentIdInput);
        if (assigneeError) return assigneeError;
        assignedAgentId = assignedAgentIdInput;
      }
    }

    const existingOwnerContactId = existing.contacts[0]?.contact.id ?? "";
    let ownerContactChanged = false;
    if (ownerContactIdInput !== undefined && ownerContactIdInput !== existingOwnerContactId) {
      if (ownerContactIdInput) {
        const ownerError = await validateOwnerContact(ownerContactIdInput);
        if (ownerError) return ownerError;
      }
      ownerContactChanged = true;
    }

    // Re-geocode when the address changed (best-effort, never blocks the save).
    const addressChanged =
      (data.fullAddress !== undefined && data.fullAddress !== existing.fullAddress) ||
      (data.location !== undefined && data.location !== existing.location);
    const coords = addressChanged
      ? await geocodeAddress(
          `${data.fullAddress ?? existing.fullAddress}, ${data.location ?? existing.location}`,
        )
      : null;

    let property = await prisma.property.update({
      where: { id },
      data: {
        ...fields,
        ...(assignedAgentId !== undefined ? { assignedAgentId } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
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

    if (ownerContactChanged) {
      await syncOwnerContact(id, ownerContactIdInput || null);
      await logActivity({
        actorId: profile.id,
        action: ownerContactIdInput ? "CONTACT_PROPERTY_LINKED" : "CONTACT_PROPERTY_UNLINKED",
        entityType: "CONTACT",
        entityId: ownerContactIdInput || existingOwnerContactId,
        oldValues: { propertyId: id, ownerContactId: existingOwnerContactId || null },
        newValues: { propertyId: id, ownerContactId: ownerContactIdInput || null },
      });
      property = await prisma.property.findUniqueOrThrow({ where: { id }, include: listingInclude });
    }

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
    if (assignedAgentId !== undefined && assignedAgentId !== existing.assignedAgentId) {
      oldValues.assignedAgentId = existing.assignedAgentId;
      newValues.assignedAgentId = assignedAgentId;
    }
    if (videoUrl !== undefined && videoUrl !== existing.videoUrl) {
      oldValues.videoUrl = existing.videoUrl;
      newValues.videoUrl = videoUrl;
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
      await notifyListingStatusChanged({
        propertyId: property.id,
        title: property.title,
        listingId: property.listingId,
        status: String(property.status),
        actorId: profile.id,
        actorName: profile.fullName ?? profile.email,
      });
    }

    // Best-effort: notify the agent when the listing's assigned agent changes.
    if (
      property.assignedAgentId &&
      property.assignedAgentId !== existing.assignedAgentId
    ) {
      await notifyListingAssigned({
        propertyId: property.id,
        assignedAgentId: property.assignedAgentId,
        actorId: profile.id,
      });

      // Backfill: any of this listing's leads that are still unassigned
      // inherit the newly-assigned agent. Leads already manually assigned to
      // someone else are left untouched.
      const newAgentId = property.assignedAgentId;
      const unassignedLeads = await prisma.lead.findMany({
        where: {
          primaryListingId: property.id,
          assignedAgentId: null,
          isArchived: false,
          lifecycleStatus: { notIn: ["CONVERTED", "CLOSED", "UNQUALIFIED"] },
        },
        select: { id: true },
      });
      if (unassignedLeads.length > 0) {
        await prisma.lead.updateMany({
          where: { id: { in: unassignedLeads.map((l) => l.id) } },
          data: { assignedAgentId: newAgentId },
        });
        await prisma.leadActivity.createMany({
          data: unassignedLeads.map((l) => ({
            leadId: l.id,
            actorId: profile.id,
            type: "LEAD_ASSIGNED",
            fieldName: "assignedAgentId",
            oldValue: Prisma.JsonNull,
            newValue: newAgentId as Prisma.InputJsonValue,
          })),
        });
        await Promise.all(
          unassignedLeads.map((l) =>
            notifyLeadAssigned({
              leadId: l.id,
              assignedAgentId: newAgentId,
              previousAgentId: null,
              isReassign: false,
              actorId: profile.id,
            }),
          ),
        );
      }
    }

    return { ok: true, listing: toDashboardDto(property) };
  } catch (error) {
    console.error("[listings] update failed", error);
    return { ok: false, error: "Failed to update listing. Please try again.", status: 500 };
  }
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
  if (!(await canManageRecord(profile, existing))) return forbidden();

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
  await notifyListingStatusChanged({
    propertyId: id,
    title: property.title,
    listingId: property.listingId,
    status: String(property.status),
    actorId: profile.id,
    actorName: profile.fullName ?? profile.email,
  });

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
  if (!(await canManageRecord(profile, existing))) return forbidden();

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
  await notifyListingDeleted({
    propertyId: id,
    title: existing.title,
    listingId: existing.listingId,
    actorId: profile.id,
    actorName: profile.fullName ?? profile.email,
  });

  return { ok: true };
}

// ── Images (add / remove / cover) ─────────────────────────────────────────────

export async function addListingImages(
  id: string,
  images: unknown,
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!(await canManageRecord(profile, existing))) return forbidden();

  const descriptorsParsed = listingImageDescriptorsSchema.safeParse(images);
  if (!descriptorsParsed.success) {
    return { ok: false, error: firstIssueMessage(descriptorsParsed.error), status: 400 };
  }
  const descriptors = descriptorsParsed.data;

  if (descriptors.length === 0) return { ok: false, error: "No images were provided.", status: 400 };
  if (existing.images.length + descriptors.length > LISTING_IMAGE_MAX_COUNT) {
    return { ok: false, error: `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`, status: 400 };
  }

  let uploaded: UploadedImage[];
  try {
    uploaded = await confirmUploadedImages(id, descriptors);
  } catch (error) {
    console.error("[listings] image confirmation failed", error);
    await removePropertyImages(descriptors.map((d) => d.storagePath));
    return { ok: false, error: "Image upload failed. Please try again.", status: 400 };
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
  if (!(await canManageRecord(profile, existing))) return forbidden();

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
  if (!(await canManageRecord(profile, existing))) return forbidden();
  if (!existing.images.some((i) => i.id === imageId)) {
    return { ok: false, error: "Image not found.", status: 404 };
  }

  // Interactive transaction with explicit sequential awaits — not the
  // batch-array `$transaction([a, b])` form. A transaction pins every
  // operation to one shared connection, and the array form has been observed
  // dispatching its operations concurrently on that connection (node-postgres
  // then logs "Calling client.query() when the client is already executing a
  // query"). Awaiting one at a time inside the callback guarantees they never
  // overlap.
  await prisma.$transaction(async (tx) => {
    await tx.propertyImage.updateMany({ where: { propertyId: id }, data: { isCover: false } });
    await tx.propertyImage.update({ where: { id: imageId }, data: { isCover: true } });
  });

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

/** Staff (listings:uploadImages): persist a new display order for a listing's images. */
export async function reorderListingImages(
  id: string,
  imageIds: string[],
): Promise<ListingActionResult<{ listing: DashboardListingDto }>> {
  const gate = await requirePermission("listings:uploadImages");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };
  const { profile } = gate;

  const existing = await prisma.property.findUnique({ where: { id }, include: listingInclude });
  if (!existing) return notFound();
  if (!(await canManageRecord(profile, existing))) return forbidden();

  const existingIds = new Set(existing.images.map((i) => i.id));
  const isCompleteReorder =
    imageIds.length === existing.images.length &&
    new Set(imageIds).size === imageIds.length &&
    imageIds.every((imageId) => existingIds.has(imageId));

  if (!isCompleteReorder) {
    return { ok: false, error: "Image order must include every image exactly once.", status: 400 };
  }

  // Interactive transaction, sequential awaits — see the comment in
  // setListingCoverImage above for why not the batch-array `$transaction([...])` form.
  await prisma.$transaction(async (tx) => {
    for (const [index, imageId] of imageIds.entries()) {
      await tx.propertyImage.update({ where: { id: imageId }, data: { sortOrder: index } });
    }
  });

  await logActivity({
    actorId: profile.id,
    action: "PROPERTY_IMAGES_REORDERED",
    entityType: "PROPERTY",
    entityId: id,
    newValues: { order: imageIds },
  });

  const property = await prisma.property.findUniqueOrThrow({ where: { id }, include: listingInclude });
  return { ok: true, listing: toDashboardDto(property) };
}

// ── Public listings (no auth — ACTIVE only, safe fields only) ─────────────────

export type PublicListingFilters = {
  sort?: "recent" | "oldest";
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
  /** 1-based. Omit for callers that just want "all matching" (e.g. the map). */
  page?: number;
  /** Defaults to 500 — comfortably above current inventory — for callers
   *  that don't paginate. The listings grid passes its real page size. */
  pageSize?: number;
};

export async function listPublicListings(
  filters: PublicListingFilters,
): Promise<{ listings: PublicListingDto[]; total: number }> {
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
    where.totalAreaM2 = {
      ...(filters.minArea !== undefined ? { gte: filters.minArea } : {}),
      ...(filters.maxArea !== undefined ? { lte: filters.maxArea } : {}),
    };
  }
  if (filters.amenities?.length) {
    where.amenities = { some: { amenity: { key: { in: filters.amenities } } } };
  }
  if (filters.featured) where.isFeatured = true;

  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 500;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: listingInclude,
      orderBy: filters.sort ? [{ publishedAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }] : [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return { listings: properties.map(toPublicDto), total };
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
 * Public: location suggestions for the search autocomplete — names from the
 * master Locations table matching the typed query, so a location is
 * searchable as soon as it's added, before any property is listed under it.
 */
export async function listPublicLocationSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  const where: Prisma.LocationWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { region: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const rows = await prisma.location.findMany({
    where,
    select: { name: true },
    orderBy: { name: "asc" },
    take: 8,
  });

  return rows.map((row) => row.name);
}
