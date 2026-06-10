import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { ContractsPage } from "@/features/dashboard/ContractsPage";

export const metadata: Metadata = { title: "Contracts — Ulrich Propiedades" };

export default async function DashboardContractsPage() {
  const profile = await requireDashboardAccess("contracts:view");
  return <ContractsPage role={profile.role} />;
}
