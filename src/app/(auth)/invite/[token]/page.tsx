import type { Metadata } from "next";

import { InvitePageContent } from "@/features/auth/InvitePage";

export const metadata: Metadata = {
  title: "Aceptar invitación — Mobi Prop",
  description: "Completá la configuración de tu cuenta del equipo.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <InvitePageContent token={token} />;
}
