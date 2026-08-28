import { prisma } from "@/lib/prisma";

/** One card in the public "Nuestro Equipo" section. */
export type PublicTeamMember = {
  name: string;
  titleEs: string;
  titleEn: string;
  photo: string | null;
};

// Members are chosen by admins from the Agents page (Profile.showOnWebsite).
// Returning [] is meaningful: Agents.tsx then falls back to the hardcoded
// home.json list, so an empty/misconfigured selection can never blank out the
// section on the live site.
export async function getPublicTeam(): Promise<PublicTeamMember[]> {
  const profiles = await prisma.profile.findMany({
    where: { showOnWebsite: true, fullName: { not: null } },
    orderBy: [{ websiteOrder: "asc" }, { createdAt: "asc" }],
    select: {
      fullName: true,
      avatarUrl: true,
      websiteTitleEs: true,
      websiteTitleEn: true,
    },
  });

  return profiles.map((p) => ({
    name: p.fullName ?? "",
    // Each language falls back to the other so a half-filled title still
    // renders something real instead of an empty line under the name.
    titleEs: p.websiteTitleEs?.trim() || p.websiteTitleEn?.trim() || "",
    titleEn: p.websiteTitleEn?.trim() || p.websiteTitleEs?.trim() || "",
    photo: p.avatarUrl,
  }));
}
