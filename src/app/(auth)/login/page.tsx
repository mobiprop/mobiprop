import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPageContent } from "@/features/auth/LoginPage";

export const metadata: Metadata = {
  title: "Iniciar sesión — Mobi Prop",
  description: "Ingresá a tu cuenta de Mobi Prop.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
