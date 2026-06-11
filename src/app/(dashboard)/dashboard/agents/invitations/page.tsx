import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { listInvitations } from "@/features/auth/staff-actions";
import { InvitationsPage } from "@/features/dashboard/InvitationsPage";

export const metadata: Metadata = { title: "Invitations — Ulrich Propiedades" };

export default async function DashboardInvitationsPage() {
  const profile = await requireDashboardAccess("invitations:view");
  const result = await listInvitations();
  return (
    <InvitationsPage
      role={profile.role}
      invitations={result.ok ? result.invitations : []}
    />
  );
}
