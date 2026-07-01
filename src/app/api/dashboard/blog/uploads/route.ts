import { NextResponse } from "next/server";

import { prepareBlogCoverUpload } from "@/features/blog/blog-actions";

export const runtime = "nodejs";

/**
 * Staff (blog:create): mint a signed upload URL for a blog cover image. Body:
 * { files: [{ name, type, size }] } (exactly one). The browser uploads the file
 * directly to storage with the returned ticket, then sends `publicUrl` back as
 * the post's `coverImageUrl`.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const result = await prepareBlogCoverUpload(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, ticket: result.ticket });
}
