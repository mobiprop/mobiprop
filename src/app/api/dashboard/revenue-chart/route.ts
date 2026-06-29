import { NextResponse } from "next/server";

import { getRevenueChart } from "@/features/dashboard/dashboard-actions";
import type { ChartGranularity, DashboardDateRangeKey } from "@/features/dashboard/types/dashboard-dto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateRange = (searchParams.get("dateRange") ?? "60_DAYS") as DashboardDateRangeKey;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const granularity = (searchParams.get("granularity") ?? "monthly") as ChartGranularity;

  const result = await getRevenueChart({ dateRange, from, to, granularity });
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, chart: result.chart });
}
