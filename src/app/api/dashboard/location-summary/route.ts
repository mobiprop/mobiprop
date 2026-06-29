import { NextResponse } from "next/server";

import { getLocationSummary } from "@/features/dashboard/dashboard-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getLocationSummary();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, locations: result.locations });
}
