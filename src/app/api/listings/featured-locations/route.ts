import { NextResponse } from "next/server";

import { listPublicFeaturedLocations } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Public: the locations with the most ACTIVE inventory, each with a
 * representative cover photo — powers the homepage "Featured Spots" section.
 */
export async function GET() {
  const locations = await listPublicFeaturedLocations(5);
  return NextResponse.json({ success: true, locations });
}
