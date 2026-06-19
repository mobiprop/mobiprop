import { NextResponse } from "next/server";

import { getPushStatus } from "@/features/notifications/server/push-subscription-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getPushStatus();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, ...result.data });
}
