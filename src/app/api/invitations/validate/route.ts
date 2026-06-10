import { NextResponse } from "next/server";

import { validateInvitationToken } from "@/features/auth/staff-actions";
import { validateInvitationSchema } from "@/schemas/invitation.schema";

export const runtime = "nodejs";

/**
 * Public: checks an invite token's status for the /invite/[token] page.
 * Never returns the token hash, invitedById, or any other internal fields.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = validateInvitationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "INVALID" as const });
  }

  const result = await validateInvitationToken(parsed.data.token);
  return NextResponse.json(result);
}
