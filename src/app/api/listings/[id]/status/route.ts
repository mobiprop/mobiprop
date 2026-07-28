import { NextResponse } from "next/server";

import { setListingStatus } from "@/features/listings/listing-actions";
import { withApiErrorHandling } from "@/lib/api-route";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** Staff (listings:pause): pause/activate or mark rented/sold/draft. */
export const PATCH = withApiErrorHandling("listings.status", async (request: Request, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const result = await setListingStatus(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
});
