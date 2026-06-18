import { NextResponse } from "next/server";

import { restoreLead } from "@/features/crm/lead-actions";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await restoreLead(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, lead: result.lead });
}
