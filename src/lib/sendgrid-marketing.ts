import "server-only";

// Server-only SendGrid client for the MARKETING/newsletter module. Kept fully
// separate from src/lib/email.ts (transactional/auth mail): campaigns send
// from mailing@ulrichpropiedades.com, carry an unsubscribe link, and honour
// marketing unsubscribe status — none of which applies to OTP/reset mail.
//
// The API key lives in SENDGRID_API_KEY only. Nothing in this file is ever
// imported by client code, and no function returns the key or any secret.

import { createVerify } from "crypto";

import { APP_URL } from "@/lib/constants";

const SENDGRID_API_BASE = "https://api.sendgrid.com/v3";

/** Marketing sender — campaigns must never send from no-reply@. */
export const NEWSLETTER_FROM_EMAIL = "mailing@ulrichpropiedades.com";
export const NEWSLETTER_FROM_NAME = "Ulrich Propiedades";

/** Max personalizations per SendGrid mail/send request (API limit is 1000). */
const SEND_BATCH_SIZE = 500;
/** Pause between batch requests so a large campaign never bursts the API. */
const BATCH_DELAY_MS = 500;

export function isSendgridConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

export function isWebhookVerificationConfigured(): boolean {
  return Boolean(process.env.SENDGRID_WEBHOOK_PUBLIC_KEY);
}

export type SendgridConfigStatus = {
  apiKey: boolean;
  webhookPublicKey: boolean;
  newsletterSender: string;
};

export function getSendgridConfigStatus(): SendgridConfigStatus {
  return {
    apiKey: isSendgridConfigured(),
    webhookPublicKey: isWebhookVerificationConfigured(),
    newsletterSender: NEWSLETTER_FROM_EMAIL,
  };
}

function authHeaders(): Record<string, string> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SENDGRID_API_KEY is not configured");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function extractSendgridError(body: unknown): string {
  const errors = (body as { errors?: { message?: string }[] } | null)?.errors;
  return errors?.[0]?.message ?? "SendGrid request failed";
}

// ── Connection / sender verification ─────────────────────────────────────────

export type SendgridConnectionInfo = {
  ok: boolean;
  error?: string;
  /** Verified single senders on the account (email → verified flag). */
  senders: { email: string; verified: boolean }[];
  /** Authenticated domains (domain → valid flag). */
  domains: { domain: string; valid: boolean }[];
  /** Whether the newsletter sender is usable (verified sender or valid domain). */
  newsletterSenderReady: boolean;
};

/**
 * Read-only connection test: verifies the API key by listing verified senders
 * and authenticated domains. Never sends mail.
 */
export async function testSendgridConnection(): Promise<SendgridConnectionInfo> {
  if (!isSendgridConfigured()) {
    return { ok: false, error: "SENDGRID_API_KEY is not configured", senders: [], domains: [], newsletterSenderReady: false };
  }
  try {
    const [sendersRes, domainsRes] = await Promise.all([
      fetch(`${SENDGRID_API_BASE}/verified_senders`, { headers: authHeaders(), cache: "no-store" }),
      fetch(`${SENDGRID_API_BASE}/whitelabel/domains`, { headers: authHeaders(), cache: "no-store" }),
    ]);
    if (!sendersRes.ok && !domainsRes.ok) {
      const body = await sendersRes.json().catch(() => null);
      return { ok: false, error: extractSendgridError(body), senders: [], domains: [], newsletterSenderReady: false };
    }

    const sendersBody = sendersRes.ok
      ? ((await sendersRes.json()) as { results?: { from_email?: string; verified?: boolean }[] })
      : { results: [] };
    const domainsBody = domainsRes.ok
      ? ((await domainsRes.json()) as { domain?: string; valid?: boolean }[])
      : [];

    const senders = (sendersBody.results ?? []).map((s) => ({
      email: s.from_email ?? "",
      verified: Boolean(s.verified),
    }));
    const domains = (Array.isArray(domainsBody) ? domainsBody : []).map((d) => ({
      domain: d.domain ?? "",
      valid: Boolean(d.valid),
    }));

    const senderDomain = NEWSLETTER_FROM_EMAIL.split("@")[1];
    const newsletterSenderReady =
      senders.some((s) => s.verified && s.email.toLowerCase() === NEWSLETTER_FROM_EMAIL) ||
      domains.some((d) => d.valid && senderDomain.endsWith(d.domain));

    return { ok: true, senders, domains, newsletterSenderReady };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not reach SendGrid",
      senders: [],
      domains: [],
      newsletterSenderReady: false,
    };
  }
}

