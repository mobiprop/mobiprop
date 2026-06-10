import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { IntegrationsPage } from "@/features/dashboard/IntegrationsPage";

export const metadata: Metadata = { title: "Integrations — Ulrich Propiedades" };

export default async function DashboardIntegrationsPage() {
  const profile = await requireDashboardAccess("integrations:view");
  return <IntegrationsPage role={profile.role} />;
}
