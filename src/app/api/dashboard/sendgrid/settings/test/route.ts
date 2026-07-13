import { NextResponse } from "next/server";

import { runConnectionTest } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function POST() {
  const result = await runConnectionTest();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, connection: result.connection });
}
