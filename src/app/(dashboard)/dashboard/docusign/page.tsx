import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { DocuSignPage } from "@/features/dashboard/DocuSignPage";

export const metadata: Metadata = { title: "DocuSign — Mobi Prop" };

export default async function DashboardDocuSignPage() {
  const profile = await requireDashboardAccess("docusign:view");
  return <DocuSignPage role={profile.role} />;
}
