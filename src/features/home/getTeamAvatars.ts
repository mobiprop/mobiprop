import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { TEAM_MEMBER_NAMES } from "@/features/home/Agents";

// Profile.fullName in the DB isn't guaranteed to match the i18n team names
// byte-for-byte (e.g. "Rodolfo ulrich" vs "Rodolfo Ulrich"), so comparisons
// ignore case and accents.
function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Prefers the more senior role when multiple profiles share a normalized
// name (e.g. duplicate/test accounts) so an unrelated stranger's photo
// doesn't end up on the public site.
const ROLE_RANK: Record<string, number> = {
  [UserRole.ADMIN]: 0,
  [UserRole.MANAGER]: 1,
  [UserRole.AGENT]: 2,
  [UserRole.USER]: 3,
};

// Looks up the real avatarUrl for each hardcoded team member name so the
// public "Nuestro Equipo" sections can show uploaded admin photos instead
// of the placeholder silhouette.
export async function getTeamAvatars(): Promise<Record<string, string>> {
  const targets = new Set(TEAM_MEMBER_NAMES.map(normalize));

  const candidates = await prisma.profile.findMany({
    where: { fullName: { not: null }, avatarUrl: { not: null } },
    select: { fullName: true, avatarUrl: true, role: true },
  });

  const bestByNormalizedName = new Map<
    string,
    { avatarUrl: string; role: string }
  >();

  for (const candidate of candidates) {
    if (!candidate.fullName || !candidate.avatarUrl) continue;
    const key = normalize(candidate.fullName);
    if (!targets.has(key)) continue;

    const current = bestByNormalizedName.get(key);
    if (!current || ROLE_RANK[candidate.role] < ROLE_RANK[current.role]) {
      bestByNormalizedName.set(key, {
        avatarUrl: candidate.avatarUrl,
        role: candidate.role,
      });
    }
  }

  const result: Record<string, string> = {};
  for (const name of TEAM_MEMBER_NAMES) {
    const match = bestByNormalizedName.get(normalize(name));
    if (match) result[name] = match.avatarUrl;
  }
  return result;
}
