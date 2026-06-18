import { NextResponse } from "next/server";

import { requestPublicTour } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

/** POST /api/tours — public tour request from a listing page. No auth required. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await requestPublicTour(body);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, tour: result.tour }, { status: 201 });
}
