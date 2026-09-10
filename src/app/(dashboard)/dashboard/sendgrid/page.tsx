import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { SendGridPage } from "@/features/dashboard/SendGridPage";

export const metadata: Metadata = { title: "SendGrid — Mobi Prop" };

export default async function DashboardSendGridPage() {
  const profile = await requireDashboardAccess("sendgrid:view");
  return <SendGridPage role={profile.role} />;
}
