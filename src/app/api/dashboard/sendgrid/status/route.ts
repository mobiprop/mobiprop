import { NextResponse } from "next/server";

import { getSendgridStatus } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getSendgridStatus();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, connected: result.connected, config: result.config });
}
