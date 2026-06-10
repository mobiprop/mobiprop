import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPageContent } from "@/features/auth/LoginPage";

export const metadata: Metadata = {
  title: "Login — Ulrich Propiedades",
  description: "Sign in to your Ulrich Propiedades account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
