import { NextResponse } from "next/server";

import { revokeInvitation } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Admin-only: revoke a pending invitation so its link can never be used.
 * Authorization is enforced inside revokeInvitation via
 * requirePermission("invitations:revoke").
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await revokeInvitation(id);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
