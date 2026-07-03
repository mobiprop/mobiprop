import { NextResponse } from "next/server";

import { getUnreadMessageCount } from "@/features/messages/message-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getUnreadMessageCount();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, count: result.count });
}
