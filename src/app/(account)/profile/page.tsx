import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserProfilePageContent } from "@/features/profile/UserProfilePage";

export const metadata: Metadata = {
  title: "Mi perfil — Mobi Prop",
  description: "Gestioná tu perfil de Mobi Prop, propiedades guardadas, contratos y visitas programadas.",
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    // Authenticated Supabase user with no Profile row. Must sign out before
    // redirecting: proxy.ts sends any *authenticated* visitor away from /login
    // back to /dashboard, which would loop forever otherwise.
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?error=profile_missing");
  }

  return <UserProfilePageContent profile={profile} />;
}
