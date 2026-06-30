import { Suspense } from "react";
import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { ContractsPage } from "@/features/dashboard/ContractsPage";

export const metadata: Metadata = { title: "Contracts — Ulrich Propiedades" };

export default async function DashboardContractsPage() {
  const profile = await requireDashboardAccess("contracts:view");
  return (
    // ContractsPage reads ?fromOpportunity= via useSearchParams (the "Create
    // Contract from Won Opportunity" deep link) — needs a Suspense boundary
    // during prerender, same as dashboard/layout.tsx's pattern.
    <Suspense fallback={null}>
      <ContractsPage role={profile.role} />
    </Suspense>
  );
}
