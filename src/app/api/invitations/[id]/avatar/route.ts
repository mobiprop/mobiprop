import { NextResponse } from "next/server";

import { setInvitationAvatar } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Admin-only: stage a photo for a not-yet-accepted invitation. Called from
 * Add New Agent right after the invitation is created (no Profile id exists
 * yet, so the photo can't upload to its final path until the invite is
 * accepted — see promoteInvitationAvatar).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: "No photo provided." }, { status: 400 });
  }

  const result = await setInvitationAvatar(id, file);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
