import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/features/privacy/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Ulrich Propiedades",
  description:
    "Learn how Ulrich Propiedades collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
