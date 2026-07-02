import "server-only";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

export type ProfileForScope = { id: string; role: UserRole };

/**
 * Resolves the set of profile ids whose owned/assigned records a profile may
 * see on "view_all"-gated modules (Opportunities, Contracts, Listings, Tours,
 * and revenue/metrics rollups) — never Contacts/Leads, which stay company-wide
 * for everyone regardless of role.
 *
 * - ADMIN: `null` — always unrestricted, even if listed as someone's team
 *   leader.
 * - MANAGER: self + every agent whose `teamLeaderId` points to them (their
 *   direct reports). A Manager who leads no one only sees their own records.
 * - AGENT (or any other role): `[profile.id]` — unchanged, already-scoped
 *   own/assigned behavior.
 */
export async function resolveOwnerScopeIds(profile: ProfileForScope): Promise<string[] | null> {
  if (profile.role === UserRole.ADMIN) return null;

  if (profile.role === UserRole.MANAGER) {
    const team = await prisma.profile.findMany({
      where: { teamLeaderId: profile.id },
      select: { id: true },
    });
    return [profile.id, ...team.map((t) => t.id)];
  }

  return [profile.id];
}
