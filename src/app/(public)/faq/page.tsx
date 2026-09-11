import type { Metadata } from "next";
import { FAQPageContent } from "@/features/faq/FAQPage";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Mobi Prop",
  description: "Encontrá respuestas sobre la compra, venta y alquiler de propiedades con Mobi Prop.",
};

export default function FAQPage() {
  return <FAQPageContent />;
}
