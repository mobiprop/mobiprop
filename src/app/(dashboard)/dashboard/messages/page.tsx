import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { MessagesPage } from "@/features/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages — Ulrich Propiedades" };

export default async function DashboardMessagesPage() {
  await requireDashboardAccess();
  return <MessagesPage />;
}
