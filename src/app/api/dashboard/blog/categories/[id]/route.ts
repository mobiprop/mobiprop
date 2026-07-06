import { NextResponse } from "next/server";

import { updateBlogCategory, deleteBlogCategory } from "@/features/blog/blog-category-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const result = await updateBlogCategory(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, category: result.category });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await deleteBlogCategory(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
