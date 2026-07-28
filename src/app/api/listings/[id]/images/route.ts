import { NextResponse } from "next/server";

import {
  addListingImages,
  removeListingImage,
  setListingCoverImage,
  reorderListingImages,
} from "@/features/listings/listing-actions";
import { withApiErrorHandling } from "@/lib/api-route";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * Staff (listings:uploadImages): add images to an existing listing. JSON body
 * { images: descriptors } for objects already uploaded directly to storage via
 * POST /api/listings/[id]/images/uploads. The bytes never pass through this
 * function, so there is no request-body size limit.
 */
export const POST = withApiErrorHandling("listings.images.add", async (request: Request, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const result = await addListingImages(id, body?.images);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
});

/** Staff (listings:uploadImages): remove one image. Body: { imageId }. */
export const DELETE = withApiErrorHandling("listings.images.remove", async (request: Request, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const imageId = typeof body?.imageId === "string" ? body.imageId : null;
  if (!imageId) {
    return NextResponse.json({ success: false, error: "imageId is required" }, { status: 400 });
  }

  const result = await removeListingImage(id, imageId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
});

/** Staff (listings:uploadImages): set the cover image. Body: { imageId }. */
export const PATCH = withApiErrorHandling("listings.images.setCover", async (request: Request, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const imageId = typeof body?.imageId === "string" ? body.imageId : null;
  if (!imageId) {
    return NextResponse.json({ success: false, error: "imageId is required" }, { status: 400 });
  }

  const result = await setListingCoverImage(id, imageId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
});

/** Staff (listings:uploadImages): persist a new image order. Body: { imageIds: string[] }. */
export const PUT = withApiErrorHandling("listings.images.reorder", async (request: Request, { params }: Context) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const imageIds =
    Array.isArray(body?.imageIds) && body.imageIds.every((value: unknown) => typeof value === "string")
      ? (body.imageIds as string[])
      : null;
  if (!imageIds) {
    return NextResponse.json({ success: false, error: "imageIds must be an array of strings" }, { status: 400 });
  }

  const result = await reorderListingImages(id, imageIds);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
});
