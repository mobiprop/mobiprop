import type { Metadata } from "next";
import { Suspense } from "react";
import { OtpPageContent } from "@/features/auth/OtpPage";

export const metadata: Metadata = {
  title: "Verificación de correo — Mobi Prop",
  description: "Ingresá tu código de verificación de un solo uso.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpPageContent backHref="/register" />
    </Suspense>
  );
}
