// Client-side image optimization. Runs in the browser before upload so we store
// reasonably-sized WebP files instead of multi-MB originals — saving storage
// and making listing pages fast. The bytes are uploaded directly to storage via
// signed URLs, so this is about quality/size, not the request-body limit.

// Mirror the (former) server pipeline: 2K long edge.
const MAX_DIMENSION = 2048;
// Slightly lower than a print-quality q90 — imperceptible at 2K on web, much
// smaller files. Default for listing photos; callers may pass a different
// quality (e.g. chat attachments use CHAT_WEBP_QUALITY below).
const WEBP_QUALITY = 0.82;
/** Chat attachments: WebP at 90% quality, per product decision. */
export const CHAT_WEBP_QUALITY = 0.9;

export type OptimizedUpload = {
  /** The file to upload — WebP when conversion succeeded, else the original. */
  file: File;
  width: number | null;
  height: number | null;
};

/**
 * Resize (max 2K long edge, never enlarged), honor EXIF orientation, and encode
 * to WebP — entirely in the browser. If the browser can't decode/encode the
 * image, or the result isn't smaller, the original file is returned unchanged.
 */
export async function optimizeImageForUpload(file: File, quality: number = WEBP_QUALITY): Promise<OptimizedUpload> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return { file, width: null, height: null };
  }

  let bitmap: ImageBitmap | null = null;
  try {
    // `from-image` applies EXIF rotation so portrait phone photos aren't sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, width: bitmap.width, height: bitmap.height };
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    // toBlob can return null (no WebP encoder), or something larger than the
    // original (already-small WebP). Keep the original then.
    if (!blob || blob.size >= file.size) {
      return { file, width: bitmap.width, height: bitmap.height };
    }

    const name = file.name.replace(/\.[^./\\]+$/, "") + ".webp";
    const optimized = new File([blob], name, { type: "image/webp", lastModified: Date.now() });
    return { file: optimized, width: targetWidth, height: targetHeight };
  } catch {
    // Corrupt-but-accepted file, unsupported variant, OOM, etc. — upload the
    // original as-is.
    return { file, width: null, height: null };
  } finally {
    bitmap?.close();
  }
}

/** Optimize many files with bounded concurrency to avoid memory spikes. */
export async function optimizeImagesForUpload(files: File[], quality: number = WEBP_QUALITY): Promise<OptimizedUpload[]> {
  const CONCURRENCY = 3;
  const results = new Array<OptimizedUpload>(files.length);
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const index = cursor++;
      results[index] = await optimizeImageForUpload(files[index], quality);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
  return results;
}
