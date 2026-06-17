import { NextResponse } from "next/server";

import { getTourMetrics } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getTourMetrics();
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, metrics: result.metrics });
}
