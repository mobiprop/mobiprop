import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const AVATAR_BUCKET = "avatars";

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
