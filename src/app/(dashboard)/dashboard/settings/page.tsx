import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { SettingsPage } from "@/features/dashboard/SettingsPage";

export const metadata: Metadata = { title: "Settings — Mobi Prop" };

export default async function DashboardSettingsPage() {
  const profile = await requireDashboardAccess("settings:view");
  return <SettingsPage profile={profile} />;
}
