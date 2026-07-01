import { createClient } from "@/lib/supabase/client";
import { optimizeImageForUpload } from "@/lib/client-image";

// Must match BLOG_IMAGES_BUCKET in src/lib/supabase/storage.ts.
const BLOG_IMAGES_BUCKET = "blog-images";

type CoverTicket = { storagePath: string; token: string; publicUrl: string };

/**
 * Optimize a chosen cover image (client-side WebP/2K), mint a signed upload
 * ticket, upload the bytes directly to storage, and return the public URL to
 * store on the post as `coverImageUrl`.
 */
export async function uploadBlogCover(file: File): Promise<string> {
  const optimized = await optimizeImageForUpload(file);
  const upload = optimized.file;

  const res = await fetch("/api/dashboard/blog/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: [{ name: upload.name, type: upload.type, size: upload.size }],
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error ?? "Failed to prepare cover upload");
  }
  const ticket = data.ticket as CoverTicket;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .uploadToSignedUrl(ticket.storagePath, ticket.token, upload, { contentType: upload.type });
  if (error) throw new Error(`Cover upload failed: ${error.message}`);

  return ticket.publicUrl;
}
