import type { Metadata } from "next";

import { AcceptInvitePageContent } from "@/features/auth/AcceptInvitePage";
import { getInvitationByToken } from "@/features/auth/staff-actions";

export const metadata: Metadata = {
  title: "Accept Invitation — Mobi Prop",
  description: "Complete your staff account setup.",
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
        invalidReason="This invitation link is missing its token. Please use the link from your invitation email."
      />
    );
  }

  const result = await getInvitationByToken(token);

  if (!result.ok) {
    return <AcceptInvitePageContent token={token} email="" role="" invalidReason={result.error} />;
  }

  return <AcceptInvitePageContent token={token} email={result.email} role={result.role} />;
}
