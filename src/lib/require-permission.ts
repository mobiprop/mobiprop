import "server-only";

import type { Profile } from "@/generated/prisma/client";
import { hasPermission, type Permission } from "@/lib/permissions";
import { requireUser, type RequireFailureReason } from "@/lib/require-user";

export type RequirePermissionResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string; reason: RequireFailureReason };

/**
 * Ensures the current user is active AND holds `permission`. The single gate to
 * call from a protected server action / route handler before doing the work.
 * Record-level (ownership) checks, when needed, happen after this passes.
 */
export async function requirePermission(
  permission: Permission,
): Promise<RequirePermissionResult> {
  const result = await requireUser();
  if (!result.ok) return result;

  if (!hasPermission(result.profile.role, permission)) {
    return {
      ok: false,
      error: "You don't have permission to perform this action.",
      reason: "forbidden",
    };
  }

  return { ok: true, profile: result.profile };
}
