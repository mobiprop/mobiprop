import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { NotificationsPage } from "@/features/dashboard/NotificationsPage";

export const metadata: Metadata = { title: "Notifications — Mobi Prop" };

export default async function DashboardNotificationsPage() {
  // Any authenticated staff member may view their own notifications.
  await requireDashboardAccess();
  return <NotificationsPage />;
}
