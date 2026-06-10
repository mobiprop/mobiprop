import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { LeadsPage } from "@/features/dashboard/LeadsPage";

export const metadata: Metadata = { title: "Leads — Ulrich Propiedades" };

export default async function DashboardLeadsPage() {
  const profile = await requireDashboardAccess("leads:view");
  return <LeadsPage role={profile.role} />;
}
