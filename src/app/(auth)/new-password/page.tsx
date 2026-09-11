import type { Metadata } from "next";
import { NewPasswordPageContent } from "@/features/auth/NewPasswordPage";

export const metadata: Metadata = {
  title: "Nueva contraseña — Mobi Prop",
  description: "Configurá tu nueva contraseña.",
};

export default function NewPasswordPage() {
  return <NewPasswordPageContent />;
}
