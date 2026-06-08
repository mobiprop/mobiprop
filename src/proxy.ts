import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs before
// routes render and handles session refresh + auth-presence guarding.
//
// Defense-in-depth note: role-level enforcement (e.g. blocking a CLIENT from the
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
  const isStaffAuthPage = pathname === "/dashboard-login";
  const isClientAuthPage = pathname === "/login" || pathname === "/register";

  // Unauthenticated visitor trying to reach the CRM → staff login.
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard-login";
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Already-authenticated user landing on an auth page → send them inward.
  // (Role-correct destination is finalized by the layout guards.)
  if (user && (isStaffAuthPage || isClientAuthPage)) {
    const url = request.nextUrl.clone();
    url.pathname = isStaffAuthPage ? "/dashboard" : "/profile";
    url.search = "";
    return NextResponse.redirect(url);
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
