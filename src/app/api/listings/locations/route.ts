import { NextResponse } from "next/server";

import { listPublicLocationSuggestions } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Public: location autocomplete suggestions for the property search — distinct
 * city/location values from ACTIVE listings matching `q`.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const locations = await listPublicLocationSuggestions(q);
  return NextResponse.json({ success: true, locations });
}
