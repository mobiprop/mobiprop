import "server-only";

import sgMail from "@sendgrid/mail";

import { APP_NAME, APP_URL } from "@/lib/constants";
import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderOtpEmail,
  renderPasswordResetEmail,
  renderTourCancelledEmail,
  renderTourConfirmedEmail,
  renderTourRescheduledEmail,
  renderWelcomeEmail,
} from "@/lib/email-templates";

// SendGrid is read lazily/server-only so a missing key never breaks the build
// or client bundles. In dev without a key, callers still get the invite URL
// back (the row is created); the email is just skipped and logged.
// FROM must be a sender verified in the SendGrid account (Single Sender
// Verification or a domain-authenticated address) or sends will be rejected.
const FROM = process.env.MAIL_FROM ?? `${APP_NAME} <hola@mobiprop.com.ar>`;
const FROM_WELCOME = process.env.MAIL_FROM_WELCOME ?? `${APP_NAME} <hola@mobiprop.com.ar>`;

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
      trackingSettings: { clickTracking: { enable: false, enableText: false } },
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
    subject: `${params.code} es tu código de verificación de ${APP_NAME}`,
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
    subject: `Restablecé tu contraseña de ${APP_NAME}`,
    html: renderPasswordResetEmail(params),
  });
}

export async function sendTourConfirmedEmail(params: {
  to: string;
  submittedName: string;
  tourNumber: string;
  scheduledAtLabel: string;
  durationLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  agentName?: string | null;
  confirmationNote?: string | null;
  property?: import("./transactional-email-design").EmailProperty;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Tu visita está confirmada — ${APP_NAME}`,
    html: renderTourConfirmedEmail({ ...params, ctaUrl: `${APP_URL}/profile` }),
  });
}

export async function sendTourRequestedEmail(params: {
  to: string;
  submittedName: string;
  tourNumber: string;
  scheduledAtLabel: string;
  durationLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  agentName?: string | null;
  confirmationNote?: string | null;
  property?: import("./transactional-email-design").EmailProperty;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Recibimos tu solicitud de visita — ${APP_NAME}`,
    html: renderTourConfirmedEmail({ ...params, requested: true, ctaUrl: `${APP_URL}/profile` }),
  });
}

export async function sendTourRescheduledEmail(params: {
  to: string;
  submittedName: string;
  tourNumber: string;
  previousScheduledAtLabel: string;
  newScheduledAtLabel: string;
  durationLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  agentName?: string | null;
  rescheduleNote?: string | null;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Your tour has a new time — ${APP_NAME}`,
    html: renderTourRescheduledEmail({ ...params, ctaUrl: `${APP_URL}/profile` }),
  });
}

export async function sendTourCancelledEmail(params: {
  to: string;
  submittedName: string;
  tourNumber: string;
  scheduledAtLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  cancellationReason?: string | null;
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Your tour has been cancelled — ${APP_NAME}`,
    html: renderTourCancelledEmail({ ...params, ctaUrl: `${APP_URL}/listings` }),
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name?: string;
  ctaUrl?: string;
  properties?: import("./transactional-email-design").EmailProperty[];
}): Promise<SendResult> {
  return sendEmail({
    to: params.to,
    subject: `Te damos la bienvenida a ${APP_NAME}`,
    html: renderWelcomeEmail(params),
    from: FROM_WELCOME,
  });
}
