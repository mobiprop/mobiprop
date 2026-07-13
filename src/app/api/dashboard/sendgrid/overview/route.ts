import { NextResponse } from "next/server";

import { getSendgridOverview } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getSendgridOverview();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, overview: result.overview });
}
