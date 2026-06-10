import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

// Entry auth screens an already-signed-in user should never see again.
// Deliberately EXCLUDES:
//  - /new-password & /reset-success — reached *with* a recovery session (the
//    user is authenticated at that point; blocking them breaks password reset).
//  - /accept-invite & /auth/callback — their own flows establish the session.
const AUTH_ENTRY_PAGES = new Set([
  "/login",
  "/register",
  "/dashboard-login",
  "/reset-password",
  "/verify-otp",
]);

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs before
// routes render and handles session refresh + auth-presence guarding.
//
// Defense-in-depth note: role-level enforcement (e.g. blocking a USER from the
// dashboard) lives in the dashboard server layout via `requireDashboardAccess()`,
// since the user's role lives in the database and we avoid DB calls in the proxy.
export async function proxy(request: NextRequest) {
  // Mirror of lib/supabase/middleware `updateSession` so we can both refresh the
  // session cookies AND read the user in a single pass.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAccount =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/account");
  const isAuthEntryPage = AUTH_ENTRY_PAGES.has(pathname);

  // Never redirect server action POST calls — the React client must receive the
  // action response directly, not a redirect. 307 would replay the POST on the
  // new URL and break the response contract ("unexpected response" error).
  const isServerAction = request.headers.has("Next-Action");
  if (isServerAction) return response;

  // Unauthenticated visitor trying to reach the CRM → staff login.
  // 303 forces a GET so any prior POST (e.g. form submit) is not replayed.
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard-login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url, { status: 303 });
  }

  // Unauthenticated visitor trying to reach the client account area → login.
  if (isAccount && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url, { status: 303 });
  }

  // Already-authenticated user landing on an entry auth page → send them to the
  // dashboard. requireDashboardAccess() handles role-level routing from there
  // (USER gets bounced to /profile by the dashboard layout).
  if (user && isAuthEntryPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url, { status: 303 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
