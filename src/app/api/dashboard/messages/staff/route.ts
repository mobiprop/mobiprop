import { NextResponse } from "next/server";

import { listMessageableStaff } from "@/features/messages/message-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listMessageableStaff();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, staff: result.staff });
}
