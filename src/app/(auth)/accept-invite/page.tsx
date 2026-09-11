import type { Metadata } from "next";

import { AcceptInvitePageContent } from "@/features/auth/AcceptInvitePage";
import { getInvitationByToken } from "@/features/auth/staff-actions";

export const metadata: Metadata = {
  title: "Aceptar invitación — Mobi Prop",
  description: "Completá la configuración de tu cuenta del equipo.",
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AcceptInvitePageContent
        token=""
        email=""
        role=""
        invalidReason="El enlace de invitación está incompleto. Usá el enlace del correo de invitación."
      />
    );
  }

  const result = await getInvitationByToken(token);

  if (!result.ok) {
    return <AcceptInvitePageContent token={token} email="" role="" invalidReason={result.error} />;
  }

  return <AcceptInvitePageContent token={token} email={result.email} role={result.role} />;
}
