import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/features/auth/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Mobi Prop",
  description: "Ingresá tu correo para restablecer tu contraseña.",
};

export default function ResetPasswordPage() {
  return <ForgotPasswordPageContent />;
}
