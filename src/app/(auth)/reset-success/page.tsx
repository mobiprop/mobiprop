import type { Metadata } from "next";
import { PasswordResetSuccessPageContent } from "@/features/auth/PasswordResetSuccessPage";

export const metadata: Metadata = {
  title: "Contraseña restablecida — Mobi Prop",
  description: "Tu contraseña se restableció correctamente.",
};

export default function ResetSuccessPage() {
  return <PasswordResetSuccessPageContent />;
}
