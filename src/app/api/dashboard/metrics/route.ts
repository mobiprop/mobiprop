import { NextResponse } from "next/server";

import { getDashboardMetrics } from "@/features/dashboard/dashboard-actions";
import type { DashboardDateRangeKey } from "@/features/dashboard/types/dashboard-dto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateRange = (searchParams.get("dateRange") ?? "60_DAYS") as DashboardDateRangeKey;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const result = await getDashboardMetrics({ dateRange, from, to });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, metrics: result.metrics });
}
