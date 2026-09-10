import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { ListingsPage } from "@/features/dashboard/ListingsPage";

export const metadata: Metadata = { title: "Listings — Mobi Prop" };

export default async function DashboardListingsPage() {
  const profile = await requireDashboardAccess("listings:view");
  return <ListingsPage role={profile.role} />;
}
