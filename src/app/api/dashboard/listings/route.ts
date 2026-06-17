import { NextResponse } from "next/server";

import { listDashboardListings } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

/**
 * Staff: full dashboard listings + metric cards. AGENT callers only receive
 * listings they created or are assigned to (record scoping in the action).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  const result = await listDashboardListings(search, limit);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    listings: result.listings,
    metrics: result.metrics,
  });
}
