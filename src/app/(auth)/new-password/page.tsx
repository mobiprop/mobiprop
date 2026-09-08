import type { Metadata } from "next";
import { NewPasswordPageContent } from "@/features/auth/NewPasswordPage";

export const metadata: Metadata = {
  title: "Create New Password — Mobi Prop",
  description: "Set your new account password.",
};

export default function NewPasswordPage() {
  return <NewPasswordPageContent />;
}
