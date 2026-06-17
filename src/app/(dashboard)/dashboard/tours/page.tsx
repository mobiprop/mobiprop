import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { ToursPage } from "@/features/dashboard/ToursPage";

export const metadata: Metadata = { title: "Tours — Ulrich Propiedades" };

export default async function DashboardToursPage() {
  const profile = await requireDashboardAccess("tours:view");
  return <ToursPage role={profile.role} />;
}
