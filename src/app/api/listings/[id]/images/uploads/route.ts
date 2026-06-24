import { NextResponse } from "next/server";

import { prepareExistingListingUploads } from "@/features/listings/listing-actions";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * Staff (listings:uploadImages): mint signed upload URLs for adding images to
 * an existing listing. Body: { files: [{ name, type, size }] }. The browser
 * uploads directly to storage with the returned tickets, then calls
 * POST /api/listings/[id]/images with the image descriptors.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const result = await prepareExistingListingUploads(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, tickets: result.tickets });
}
