import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { getMyContracts } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

/** GET /api/contracts/mine — returns DocuSign envelopes for the currently authenticated user. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const contracts = await getMyContracts(profile.id);
  return NextResponse.json({ success: true, contracts });
}
