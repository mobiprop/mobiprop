import type { Metadata } from "next";
import { FAQPageContent } from "@/features/faq/FAQPage";

export const metadata: Metadata = {
  title: "FAQ — Ulrich Propiedades",
  description:
    "Find answers to the most common questions about buying, selling, and renting property with Ulrich Propiedades.",
};

export default function FAQPage() {
  return <FAQPageContent />;
}
