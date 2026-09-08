import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { DashboardOverviewPage } from "@/features/dashboard/DashboardOverviewPage";

export const metadata: Metadata = { title: "Dashboard — Mobi Prop" };

export default async function DashboardPage() {
  const profile = await requireDashboardAccess();
  const firstName = (profile.fullName ?? "").split(" ")[0] ?? "";

  return <DashboardOverviewPage role={profile.role} firstName={firstName} />;
}
