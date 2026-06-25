import { NextResponse } from "next/server";

import { listLocationNameSuggestions } from "@/features/locations/location-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listLocationNameSuggestions();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, locations: result.locations });
}
