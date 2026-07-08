import { APP_NAME, APP_URL } from "@/lib/constants";

/**
 * Branded transactional-email templates (Figma m7m0HOXQCThkxwPegWpTIh, nodes
 * 61-998 / 61-1153 / 61-1380 / 61-1571).
 *
 * Everything is table-based with inline styles so it survives Gmail/Outlook.
 * Renderers are pure string builders — safe to call from scripts as well as
 * server code. Dynamic slots accept Supabase Go-template vars (e.g.
 * `{{ .Token }}`) so the same renderers produce the dashboard paste-ins.
 */

const BRAND = {
  navy: "#0d2138",
  heroFrom: "#16406e",
  heroTo: "#2f6cb5",
  button: "#1e4f86",
  link: "#2f6cb5",
  text: "#1f2937",
  muted: "#6a7282",
  faint: "#9aa3af",
  heroSub: "#c7d7ec",
  heroEyebrow: "#b8cbe4",
  footerText: "#8aa2bd",
  cardBg: "#f8fafc",
  cardBorder: "#e2e8f0",
  canvas: "#eef2f7",
};

const FONT = `'Poppins','Segoe UI',Helvetica,Arial,sans-serif`;

const px = (n: number) => `${n}px`;

function logoTile(size: number): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
    <tr><td align="center" valign="middle" bgcolor="#ffffff" style="width:${px(size)};height:${px(size)};border-radius:${px(Math.round(size * 0.28))};">
      <img src="${APP_URL}/logo.png" width="${Math.round(size * 0.62)}" alt="${APP_NAME}" style="display:block;margin:0 auto;border:0;" />
    </td></tr>
  </table>`;
}

function wordmark(color: string): string {
  return `<div style="font-family:${FONT};color:${color};font-size:18px;font-weight:700;letter-spacing:1px;line-height:1;">ULRICH</div>
    <div style="font-family:${FONT};color:${color};font-size:8px;font-weight:500;letter-spacing:3px;line-height:1;margin-top:4px;">PROPIEDADES</div>`;
}

function header(): string {
  return `<tr><td bgcolor="${BRAND.navy}" style="padding:18px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle">${logoTile(40)}</td>
          <td valign="middle" style="padding-left:12px;">${wordmark("#ffffff")}</td>
        </tr></table>
      </td>
      <td valign="middle" align="right" style="font-family:${FONT};font-size:13px;color:#9fb3c8;white-space:nowrap;">
        <span style="color:#4ade80;font-size:16px;line-height:13px;vertical-align:-2px;">&bull;</span>&nbsp;Secure Email
      </td>
    </tr></table>
  </td></tr>`;
}

function hero(opts: { icon: string; eyebrow?: string; title: string; subtitle: string }): string {
  return `<tr><td align="center" bgcolor="${BRAND.button}" style="background-color:${BRAND.button};background-image:linear-gradient(135deg,${BRAND.heroFrom} 0%,${BRAND.heroTo} 100%);padding:44px 32px 48px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" valign="middle" style="width:64px;height:64px;border-radius:32px;background-color:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.35);">
        <img src="${APP_URL}/assets/email/${opts.icon}" width="30" height="30" alt="" style="display:block;margin:0 auto;border:0;" />
      </td>
    </tr></table>
    ${opts.eyebrow ? `<div style="font-family:${FONT};color:${BRAND.heroEyebrow};font-size:13px;margin-top:20px;">${opts.eyebrow}</div>` : ""}
    <h1 style="font-family:${FONT};color:#ffffff;font-size:28px;font-weight:700;margin:${opts.eyebrow ? "8px" : "20px"} 0 0;line-height:1.3;">${opts.title}</h1>
    <div style="font-family:${FONT};color:${BRAND.heroSub};font-size:15px;line-height:1.6;margin-top:10px;max-width:420px;">${opts.subtitle}</div>
  </td></tr>`;
}

function footer(): string {
  const year = new Date().getFullYear();
  return `<tr><td bgcolor="${BRAND.navy}" align="center" style="padding:32px 28px;">
    ${logoTile(40)}
    <div style="margin-top:8px;">${wordmark("#ffffff")}</div>
    <div style="font-family:${FONT};color:${BRAND.heroEyebrow};font-size:14px;margin-top:14px;">Premium real estate, expertly curated.</div>
    <div style="font-family:${FONT};color:${BRAND.footerText};font-size:13px;margin-top:18px;">
      <a href="mailto:contact@ulrichpropiedades.com" style="color:${BRAND.footerText};text-decoration:none;">contact@ulrichpropiedades.com</a>
    </div>
    <div style="font-family:${FONT};color:${BRAND.footerText};font-size:12px;line-height:1.7;margin-top:16px;">
      &copy; ${year} ${APP_NAME}. All rights reserved.<br />
      <a href="${APP_URL}/privacy-policy" style="color:${BRAND.footerText};text-decoration:underline;">Privacy Policy</a>
      &nbsp;&middot;&nbsp;
      <a href="${APP_URL}/terms-conditions" style="color:${BRAND.footerText};text-decoration:underline;">Terms of Service</a>
    </div>
  </td></tr>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>
    <td align="center" bgcolor="${BRAND.button}" style="border-radius:12px;">
      <a href="${url}" style="display:block;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;padding:16px 24px;border-radius:12px;">${label}</a>
    </td>
  </tr></table>`;
}

function fallbackLink(url: string): string {
  return `<div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};line-height:1.6;margin-top:20px;text-align:center;">
    If the button doesn't work, paste this link into your browser:<br />
    <a href="${url}" style="color:${BRAND.link};word-break:break-all;">${url}</a>
  </div>`;
}

function securityNote(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>
    <td style="background-color:#ffffff;border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:16px 20px;font-family:${FONT};font-size:13px;color:${BRAND.text};line-height:1.6;">
      <img src="${APP_URL}/assets/email/icon-lock.png" width="14" height="14" alt="" style="border:0;vertical-align:-2px;" />&nbsp; <span style="color:${BRAND.link};font-weight:600;">Security reminder:</span> ${html}
    </td>
  </tr></table>`;
}

