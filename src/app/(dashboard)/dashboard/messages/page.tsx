import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { MessagesPage } from "@/features/dashboard/MessagesPage";

export const metadata: Metadata = { title: "Messages — Mobi Prop" };

export default async function DashboardMessagesPage() {
  const profile = await requireDashboardAccess();
  return <MessagesPage currentUserId={profile.id} />;
}
