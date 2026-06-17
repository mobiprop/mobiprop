import { NextResponse } from "next/server";

import { listOpportunities, createOpportunity } from "@/features/crm/opportunity-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listOpportunities();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    opportunities: result.opportunities,
    metrics: result.metrics,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createOpportunity(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, opportunity: result.opportunity }, { status: 201 });
}
