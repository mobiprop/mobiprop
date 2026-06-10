import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { ContactsPage } from "@/features/dashboard/ContactsPage";

export const metadata: Metadata = { title: "Contacts — Ulrich Propiedades" };

export default async function DashboardContactsPage() {
  const profile = await requireDashboardAccess("contacts:view");
  return <ContactsPage role={profile.role} />;
}
