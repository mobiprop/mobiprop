import { NextResponse } from "next/server";

import { setListingFeatured } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** ADMIN/MANAGER (listings:feature): toggle the featured flag. */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const result = await setListingFeatured(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
}
