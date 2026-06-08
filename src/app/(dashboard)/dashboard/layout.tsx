import type { ReactNode } from "react";

import { requireDashboardAccess } from "@/lib/auth";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side guard: redirects unauthenticated / CLIENT / inactive users.
  const profile = await requireDashboardAccess();

  return (
    <DashboardShell role={profile.role} fullName={profile.fullName ?? ""} email={profile.email}>
      {children}
    </DashboardShell>
  );
}
