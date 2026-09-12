import { Suspense, type ReactNode } from "react";

import { requireDashboardAccess } from "@/lib/auth";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardErrorToast } from "@/features/dashboard/components/DashboardErrorToast";
import { ServiceWorkerRegistration } from "@/features/notifications/components/service-worker-registration";
import { NotificationRealtime } from "@/features/notifications/components/notification-realtime";
import { MessagesRealtime } from "@/features/messages/components/messages-realtime";
import { StaffPresenceRealtime } from "@/features/messages/components/staff-presence-realtime";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side guard: redirects unauthenticated / USER / inactive users.
  const profile = await requireDashboardAccess();

  return (
    <DashboardShell role={profile.role} fullName={profile.fullName ?? ""} email={profile.email} avatarUrl={profile.avatarUrl}>
      <ServiceWorkerRegistration />
      <NotificationRealtime userId={profile.id} />
      <MessagesRealtime userId={profile.id} />
      <StaffPresenceRealtime userId={profile.id} />
      {/* useSearchParams needs a Suspense boundary during prerender */}
      <Suspense fallback={null}>
        <DashboardErrorToast />
      </Suspense>
      {children}
    </DashboardShell>
  );
}
