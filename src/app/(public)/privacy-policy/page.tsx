import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/features/privacy/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Mobi Prop",
  description:
    "Learn how Mobi Prop collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
