import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { canAccessDashboard } from "@/lib/permissions";
import type { Profile } from "@/generated/prisma/client";

/**
 * Returns the authenticated Supabase auth user, or null if not signed in.
 * Always uses `getUser()` (validates the JWT) rather than `getSession()`.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Returns the application Profile row (role, status, name...) for the current
 * authenticated user, or null if not signed in / no profile exists.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.profile.findUnique({ where: { id: user.id } });
}

/**
 * Guard for dashboard server layouts/pages. Redirects:
 *  - unauthenticated / no profile → staff login
 *  - CLIENT role → public account area
 *  - inactive / suspended staff → staff login with an error flag
 * Returns the Profile when access is allowed.
 */
export async function requireDashboardAccess(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/dashboard-login");
  // CLIENT users belong in the public account area (currently /profile).
  if (!canAccessDashboard(profile.role)) redirect("/profile");
  if (profile.status !== "ACTIVE") redirect("/dashboard-login?error=inactive");

  return profile;
}
