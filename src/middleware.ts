import { NextResponse, type NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // TODO: add auth guard using Supabase session
  return NextResponse.next();
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
