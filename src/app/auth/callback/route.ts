import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { canAccessDashboard } from "@/lib/permissions";

// Magic Link / email-OTP callback (spec §2 + §9).
//
// Supabase email links land here. We establish the session (PKCE `code`
// exchange, or the `token_hash` + `type` verification flow), make sure an
// application Profile exists, then redirect by role:
//   ADMIN/MANAGER/AGENT → /dashboard,  USER → /profile.
//
// This is the PUBLIC auth flow only: a missing profile is auto-created as
// USER. Staff are never created here — they onboard via invitation
// (see acceptAgentInvitation) and a callback can never grant a staff role.

/** Only allow same-origin relative redirects (e.g. password-reset → /new-password). */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}

function errorRedirect(origin: string, code: string) {
  return NextResponse.redirect(`${origin}/login?error=${code}`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  // 1. Establish the session from whichever link format Supabase sent.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return errorRedirect(origin, "auth_callback_error");
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return errorRedirect(origin, "auth_callback_error");
  } else {
    return errorRedirect(origin, "auth_callback_error");
  }

  // 2. Confirm the session resolved to a real user.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorRedirect(origin, "auth_callback_error");

  // 3. Ensure a Profile exists. Public flow only ever creates a USER.
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? "", fullName },
    update: { email: user.email ?? "", ...(fullName ? { fullName } : {}) },
  });

  // 4. Blocked / inactive accounts never get a usable session.
  if (profile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return errorRedirect(origin, "account_not_active");
  }

  // 5. Staff accounts must never authenticate via social OAuth on the public
  //    login. They are invited via email and must use the dashboard login page.
  const oauthProvider = user.app_metadata?.provider as string | undefined;
  const isOAuth = oauthProvider === "google" || oauthProvider === "facebook";
  if (isOAuth && canAccessDashboard(profile.role)) {
    await supabase.auth.signOut();
    return errorRedirect(origin, "staff_use_dashboard");
  }

  // 6. A safe `next` (e.g. password recovery → /new-password) wins over the
  //    default role landing page.
  if (next) return NextResponse.redirect(`${origin}${next}`);

  const destination = canAccessDashboard(profile.role) ? "/dashboard" : "/profile";
  return NextResponse.redirect(`${origin}${destination}`);
}
