import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { AgentsPage } from "@/features/dashboard/AgentsPage";

export const metadata: Metadata = { title: "Agents — Mobi Prop" };

export default async function DashboardAgentsPage() {
  const profile = await requireDashboardAccess("agents:view");
  return <AgentsPage role={profile.role} />;
}
