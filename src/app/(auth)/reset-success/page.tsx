import type { Metadata } from "next";
import { PasswordResetSuccessPageContent } from "@/features/auth/PasswordResetSuccessPage";

export const metadata: Metadata = {
  title: "Password Reset Successful — Mobi Prop",
  description: "Your password has been successfully reset.",
};

export default function ResetSuccessPage() {
  return <PasswordResetSuccessPageContent />;
}
