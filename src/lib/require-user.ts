import "server-only";

import type { Profile } from "@/generated/prisma/client";
import { getCurrentProfile } from "@/lib/auth";

// Action/API-level auth guard (the non-redirecting counterpart to
// requireDashboardAccess, which is for pages/layouts). Returns a discriminated
// result so server actions can surface an error instead of throwing/redirecting.

export type RequireFailureReason = "unauthenticated" | "inactive" | "forbidden";

export type RequireUserResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string; reason: Exclude<RequireFailureReason, "forbidden"> };

/**
 * Ensures there is a signed-in user with an ACTIVE profile.
 * Use at the top of any protected server action / route handler.
 */
export async function requireUser(): Promise<RequireUserResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ok: false, error: "You must be signed in.", reason: "unauthenticated" };
  }
  if (profile.status !== "ACTIVE") {
    return { ok: false, error: "Your account is not active.", reason: "inactive" };
  }

  return { ok: true, profile };
}
