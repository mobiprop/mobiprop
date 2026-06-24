import { NextResponse } from "next/server";

import { prepareNewListingUploads } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Staff (listings:create): mint signed upload URLs for a not-yet-created
 * listing. Body: { files: [{ name, type, size }] }. Returns a server-issued
 * `propertyId` plus one upload ticket per file. The browser uploads each file
 * directly to storage with these tickets, then calls POST /api/listings with
 * the resulting image descriptors and the same `propertyId`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const result = await prepareNewListingUploads(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, propertyId: result.propertyId, tickets: result.tickets });
}
