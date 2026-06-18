import { NextResponse } from "next/server";

import { getLeadMetrics } from "@/features/crm/lead-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getLeadMetrics();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, metrics: result.metrics });
}
