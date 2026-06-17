import { NextResponse } from "next/server";
import { getSavedListingIds, saveListing } from "@/features/listings/saved-actions";

export const runtime = "nodejs";

/** Returns the current user's saved property IDs (empty array for guests). */
export async function GET() {
  const result = await getSavedListingIds();
  if (!result.ok) {
    return NextResponse.json({ savedIds: [] });
  }
  return NextResponse.json({ savedIds: result.savedIds });
}

/** Saves a listing for the current user. Requires authentication. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;

  if (!propertyId) {
    return NextResponse.json({ success: false, error: "Missing propertyId" }, { status: 400 });
  }

  const result = await saveListing(propertyId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
