import { NextResponse } from "next/server";

import { sendTestPush } from "@/features/notifications/server/push-subscription-actions";

export const runtime = "nodejs";

export async function POST() {
  const result = await sendTestPush();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    sent: result.sent,
    failed: result.failed,
    skipped: result.skipped,
    lastError: result.lastError,
  });
}
