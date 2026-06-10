import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { OpportunitiesPage } from "@/features/dashboard/OpportunitiesPage";

export const metadata: Metadata = { title: "Opportunities — Ulrich Propiedades" };

export default async function DashboardOpportunitiesPage() {
  const profile = await requireDashboardAccess("opportunities:view");
  return <OpportunitiesPage role={profile.role} />;
}
