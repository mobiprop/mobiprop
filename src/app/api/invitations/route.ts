import { NextResponse } from "next/server";

import { createAgentInvitation } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Admin-only: create a staff (AGENT/MANAGER) invitation. Authorization is
 * enforced inside createAgentInvitation via requirePermission("agents:invite").
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await createAgentInvitation(body);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, inviteUrl: result.inviteUrl });
}
