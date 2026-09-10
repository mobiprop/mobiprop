import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { HelpPage } from "@/features/dashboard/HelpPage";

export const metadata: Metadata = { title: "Help Center — Mobi Prop" };

export default async function DashboardHelpPage() {
  await requireDashboardAccess();
  return <HelpPage />;
}
