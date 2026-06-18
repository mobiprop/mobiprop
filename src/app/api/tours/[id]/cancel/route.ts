import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { cancelMyTour } from "@/features/crm/tour-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/tours/[id]/cancel — authenticated public user cancels their own tour. */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const result = await cancelMyTour(id, profile.id);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}
