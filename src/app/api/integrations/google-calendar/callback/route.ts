import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { encrypt } from "@/lib/crypto";
import { exchangeCodeForTokens, getGoogleAccountEmail } from "@/lib/google-calendar";
import { APP_URL } from "@/lib/constants";

export const runtime = "nodejs";

function errorRedirect(code: string) {
  return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=${code}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("gcal_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return errorRedirect("invalid_state");
  }

  const profile = await getCurrentProfile();
  if (!profile || !canAccessDashboard(profile.role) || profile.status !== "ACTIVE") {
    return errorRedirect("unauthorized");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refreshToken) {
      // Google only omits this if prompt=consent/access_type=offline weren't
      // actually honored — ask the user to disconnect and reconnect.
      return errorRedirect("missing_refresh_token");
    }

    const email = await getGoogleAccountEmail(tokens.accessToken);

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        googleCalendarEmail: email,
        googleCalendarAccessToken: encrypt(tokens.accessToken),
        googleCalendarRefreshToken: encrypt(tokens.refreshToken),
        googleCalendarTokenExpiresAt: tokens.expiresAt,
        googleCalendarConnectedAt: new Date(),
      },
    });

    await logActivity({
      actorId: profile.id,
      action: "GOOGLE_CALENDAR_CONNECTED",
      entityType: "PROFILE",
      entityId: profile.id,
      newValues: { email },
    });
  } catch (error) {
    console.error("[google-calendar] callback failed", error);
    return errorRedirect("connect_failed");
  }

  const response = NextResponse.redirect(`${APP_URL}/dashboard/integrations?connected=google-calendar`);
  response.cookies.delete("gcal_oauth_state");
  return response;
}
