import { NextResponse } from "next/server";

import { deleteListing, updateListing } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * Staff: update listing fields/amenities. Authorization + record-level access
 * (AGENT → own/assigned only) enforced inside updateListing.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const result = await updateListing(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
}

/** ADMIN only (listings:delete): hard delete a listing and its stored images. */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;

  const result = await deleteListing(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
