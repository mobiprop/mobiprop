import { NextResponse } from "next/server";

import { convertLead } from "@/features/crm/lead-actions";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const result = await convertLead(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, lead: result.lead, opportunityId: result.opportunityId });
}
