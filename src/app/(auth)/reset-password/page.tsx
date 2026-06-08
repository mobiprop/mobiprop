import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/features/auth/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password — Ulrich Propiedades",
  description: "Enter your email to reset your password.",
};

export default function ResetPasswordPage() {
  return <ForgotPasswordPageContent />;
}
