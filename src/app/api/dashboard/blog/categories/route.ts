import { NextResponse } from "next/server";

import { listBlogCategories, createBlogCategory } from "@/features/blog/blog-category-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listBlogCategories();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, categories: result.categories });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createBlogCategory(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, category: result.category }, { status: 201 });
}
