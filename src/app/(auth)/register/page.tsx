import type { Metadata } from "next";
import { SignUpPageContent } from "@/features/auth/SignUpPage";

export const metadata: Metadata = {
  title: "Sign Up — Ulrich Propiedades",
  description: "Create your Ulrich Propiedades account to start browsing properties.",
};

export default function RegisterPage() {
  return <SignUpPageContent />;
}
