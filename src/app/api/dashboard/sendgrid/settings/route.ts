import { NextResponse } from "next/server";

import { getSendgridSettings, updateSendgridSettings } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getSendgridSettings();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, settings: result.settings });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await updateSendgridSettings(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, settings: result.settings });
}
