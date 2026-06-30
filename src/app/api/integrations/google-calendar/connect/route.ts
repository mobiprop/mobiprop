import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { getCurrentProfile } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";
import { getAuthorizeUrl } from "@/lib/google-calendar";
import { isGoogleCalendarConfigured } from "@/lib/env";
import { APP_URL } from "@/lib/constants";

export const runtime = "nodejs";

// Full-page redirect into Google's OAuth consent screen (not a fetch — this
// must navigate the browser). Any signed-in staff member connects their own
// calendar; no extra permission beyond being staff.
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessDashboard(profile.role) || profile.status !== "ACTIVE") {
    return NextResponse.redirect(`${APP_URL}/dashboard-login`);
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=not_configured`);
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(getAuthorizeUrl(state));
  response.cookies.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
