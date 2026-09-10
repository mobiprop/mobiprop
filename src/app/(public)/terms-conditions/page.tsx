import type { Metadata } from "next";
import { TermsPageContent } from "@/features/terms/TermsPage";

export const metadata: Metadata = {
  title: "Terms & Conditions — Mobi Prop",
  description:
    "Read the terms and conditions governing the use of Mobi Prop services and platform.",
};

export default function TermsConditionsPage() {
  return <TermsPageContent />;
}
