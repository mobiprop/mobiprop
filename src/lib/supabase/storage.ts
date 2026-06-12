import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OptimizedImage } from "@/lib/images";

const AVATAR_BUCKET = "avatars";
const PROPERTY_IMAGES_BUCKET = "property-images";

/**
 * Uploads a new avatar for the user, replacing any existing one so a user
 * never has more than one stored profile picture at a time.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createAdminClient();

  await removeAvatar(userId);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Cache-bust so the new image shows immediately even though the path is stable.
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Removes any stored avatar(s) for the user. */
export async function removeAvatar(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (existing?.length) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(existing.map((f) => `${userId}/${f.name}`));
  }
}

// ── Property images ───────────────────────────────────────────────────────────
//
// Listings are public, so the bucket is public-read; writes only ever happen
// here (service role) after the caller passed the listings permission checks.

let propertyBucketReady = false;

/** Creates the property-images bucket on first use (idempotent per process). */
async function ensurePropertyImagesBucket(): Promise<void> {
  if (propertyBucketReady) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.createBucket(PROPERTY_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: "15MB",
  });
  // "already exists" is the steady state; anything else is a real failure.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${PROPERTY_IMAGES_BUCKET} bucket: ${error.message}`);
  }
  propertyBucketReady = true;
}

/**
 * Uploads one optimized listing image under `{propertyId}/{imageId}.{ext}`.
 * Path and name are generated server-side; client file names are never trusted.
 */
export async function uploadPropertyImage(
  propertyId: string,
  imageId: string,
  image: OptimizedImage,
): Promise<{ url: string; storagePath: string }> {
  await ensurePropertyImagesBucket();
  const supabase = createAdminClient();

  const storagePath = `${propertyId}/${imageId}.${image.extension}`;
  const { error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(storagePath, image.buffer, { contentType: image.mimeType, upsert: false });
  if (error) throw new Error(`Failed to upload listing image: ${error.message}`);

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

/** Removes the given listing image objects. Best-effort: errors are logged. */
export async function removePropertyImages(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(storagePaths);
  if (error) console.error("[storage] failed to remove listing images", error.message);
}
