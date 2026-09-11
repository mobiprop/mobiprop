import type { Metadata } from "next";
import { TermsPageContent } from "@/features/terms/TermsPage";

export const metadata: Metadata = {
  title: "Términos y condiciones — Mobi Prop",
  description: "Consultá los términos y condiciones de uso de los servicios y la plataforma de Mobi Prop.",
};

export default function TermsConditionsPage() {
  return <TermsPageContent />;
}
