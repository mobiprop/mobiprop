import type { Metadata } from "next";
import { Suspense } from "react";

import { StaffLoginPageContent } from "@/features/auth/StaffLoginPage";

export const metadata: Metadata = {
  title: "Acceso del equipo — Mobi Prop",
  description: "Ingresá al panel de gestión de Mobi Prop.",
};

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginPageContent />
    </Suspense>
  );
}
