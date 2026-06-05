import type { Metadata } from "next";
import { FAQ } from "@/features/home/FAQ";

export const metadata: Metadata = {
  title: "FAQ — Ulrich Propiedades",
};

export default function FAQPage() {
  return <FAQ />;
}
