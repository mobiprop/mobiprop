import type { Metadata } from "next";
import { ContactPageContent } from "@/features/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contacto — Mobi Prop",
  description: "Si querés comprar, vender o consultar sobre el mercado, el equipo de Mobi Prop está para acompañarte.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
