import { NextResponse } from "next/server";

import { createAgentInvitation, listInvitations } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Admin-only: create a staff (AGENT/MANAGER/ADMIN) invitation. Authorization is
 * enforced inside createAgentInvitation via requirePermission("agents:invite"),
 * plus invitations:inviteAdmin when the invited role is ADMIN.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await createAgentInvitation(body);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, inviteUrl: result.inviteUrl });
}

/**
 * Admin-only: list all invitations (safe DTO — no tokenHash/notes). Authorization
 * is enforced inside listInvitations via requirePermission("invitations:view").
 */
export async function GET() {
  const result = await listInvitations();

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 403 });
  }

  return NextResponse.json({ success: true, invitations: result.invitations });
}
