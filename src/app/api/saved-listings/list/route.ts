import { NextResponse } from "next/server";
import { getSavedListings } from "@/features/listings/saved-actions";

export const runtime = "nodejs";

/** Returns the current user's saved listings with full card data. */
export async function GET() {
  const result = await getSavedListings();
  if (!result.ok) {
    return NextResponse.json({ listings: [] });
  }
  return NextResponse.json({ listings: result.listings });
}
