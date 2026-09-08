import type { Metadata } from "next";
import { Suspense } from "react";

import { StaffLoginPageContent } from "@/features/auth/StaffLoginPage";

export const metadata: Metadata = {
  title: "Staff Login — Mobi Prop",
  description: "Sign in to the Mobi Prop CRM dashboard.",
};

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginPageContent />
    </Suspense>
  );
}
