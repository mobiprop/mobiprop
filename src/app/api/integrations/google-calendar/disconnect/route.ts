import { NextResponse } from "next/server";

import { disconnectGoogleCalendar } from "@/features/dashboard/calendar-integration-actions";

export async function POST() {
  const result = await disconnectGoogleCalendar();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
