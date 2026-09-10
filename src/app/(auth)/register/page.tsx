import type { Metadata } from "next";
import { SignUpPageContent } from "@/features/auth/SignUpPage";

export const metadata: Metadata = {
  title: "Sign Up — Mobi Prop",
  description: "Create your Mobi Prop account to start browsing properties.",
};

export default function RegisterPage() {
  return <SignUpPageContent />;
}