// ── Unsubscribe link ─────────────────────────────────────────────────────────

export function unsubscribeUrlFor(token: string): string {
  return `${APP_URL}/api/marketing/unsubscribe?token=${token}`;
}

/**
 * Compliance footer appended to every campaign email. `%unsubscribe_url%` is
 * replaced per-recipient via SendGrid substitutions at send time.
 */
export function marketingFooterHtml(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e5e7eb;">
    <tr>
      <td style="padding:20px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
        <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#6a7282;">
          You are receiving this email because you subscribed to updates from Ulrich Propiedades.
        </p>
        <p style="margin:0;font-size:12px;line-height:18px;color:#6a7282;">
          <a href="%unsubscribe_url%" style="color:#1e4f86;text-decoration:underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Ulrich Propiedades, Mar del Plata, Argentina
        </p>
      </td>
    </tr>
  </table>`;
}

// ── Sending ──────────────────────────────────────────────────────────────────

export type CampaignSendTarget = {
  email: string;
  firstName: string | null;
  unsubscribeToken: string;
  /** EmailCampaignRecipient row id — round-trips through webhook custom_args. */
  campaignRecipientId: string;
};

export type CampaignMessage = {
  campaignDbId: string;
  subject: string;
  previewText: string | null;
  htmlBody: string;
  fromName: string;
  fromEmail: string;
  clickTracking: boolean;
  openTracking: boolean;
  sandboxMode: boolean;
};

type BatchOutcome = {
  sentEmails: string[];
  failedEmails: string[];
  error?: string;
};

function buildHtml(message: CampaignMessage): string {
  let html = message.htmlBody;

  // Hidden preheader (inbox preview text) — inject just inside <body> when the
  // template is a full HTML document, else prepend.
  if (message.previewText) {
    const preheader = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(message.previewText)}</div>`;
    const bodyTag = /<body[^>]*>/i.exec(html);
    html = bodyTag
      ? html.replace(bodyTag[0], `${bodyTag[0]}${preheader}`)
      : `${preheader}${html}`;
  }

  // Compliance footer: the built-in templates already carry a branded
  // unsubscribe bar (%unsubscribe_url% present). Only fully custom HTML
  // without one gets the generic fallback footer appended — inside </body>
  // when there is one, so the document stays valid.
  if (!html.includes("%unsubscribe_url%")) {
    const closeIdx = html.toLowerCase().lastIndexOf("</body>");
    html =
      closeIdx >= 0
        ? `${html.slice(0, closeIdx)}${marketingFooterHtml()}${html.slice(closeIdx)}`
        : `${html}${marketingFooterHtml()}`;
  }

  return html;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends one campaign to `targets` in chunked mail/send requests. Each
 * personalization carries per-recipient substitutions (%unsubscribe_url%,
 * %first_name%) and custom_args (campaign id + recipient row id) that come
 * back on every webhook event for exact attribution.
 *
 * Returns which emails were accepted by SendGrid and which chunks failed —
 * the caller persists per-recipient outcomes.
 */
