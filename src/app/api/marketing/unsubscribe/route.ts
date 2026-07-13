import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { EmailRecipientStatus } from "@/generated/prisma/enums";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";

// One-click unsubscribe landing for marketing emails. The link in every
// campaign footer carries the recipient's unguessable unsubscribe token
// (cuid, unique per recipient) — no login required, GET is idempotent.
//
// This affects MARKETING mail only: transactional/auth emails (OTP, password
// reset, invitations) are sent by src/lib/email.ts and never consult
// EmailRecipient.status.

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Ulrich Propiedades</title>
</head>
<body style="margin:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:64px 16px;">
    <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:94%;background:#ffffff;border-radius:14px;">
      <tr><td style="background:#1e4f86;border-radius:14px 14px 0 0;padding:20px 32px;">
        <span style="font-size:16px;font-weight:bold;color:#ffffff;letter-spacing:0.4px;">ULRICH PROPIEDADES</span>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0d2138;">${title}</h1>
        <p style="margin:0;font-size:14px;line-height:22px;color:#6a7282;">${body}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

function html(markup: string, status = 200): NextResponse {
  return new NextResponse(markup, { status, headers: { "Content-Type": "text/html;charset=utf-8" } });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return html(
      page(
        "Unsubscribe",
        "This unsubscribe link is missing its identifier. Please use the unsubscribe link from a recent email, or contact us at hola@ulrichpropiedades.com.",
      ),
      400,
    );
  }

  const recipient = await prisma.emailRecipient.findUnique({ where: { unsubscribeToken: token } });
  if (!recipient) {
    return html(
      page(
        "Link not recognised",
        "We could not find a subscription for this link. You may already be unsubscribed, or the link has expired.",
      ),
      404,
    );
  }

  if (recipient.status !== EmailRecipientStatus.UNSUBSCRIBED) {
    await prisma.emailRecipient.update({
      where: { id: recipient.id },
      data: { status: EmailRecipientStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });
    await logActivity({
      actorId: null,
      action: "EMAIL_RECIPIENT_UNSUBSCRIBED",
      entityType: "EMAIL_RECIPIENT",
      entityId: recipient.id,
      newValues: { email: recipient.email, via: "unsubscribe-link" },
    });
  }

  return html(
    page(
      "You're unsubscribed",
      `${recipient.email} will no longer receive marketing emails from Ulrich Propiedades. Transactional emails about your account or ongoing transactions are not affected. Unsubscribed by mistake? Write to hola@ulrichpropiedades.com and we'll add you back.`,
    ),
  );
}

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post) support. */
export async function POST(req: Request) {
  return GET(req);
}
