import { NextResponse } from "next/server";

import { listTours, createTour } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters = Object.fromEntries(searchParams.entries());

  const result = await listTours(filters);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, tours: result.tours, total: result.total, page: result.page, limit: result.limit });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await createTour(body);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, tour: result.tour }, { status: 201 });
}