function layout(opts: {
  preheader: string;
  hero: { icon: string; eyebrow?: string; title: string; subtitle: string };
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${APP_NAME}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${BRAND.canvas};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.canvas}">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;">
      ${header()}
      ${hero(opts.hero)}
      <tr><td bgcolor="#ffffff" style="padding:36px 32px;">${opts.bodyHtml}</td></tr>
      ${footer()}
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* OTP verification code — Figma 61-998                                */
/* ------------------------------------------------------------------ */

export function renderOtpEmail(params: {
  /** Verification code — real digits or a template var like `{{ .Token }}`. */
  code: string;
  /** Recipient email shown in the hero copy; omit for a generic line. */
  email?: string;
  expiresMinutes?: number;
  requestedAt?: string;
  device?: string;
  location?: string;
}): string {
  const { code, email, expiresMinutes = 60, requestedAt, device, location } = params;

  const digits = /^\d{4,8}$/.test(code)
    ? code
        .split("")
        .map(
          (d) => `<td align="center" style="width:56px;height:64px;background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;font-family:${FONT};font-size:28px;font-weight:700;color:${BRAND.heroFrom};">${d}</td><td style="width:10px;font-size:0;">&nbsp;</td>`,
        )
        .join("")
    : `<td align="center" style="height:64px;background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;font-family:${FONT};font-size:28px;font-weight:700;letter-spacing:10px;color:${BRAND.heroFrom};padding:0 24px;">${code}</td>`;

  const metaEntries: Array<[string, string | undefined]> = [
    ["Requested", requestedAt],
    ["Device", device],
    ["Location", location],
  ];
  const presentMeta = metaEntries.filter((e): e is [string, string] => Boolean(e[1]));

  const meta = presentMeta.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border:1px solid #f0f0f0;border-radius:12px;background-color:#fcfcfd;"><tr>
        ${presentMeta
          .map(
            ([k, v], i) =>
              `<td style="padding:16px;${i < presentMeta.length - 1 ? "border-right:1px solid #f0f0f0;" : ""}"><div style="font-family:${FONT};font-size:11px;color:${BRAND.faint};">${k}</div><div style="font-family:${FONT};font-size:13px;font-weight:600;color:${BRAND.text};margin-top:4px;">${v}</div></td>`,
          )
          .join("")}
      </tr></table>`
    : "";

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr>${digits}</tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 0;"><tr>
      <td style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:20px;padding:8px 18px;font-family:${FONT};font-size:13px;font-weight:600;color:#f97316;">&bull;&nbsp; Code expires in ${expiresMinutes} minutes</td>
    </tr></table>
    ${securityNote(`Ulrich will never ask for this code via phone or email. Never share it with anyone.`)}
    ${meta}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:24px;text-align:center;">If you didn't request this code, you can safely ignore this email.</div>`;

  return layout({
    preheader: `Your ${APP_NAME} verification code`,
    hero: {
      icon: "icon-shield.png",
      eyebrow: "Two-Factor Authentication",
      title: "Verify Your Identity",
      subtitle: email
        ? `We sent a 6-digit code to <strong style="color:#ffffff;">${email}</strong>.<br />Enter it below to continue.`
        : "Use the 6-digit code below to continue.",
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Magic link / login with link — Figma 61-1380                        */
/* ------------------------------------------------------------------ */

export function renderMagicLinkEmail(params: {
  /** Sign-in URL — real link or `{{ .ConfirmationURL }}`. */
  url: string;
  /** Optional OTP code to show as an alternative (e.g. `{{ .Token }}`). */
  code?: string;
  expiresMinutes?: number;
}): string {
  const { url, code, expiresMinutes = 60 } = params;

  const codeBlock = code
    ? `<div style="font-family:${FONT};font-size:13px;color:${BRAND.muted};text-align:center;margin-top:24px;">Or enter this code on the sign-in screen:</div>
       <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:10px auto 0;"><tr>
         <td align="center" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;font-family:${FONT};font-size:24px;font-weight:700;letter-spacing:8px;color:${BRAND.heroFrom};padding:12px 24px;">${code}</td>
       </tr></table>`
    : "";

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">Click the button below to securely sign in to your account. No password needed.</div>
    ${button("Sign In to Ulrich", url)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">This link expires in ${expiresMinutes} minutes and can only be used once.</div>
    ${codeBlock}
    ${fallbackLink(url)}
    ${securityNote(`If you didn't try to sign in, you can safely ignore this email — your account is secure.`)}`;

  return layout({
    preheader: `Your secure sign-in link for ${APP_NAME}`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Secure sign-in link",
      title: "Sign In to Ulrich",
      subtitle: "Your one-click sign-in link is ready.<br />It takes you straight to your account.",
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Forgot / reset password — Figma 61-1571                             */
/* ------------------------------------------------------------------ */

export function renderPasswordResetEmail(params: {
  /** Reset URL — real link or `{{ .ConfirmationURL }}`. */
  url: string;
  expiresMinutes?: number;
}): string {
  const { url, expiresMinutes = 60 } = params;

  const step = (n: string, label: string, state: "done" | "active" | "todo") => {
    const circle =
      state === "todo"
        ? `background-color:#ffffff;border:2px solid #d1d5db;color:#9ca3af;`
        : `background-color:${BRAND.heroFrom};border:2px solid ${BRAND.heroFrom};color:#ffffff;`;
    const text = state === "todo" ? "#9ca3af" : BRAND.heroFrom;
    return `<td align="center" style="width:33%;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
        <td align="center" valign="middle" style="width:36px;height:36px;border-radius:18px;${circle}font-family:${FONT};font-size:14px;font-weight:700;">${state === "done" ? "&#10003;" : n}</td>
      </tr></table>
      <div style="font-family:${FONT};font-size:13px;font-weight:600;color:${text};margin-top:8px;">${label}</div>
    </td>`;
  };

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr>
      ${step("1", "Request", "done")}
      ${step("2", "Verify", "active")}
      ${step("3", "Reset", "todo")}
    </tr></table>
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">No worries — it happens. Click the button below to choose a new password.</div>
    ${button("Reset My Password", url)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">This link expires in ${expiresMinutes} minutes and can only be used once.</div>
    ${fallbackLink(url)}
    ${securityNote(`If you didn't request a password reset, ignore this email — your password won't change.`)}`;

  return layout({
    preheader: `Reset your ${APP_NAME} password`,
    hero: {
      icon: "icon-key.png",
      eyebrow: "Password reset",
      title: "Forgot Your Password?",
      subtitle: "Enter a new password in one click.<br />We'll get you back to your account safely.",
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Welcome / registration success — Figma 61-1153                      */
/* ------------------------------------------------------------------ */

export function renderWelcomeEmail(params: { name?: string; ctaUrl?: string }): string {
  const { name, ctaUrl = APP_URL } = params;

  const steps: Array<[string, string, string]> = [
    ["1", "Complete Your Profile", "Add photo and preferences for personalised listings."],
    ["2", "Browse Properties", "Explore thousands of verified premium listings."],
    ["3", "Schedule Viewings", "Book same-day or future tours from any listing page."],
  ];

  const stepRows = steps
    .map(
      ([n, title, desc]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>
        <td style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" style="width:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td align="center" valign="middle" style="width:24px;height:24px;border-radius:12px;background-color:${BRAND.heroFrom};font-family:${FONT};font-size:12px;font-weight:700;color:#ffffff;">${n}</td>
              </tr></table>
            </td>
            <td>
              <div style="font-family:${FONT};font-size:15px;font-weight:600;color:${BRAND.text};">${title}</div>
              <div style="font-family:${FONT};font-size:13px;color:${BRAND.muted};margin-top:4px;line-height:1.5;">${desc}</div>
            </td>
          </tr></table>
        </td>
      </tr></table>`,
    )
    .join("");

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">${
      name ? `Hi <strong>${name}</strong>, your` : "Your"
    } account is ready. Start exploring premium properties today.</div>
    ${button("Explore Properties", ctaUrl)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;"><tr>
      <td style="background-color:${BRAND.cardBg};border-radius:16px;padding:24px;">
        <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${BRAND.heroFrom};text-align:center;">What happens next</div>
        ${stepRows}
      </td>
    </tr></table>`;

  return layout({
    preheader: `Welcome to ${APP_NAME} — your account is ready`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Registration successful",
      title: "Welcome to Ulrich",
      subtitle: "Your account has been created.<br />Start exploring premium properties.",
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Team invitation (restyled to the shared brand layout)               */
/* ------------------------------------------------------------------ */

export function renderInvitationEmail(params: {
  inviteUrl: string;
  roleLabel: string;
  expiresInDays: number;
}): string {
  const { inviteUrl, roleLabel, expiresInDays } = params;

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">You've been invited to join the ${APP_NAME} team as a <strong>${roleLabel}</strong>. Click below to set up your account.</div>
    ${button("Accept Invitation", inviteUrl)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">This link expires in ${expiresInDays} days and can only be used once.</div>
    ${fallbackLink(inviteUrl)}
    ${securityNote(`If you weren't expecting this invitation, you can safely ignore this email.`)}`;

  return layout({
    preheader: `You've been invited to join ${APP_NAME}`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Team invitation",
      title: `Join the ${APP_NAME} Team`,
      subtitle: `You've been invited as a <strong style="color:#ffffff;">${roleLabel}</strong>.<br />Set up your account to get started.`,
    },
    bodyHtml: body,
  });
}
