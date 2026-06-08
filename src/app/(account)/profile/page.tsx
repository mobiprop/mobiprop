import type { Metadata } from "next";
import { UserProfilePageContent } from "@/features/profile/UserProfilePage";

export const metadata: Metadata = {
  title: "My Profile — Ulrich Propiedades",
  description: "View and manage your Ulrich Propiedades profile, saved properties, contracts and scheduled tours.",
};

export default function ProfilePage() {
  return <UserProfilePageContent />;
}
