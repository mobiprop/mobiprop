import "server-only";

import sharp from "sharp";

// Confirmed project decision: property images are optimized to WebP at a 2K
// target resolution (max 2048px long edge, quality ~80) before storage.
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 80;

export type OptimizedImage = {
  buffer: Buffer;
  width: number | null;
  height: number | null;
  format: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
};

/**
 * Resize (max 2K, never enlarged), auto-rotate per EXIF, and convert to WebP.
 * If optimization fails (corrupt-but-accepted file, unsupported variant), fall
 * back to storing the validated original — per the plan's phase-1 fallback —
 * so an upload never fails just because the optimizer choked.
 */
export async function optimizeListingImage(file: File): Promise<OptimizedImage> {
  const input = Buffer.from(await file.arrayBuffer());

  try {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      format: "webp",
      mimeType: "image/webp",
      extension: "webp",
      sizeBytes: data.length,
    };
  } catch (error) {
    console.error("[images] optimization failed, storing validated original", error);

    const metadata = await sharp(input)
      .metadata()
      .catch(() => null);
    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

    return {
      buffer: input,
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
      format: metadata?.format ?? extension,
      mimeType: file.type || "image/jpeg",
      extension,
      sizeBytes: input.length,
    };
  }
}
