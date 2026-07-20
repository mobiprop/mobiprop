import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { LeadDetailPage } from "@/features/dashboard/LeadDetailPage";

export const metadata: Metadata = { title: "Lead Details — Ulrich Propiedades" };

export default async function DashboardLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const profile = await requireDashboardAccess("leads:view");
  return (
    <LeadDetailPage
      leadId={leadId}
      role={profile.role}
      currentUserId={profile.id}
      currentUserName={profile.fullName ?? profile.email}
    />
  );
}
