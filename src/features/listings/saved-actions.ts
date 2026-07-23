"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type SavedActionResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export type SavedListingsResult =
  | { ok: true; savedIds: string[] }
  | { ok: false; error: string; status: number };

export async function getSavedListingIds(): Promise<SavedListingsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: true, savedIds: [] };

  const rows = await prisma.savedProperty.findMany({
    where: { profileId: user.id },
    select: { propertyId: true },
  });

  return { ok: true, savedIds: rows.map((r) => r.propertyId) };
}

export async function saveListing(propertyId: string): Promise<SavedActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthenticated", status: 401 };
  if (!propertyId) return { ok: false, error: "Missing propertyId", status: 400 };

  await prisma.savedProperty.upsert({
    where: { profileId_propertyId: { profileId: user.id, propertyId } },
    create: { profileId: user.id, propertyId },
    update: {},
  });

  return { ok: true };
}

export async function unsaveListing(propertyId: string): Promise<SavedActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthenticated", status: 401 };
  if (!propertyId) return { ok: false, error: "Missing propertyId", status: 400 };

  await prisma.savedProperty.deleteMany({
    where: { profileId: user.id, propertyId },
  });

  return { ok: true };
}

export async function getSavedListings() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Unauthenticated", status: 401 };

  const saved = await prisma.savedProperty.findMany({
    where: { profileId: user.id },
    orderBy: { createdAt: "desc" },
    select: { propertyId: true, createdAt: true },
  });

  if (saved.length === 0) return { ok: true as const, listings: [] };

  const propertyIds = saved.map((s) => s.propertyId);
  const properties = await prisma.property.findMany({
    where: { listingId: { in: propertyIds } },
    include: { images: { where: { isCover: true }, take: 1 } },
  });

  // Key by listingId because that's what's stored in saved_properties.property_id
  const byId = new Map(properties.map((p) => [p.listingId, p]));

  const listings = saved
    .map((s) => {
      const p = byId.get(s.propertyId);
      if (!p) return null;
      return {
        id: p.listingId, // used by delete route — must match what was saved
        slug: p.slug,
        title: p.title,
        location: p.location,
        type: p.type as string,
        operationType: p.operationType as string,
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        rentPrice: p.rentPrice ? Number(p.rentPrice) : null,
        saleCurrency: p.saleCurrency,
        rentCurrency: p.rentCurrency,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        totalAreaM2: p.totalAreaM2,
        coverImageUrl: p.images[0]?.url ?? null,
        savedAt: s.createdAt.toISOString(),
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  return { ok: true as const, listings };
}
