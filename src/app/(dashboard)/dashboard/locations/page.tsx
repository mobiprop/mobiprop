import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { LocationsPage } from "@/features/dashboard/LocationsPage";

export const metadata: Metadata = { title: "Locations — Ulrich Propiedades" };

export default async function DashboardLocationsPage() {
  const profile = await requireDashboardAccess("locations:view");
  return <LocationsPage role={profile.role} />;
}
