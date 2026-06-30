import { NextResponse } from "next/server";

import { getTour, updateTour } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await getTour(id);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true, tour: result.tour });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await updateTour(id, body);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, suggestedSlots: result.suggestedSlots },
      { status: result.status },
    );
  }
  return NextResponse.json({ success: true, tour: result.tour });
}
