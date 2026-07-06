import { NextResponse } from "next/server";

import { getBlogMetrics } from "@/features/blog/blog-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getBlogMetrics();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, metrics: result.metrics });
}
