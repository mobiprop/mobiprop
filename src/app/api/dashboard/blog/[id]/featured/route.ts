import { NextResponse } from "next/server";

import { toggleBlogFeatured } from "@/features/blog/blog-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Staff (blog:publish): pin/unpin this post as the /blog page's hero. */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.isFeatured !== "boolean") {
    return NextResponse.json({ success: false, error: "isFeatured (boolean) is required" }, { status: 400 });
  }

  const result = await toggleBlogFeatured(id, body.isFeatured);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, post: result.post });
}
