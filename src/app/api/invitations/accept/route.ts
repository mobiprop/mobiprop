import { NextResponse } from "next/server";

import { acceptInvitationApi } from "@/features/auth/staff-actions";

export const runtime = "nodejs";

/**
 * Public: completes invite-based staff registration. Role and email come
 * from the invitation only — never from the request body.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await acceptInvitationApi(body);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
