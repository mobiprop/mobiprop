import { NextResponse } from "next/server";

import {
  addListingImages,
  removeListingImage,
  setListingCoverImage,
} from "@/features/listings/listing-actions";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * Staff (listings:uploadImages): add images to an existing listing.
 * Multipart form with `images` files. Optimized to WebP/2K before storage.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File);

  const result = await addListingImages(id, files);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, listing: result.listing });
}

/** Staff (listings:uploadImages): remove one image. Body: { imageId }. */
export async function DELETE(request: Request, { params }: Context) {
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
}

/** Staff (listings:uploadImages): set the cover image. Body: { imageId }. */
export async function PATCH(request: Request, { params }: Context) {
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
}
