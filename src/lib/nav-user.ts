import "server-only";

import { getCurrentProfile } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export type NavUser = {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  canAccessDashboard: boolean;
};

/**
 * Lightweight, serializable current-user summary for the public/account navbar.
 * Returns null when signed out.
 */
export async function getNavUser(): Promise<NavUser | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return {
    name: profile.fullName?.trim() || profile.email,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
    canAccessDashboard: canAccessDashboard(profile.role),
  };
}
