import { NextResponse } from "next/server";

import { sendCampaign } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await sendCampaign(id, body?.scheduleAt ? { scheduleAt: body.scheduleAt } : undefined);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, status: result.status, totalRecipients: result.totalRecipients });
}
