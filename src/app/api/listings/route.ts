import { NextResponse } from "next/server";

import {
  createListing,
  listPublicListings,
  type PublicListingFilters,
} from "@/features/listings/listing-actions";

export const runtime = "nodejs";

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key);
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Public: ACTIVE listings with safe fields only (no auth required). Supports
 * the public search filters; internal/CRM fields are never returned.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const filters: PublicListingFilters = {
    location: params.get("location") ?? undefined,
    propertyType: params.get("propertyType") ?? undefined,
    transactionType: params.get("transactionType") ?? undefined,
    minPrice: numberParam(params, "minPrice"),
    maxPrice: numberParam(params, "maxPrice"),
    bedrooms: numberParam(params, "bedrooms"),
    bathrooms: numberParam(params, "bathrooms"),
    minArea: numberParam(params, "minArea"),
    maxArea: numberParam(params, "maxArea"),
    amenities: params.getAll("amenities"),
    featured: params.get("featured") === "true",
  };

  const result = await listPublicListings(filters);
  return NextResponse.json({ success: true, listings: result.listings });
}

/**
 * Staff: create a listing. JSON body — `data` is the listing fields, `images`
 * the descriptors of objects already uploaded directly to storage (under the
 * server-issued `propertyId` from POST /api/listings/uploads), `coverIndex`
 * which image is the cover. The image bytes never pass through this function,
 * so there is no request-body size limit. Authorization is enforced inside
 * createListing via requirePermission("listings:create").
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const propertyId = typeof body.propertyId === "string" ? body.propertyId : null;
  const coverIndex = Number(body.coverIndex ?? 0);

  const result = await createListing(
    body.data,
    propertyId,
    body.images,
    Number.isFinite(coverIndex) ? coverIndex : 0,
  );
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
}