export async function sendCampaignBatches(
  message: CampaignMessage,
  targets: CampaignSendTarget[],
  batchId: string,
): Promise<BatchOutcome> {
  const html = buildHtml(message);
  const sentEmails: string[] = [];
  const failedEmails: string[] = [];
  let firstError: string | undefined;

  for (let i = 0; i < targets.length; i += SEND_BATCH_SIZE) {
    const chunk = targets.slice(i, i + SEND_BATCH_SIZE);
    const payload = {
      from: { email: message.fromEmail, name: message.fromName },
      subject: message.subject,
      content: [{ type: "text/html", value: html }],
      personalizations: chunk.map((t) => ({
        to: [{ email: t.email }],
        substitutions: {
          "%unsubscribe_url%": unsubscribeUrlFor(t.unsubscribeToken),
          "%first_name%": t.firstName ?? "there",
        },
        custom_args: {
          up_campaign_id: message.campaignDbId,
          up_campaign_recipient_id: t.campaignRecipientId,
          up_batch_id: batchId,
        },
      })),
      headers: {
        // One-click unsubscribe for Gmail/Yahoo bulk-sender compliance.
        "List-Unsubscribe": `<${APP_URL}/api/marketing/unsubscribe>`,
      },
      tracking_settings: {
        click_tracking: { enable: message.clickTracking },
        open_tracking: { enable: message.openTracking },
      },
      mail_settings: {
        sandbox_mode: { enable: message.sandboxMode },
      },
      categories: ["marketing-campaign"],
    };

    try {
      const res = await fetch(`${SENDGRID_API_BASE}/mail/send`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        sentEmails.push(...chunk.map((t) => t.email));
      } else {
        const body = await res.json().catch(() => null);
        firstError = firstError ?? extractSendgridError(body);
        failedEmails.push(...chunk.map((t) => t.email));
      }
    } catch (err) {
      firstError = firstError ?? (err instanceof Error ? err.message : "SendGrid request failed");
      failedEmails.push(...chunk.map((t) => t.email));
    }

    if (i + SEND_BATCH_SIZE < targets.length) await sleep(BATCH_DELAY_MS);
  }

  return { sentEmails, failedEmails, error: firstError };
}

/**
 * Sends a single TEST email for a campaign. Marked in the subject, never
 * attributed to campaign metrics (no campaign custom_args), and the
 * unsubscribe link is a non-functional placeholder.
 */
export async function sendCampaignTest(
  message: Omit<CampaignMessage, "campaignDbId"> & { campaignDbId?: string },
  to: string[],
): Promise<{ sent: boolean; error?: string }> {
  const html = buildHtml({ ...message, campaignDbId: message.campaignDbId ?? "" }).replace(
    /%unsubscribe_url%/g,
    `${APP_URL}/api/marketing/unsubscribe`,
  ).replace(/%first_name%/g, "there");

  try {
    const res = await fetch(`${SENDGRID_API_BASE}/mail/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        from: { email: message.fromEmail, name: message.fromName },
        subject: `[Test] ${message.subject}`,
        content: [{ type: "text/html", value: html }],
        personalizations: to.map((email) => ({ to: [{ email }] })),
        mail_settings: { sandbox_mode: { enable: message.sandboxMode } },
        categories: ["marketing-campaign-test"],
      }),
    });
    if (res.ok) return { sent: true };
    const body = await res.json().catch(() => null);
    return { sent: false, error: extractSendgridError(body) };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "SendGrid request failed" };
  }
}

// ── Event webhook signature verification ─────────────────────────────────────

/**
 * Verifies SendGrid's Signed Event Webhook (ECDSA P-256 / SHA-256 over
 * timestamp + raw body). Returns false when the signature is missing or bad.
 * Requires SENDGRID_WEBHOOK_PUBLIC_KEY (base64 public key from the SendGrid
 * webhook settings UI).
 */
export function verifyWebhookSignature(params: {
  publicKey: string;
  payload: string;
  signature: string | null;
  timestamp: string | null;
}): boolean {
  if (!params.signature || !params.timestamp) return false;
  try {
    const pem = `-----BEGIN PUBLIC KEY-----\n${params.publicKey}\n-----END PUBLIC KEY-----`;
    const verifier = createVerify("sha256");
    verifier.update(params.timestamp + params.payload);
    return verifier.verify(pem, Buffer.from(params.signature, "base64"));
  } catch {
    return false;
  }
}
