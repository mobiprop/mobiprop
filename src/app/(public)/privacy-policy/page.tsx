import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/features/privacy/PrivacyPage";

export const metadata: Metadata = {
  title: "Política de privacidad — Mobi Prop",
  description: "Conocé cómo Mobi Prop recopila, utiliza y protege tu información personal.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
