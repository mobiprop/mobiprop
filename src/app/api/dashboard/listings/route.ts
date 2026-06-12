import { NextResponse } from "next/server";

import { listDashboardListings } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Staff: full dashboard listings + metric cards. AGENT callers only receive
 * listings they created or are assigned to (record scoping in the action).
 */
export async function GET() {
  const result = await listDashboardListings();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    listings: result.listings,
    metrics: result.metrics,
  });
}
