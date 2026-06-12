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
 * Staff: create a listing. Multipart form — `data` is the JSON listing fields,
 * `images` the files, `coverIndex` which image is the cover. Authorization is
 * enforced inside createListing via requirePermission("listings:create").
 */
export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  let data: unknown;
  try {
    data = JSON.parse(String(formData.get("data") ?? "null"));
  } catch {
    return NextResponse.json({ success: false, error: "Invalid listing data" }, { status: 400 });
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  const coverIndex = Number(formData.get("coverIndex") ?? 0);

  const result = await createListing(data, files, Number.isFinite(coverIndex) ? coverIndex : 0);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
}
