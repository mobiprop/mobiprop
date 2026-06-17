import { NextResponse } from "next/server";
import { unsaveListing } from "@/features/listings/saved-actions";

export const runtime = "nodejs";

/** Removes a listing from the current user's saved list. Requires authentication. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await params;

  const result = await unsaveListing(propertyId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
