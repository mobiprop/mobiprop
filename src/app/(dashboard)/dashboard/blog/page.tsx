import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { BlogAdminPage } from "@/features/dashboard/BlogAdminPage";

export const metadata: Metadata = { title: "Blog — Mobi Prop" };

export default async function DashboardBlogPage() {
  const profile = await requireDashboardAccess("blog:view");
  return <BlogAdminPage role={profile.role} />;
}
