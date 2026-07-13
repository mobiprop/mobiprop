import { NextResponse } from "next/server";

import { sendCampaignTestEmail } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.emails)) {
    return NextResponse.json({ success: false, error: "emails array is required" }, { status: 400 });
  }
  const result = await sendCampaignTestEmail(id, body.emails);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, sentTo: result.sentTo });
}
