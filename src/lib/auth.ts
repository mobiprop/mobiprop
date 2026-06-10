import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { canAccessDashboard, hasPermission, type Permission } from "@/lib/permissions";
import type { Profile } from "@/generated/prisma/client";

/**
 * Returns the authenticated Supabase auth user, or null if not signed in.
 * Always uses `getUser()` (validates the JWT) rather than `getSession()`.
 * Wrapped in React cache so layout + page calls in one request dedupe.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Returns the application Profile row (role, status, name...) for the current
 * authenticated user, or null if not signed in / no profile exists.
 * Wrapped in React cache so layout + page calls in one request dedupe.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.profile.findUnique({ where: { id: user.id } });
});

/**
 * Guard for dashboard server layouts/pages. Redirects:
 *  - unauthenticated / no profile → staff login
 *  - USER role → public account area
 *  - inactive / suspended staff → staff login with an error flag
 *  - staff lacking `permission` (when given) → dashboard home
 * Returns the Profile when access is allowed.
 *
 * Pass `permission` on sub-pages so a role without it (e.g. an AGENT opening
 * /dashboard/agents directly) is blocked, not just hidden from the sidebar.
 */
export async function requireDashboardAccess(
  permission?: Permission,
): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/dashboard-login");
  // USER-role accounts belong in the public account area (currently /profile).
  if (!canAccessDashboard(profile.role)) redirect("/profile");
  if (profile.status !== "ACTIVE") redirect("/dashboard-login?error=inactive");
  if (permission && !hasPermission(profile.role, permission)) {
    redirect("/dashboard?error=not_authorized");
  }

  return profile;
}
