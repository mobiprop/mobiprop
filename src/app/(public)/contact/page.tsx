import type { Metadata } from "next";
import { ContactPageContent } from "@/features/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact — Mobi Prop",
  description:
    "Whether you're ready to buy, sell, or have questions about the market, the Ulrich team is here to guide you.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
