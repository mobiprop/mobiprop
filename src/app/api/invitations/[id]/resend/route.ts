import { NextResponse } from "next/server";

import { resendInvitation } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Admin-only: re-issue a pending/expired invitation (rotates the token, resets
 * expiry, re-sends the email). Authorization is enforced inside
 * resendInvitation via requirePermission("invitations:resend").
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await resendInvitation(id);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    inviteUrl: result.inviteUrl,
    emailSent: result.emailSent,
  });
}
