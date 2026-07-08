import "server-only";

import sgMail from "@sendgrid/mail";

import { APP_NAME } from "@/lib/constants";
import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderOtpEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from "@/lib/email-templates";

// SendGrid is read lazily/server-only so a missing key never breaks the build
// or client bundles. In dev without a key, callers still get the invite URL
// back (the row is created); the email is just skipped and logged.
// FROM must be a sender verified in the SendGrid account (Single Sender
// Verification or a domain-authenticated address) or sends will be rejected.
const FROM = process.env.MAIL_FROM ?? `${APP_NAME} <no-reply@ulrichpropiedades.com>`;
const FROM_WELCOME = process.env.MAIL_FROM_WELCOME ?? `${APP_NAME} <hola@ulrichpropiedades.com>`;

let configured = false;

function getSendGrid(): typeof sgMail | null {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return null;
  if (!configured) {
    sgMail.setApiKey(key);
    configured = true;
  }
  return sgMail;
}

type SendResult = { sent: boolean; error?: string };

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<SendResult> {
  const sendgrid = getSendGrid();
  if (!sendgrid) {
    console.warn(`[email] SENDGRID_API_KEY not set — "${params.subject}" to ${params.to} skipped.`);
    return { sent: false, error: "Email service not configured" };
  }

  try {
    await sendgrid.send({
      from: params.from ?? FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { sent: true };
  } catch (err) {
    const error = err as { response?: { body?: { errors?: { message: string }[] } }; message?: string };
    const message = error.response?.body?.errors?.[0]?.message ?? error.message ?? "Unknown error";
    return { sent: false, error: message };
  }
}

export async function sendAgentInvitationEmail(params: {
  to: string;
  inviteUrl: string;
  role: string;
  expiresInDays: number;
}): Promise<SendResult> {
  const { to, inviteUrl, role, expiresInDays } = params;
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const result = await sendEmail({
    to,
    subject: `You've been invited to ${APP_NAME}`,
    html: renderInvitationEmail({ inviteUrl, roleLabel, expiresInDays }),
  });
  if (!result.sent && result.error === "Email service not configured") {
    console.warn(`[email] Invite link for ${to}: ${inviteUrl}`);
  }
  return result;
}

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  expiresMinutes?: number;
  requestedAt?: string;
  device?: string;
  location?: string;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `${params.code} is your ${APP_NAME} verification code`,
    html: renderOtpEmail({ ...params, email: params.to }),
  });
}

export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
  code?: string;
  expiresMinutes?: number;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Your secure sign-in link for ${APP_NAME}`,
    html: renderMagicLinkEmail(params),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  url: string;
  expiresMinutes?: number;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Reset your ${APP_NAME} password`,
    html: renderPasswordResetEmail(params),
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string;
  ctaUrl?: string;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Welcome to ${APP_NAME}`,
    html: renderWelcomeEmail(params),
    from: FROM_WELCOME,
  });
}
