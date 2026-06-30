import { NextResponse } from "next/server";

import { getGoogleCalendarStatus } from "@/features/dashboard/calendar-integration-actions";

export async function GET() {
  const result = await getGoogleCalendarStatus();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, status: result.status });
}
