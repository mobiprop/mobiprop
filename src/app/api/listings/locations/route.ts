import { NextResponse } from "next/server";

import { listPublicLocationSuggestions } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Public: location autocomplete suggestions for the property search — names
 * from the master Locations table matching `q`.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const locations = await listPublicLocationSuggestions(q);
  return NextResponse.json({ success: true, locations });
}
