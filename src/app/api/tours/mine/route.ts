import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { getMyTours } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

/** GET /api/tours/mine — returns tours for the currently authenticated user. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const tours = await getMyTours(profile.id);
  return NextResponse.json({ success: true, tours });
}
