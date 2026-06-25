import { NextResponse } from "next/server";

import { listLocationsWithStats, createLocation } from "@/features/locations/location-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listLocationsWithStats();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, locations: result.locations });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createLocation(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, location: result.location }, { status: 201 });
}
