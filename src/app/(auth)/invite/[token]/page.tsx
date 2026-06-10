import type { Metadata } from "next";

import { InvitePageContent } from "@/features/auth/InvitePage";

export const metadata: Metadata = {
  title: "Accept Invitation — Ulrich Propiedades",
  description: "Complete your staff account setup.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <InvitePageContent token={token} />;
}
