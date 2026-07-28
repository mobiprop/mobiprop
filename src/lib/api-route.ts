import { NextResponse } from "next/server";

/**
 * Wraps a route handler so an unexpected exception (expired/invalid auth
 * session, a DB blip, etc.) always comes back as parseable `{success, error}`
 * JSON instead of Next's default HTML/plain-text error page. The client's
 * fetch helpers can only read that shape — anything else surfaces to staff as
 * an opaque "Request failed" with no way to diagnose it. `routeName` is only
 * used to tag the server-side log line for triage.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  routeName: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`[api] ${routeName} failed`, error);
      return NextResponse.json(
        { success: false, error: "Something went wrong on our end. Please try again." },
        { status: 500 },
      );
    }
  };
}
