import type { Metadata } from "next";
import { SignUpPageContent } from "@/features/auth/SignUpPage";

export const metadata: Metadata = {
  title: "Crear cuenta — Mobi Prop",
  description: "Creá tu cuenta de Mobi Prop y descubrí nuestras propiedades.",
};

export default function RegisterPage() {
  return <SignUpPageContent />;
}
