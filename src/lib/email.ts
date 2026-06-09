import "server-only";

import { Resend } from "resend";

import { APP_NAME } from "@/lib/constants";

// Resend is read lazily/server-only so a missing key never breaks the build or
// client bundles. In dev without a key, callers still get the invite URL back
// (the row is created); the email is just skipped and logged.
const FROM = process.env.MAIL_FROM ?? `${APP_NAME} <onboarding@resend.dev>`;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

type SendResult = { sent: boolean; error?: string };

export async function sendAgentInvitationEmail(params: {
  to: string;
  inviteUrl: string;
  role: string;
  expiresInDays: number;
}): Promise<SendResult> {
  const { to, inviteUrl, role, expiresInDays } = params;

  const resend = getResend();
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — invitation email skipped. Invite link: ${inviteUrl}`,
    );
    return { sent: false, error: "Email service not configured" };
  }

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #0d2138;">You've been invited to ${APP_NAME}</h2>
      <p>You've been invited to join the ${APP_NAME} team as a <strong>${roleLabel}</strong>.</p>
      <p>Click the button below to set up your account. This link expires in ${expiresInDays} days and can only be used once.</p>
      <p style="margin: 28px 0;">
        <a href="${inviteUrl}"
           style="background: #1e4f86; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block; font-weight: 600;">
          Accept invitation
        </a>
      </p>
      <p style="font-size: 12px; color: #6a7282;">If the button doesn't work, paste this link into your browser:<br />${inviteUrl}</p>
      <p style="font-size: 12px; color: #6a7282;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been invited to ${APP_NAME}`,
    html,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}
