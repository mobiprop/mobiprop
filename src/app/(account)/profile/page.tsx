import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { UserProfilePageContent } from "@/features/profile/UserProfilePage";

export const metadata: Metadata = {
  title: "My Profile — Ulrich Propiedades",
  description: "View and manage your Ulrich Propiedades profile, saved properties, contracts and scheduled tours.",
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <UserProfilePageContent profile={profile} />;
}
