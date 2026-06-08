import type { Metadata } from "next";
import { Suspense } from "react";
import { OtpPageContent } from "@/features/auth/OtpPage";

export const metadata: Metadata = {
  title: "OTP Verification — Ulrich Propiedades",
  description: "Enter your one-time verification code.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpPageContent backHref="/register" />
    </Suspense>
  );
}
