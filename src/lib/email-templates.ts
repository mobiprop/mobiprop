import { APP_NAME, APP_URL } from "@/lib/constants";

/**
 * Branded transactional-email templates. Current Figma welcome, verification,
 * reset and visit designs are implemented in transactional-email-design.ts.
 *
 * Everything is table-based with inline styles so it survives Gmail/Outlook.
 * Renderers are pure string builders — safe to call from scripts as well as
 * server code. Dynamic slots accept Supabase Go-template vars (e.g.
 * `{{ .Token }}`) so the same renderers produce the dashboard paste-ins.
 */

// Shared with the marketing/newsletter templates (email-marketing-templates.ts)
// Campaign and legacy notification templates retain this shell.
export const BRAND = {
  navy: "#0d2138",
  heroFrom: "#005ea4",
  heroTo: "#0077cc",
  button: "#005ea4",
  link: "#005089",
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

export const FONT = `'Poppins','Segoe UI',Helvetica,Arial,sans-serif`;

const px = (n: number) => `${n}px`;

function logoTile(size: number): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
    <tr><td align="center" valign="middle" bgcolor="#ffffff" style="width:${px(size)};height:${px(size)};border-radius:${px(Math.round(size * 0.28))};">
      <img src="${APP_URL}/assets/email/mobi-logo.png" width="${Math.round(size * 0.62)}" alt="${APP_NAME}" style="display:block;margin:0 auto;border:0;" />
    </td></tr>
  </table>`;
}

function wordmark(color: string): string {
  return `<div style="font-family:${FONT};color:${color};font-size:22px;font-weight:500;line-height:1.2;">Mobi <span style="font-weight:300;">Prop</span></div>`;
}

export function header(): string {
  return `<tr><td bgcolor="${BRAND.navy}" style="padding:18px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle">${logoTile(40)}</td>
          <td valign="middle" style="padding-left:12px;">${wordmark("#ffffff")}</td>
        </tr></table>
      </td>
      <td valign="middle" align="right" style="font-family:${FONT};font-size:13px;color:#9fb3c8;white-space:nowrap;">
        <span style="color:#4ade80;font-size:16px;line-height:13px;vertical-align:-2px;">&bull;</span>&nbsp;Correo Seguro
      </td>
    </tr></table>
  </td></tr>`;
}

export function hero(opts: { icon: string; eyebrow?: string; title: string; subtitle: string }): string {
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

export function footer(): string {
  const year = new Date().getFullYear();
  return `<tr><td bgcolor="${BRAND.navy}" align="center" style="padding:32px 28px;">
    ${logoTile(40)}
    <div style="margin-top:8px;">${wordmark("#ffffff")}</div>
    <div style="font-family:${FONT};color:${BRAND.heroEyebrow};font-size:14px;margin-top:14px;">Bienes raíces premium, curados por expertos.</div>
    <div style="font-family:${FONT};color:${BRAND.footerText};font-size:13px;margin-top:18px;">
      <a href="mailto:hola@mobiprop.com.ar" style="color:${BRAND.footerText};text-decoration:none;">hola@mobiprop.com.ar</a>
    </div>
    <div style="font-family:${FONT};color:${BRAND.footerText};font-size:12px;line-height:1.7;margin-top:16px;">
      &copy; ${year} ${APP_NAME}. Todos los derechos reservados.<br />
      <a href="${APP_URL}/privacy-policy" style="color:${BRAND.footerText};text-decoration:underline;">Política de Privacidad</a>
      &nbsp;&middot;&nbsp;
      <a href="${APP_URL}/terms-conditions" style="color:${BRAND.footerText};text-decoration:underline;">Términos de Servicio</a>
    </div>
  </td></tr>`;
}

export function button(label: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>
    <td align="center" bgcolor="${BRAND.button}" style="border-radius:12px;">
      <a href="${url}" style="display:block;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;padding:16px 24px;border-radius:12px;">${label}</a>
    </td>
  </tr></table>`;
}

function fallbackLink(url: string): string {
  return `<div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};line-height:1.6;margin-top:20px;text-align:center;">
    Si el botón no funciona, copiá este enlace en tu navegador:<br />
    <a href="${url}" style="color:${BRAND.link};word-break:break-all;">${url}</a>
  </div>`;
}

function securityNote(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>
    <td style="background-color:#ffffff;border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:16px 20px;font-family:${FONT};font-size:13px;color:${BRAND.text};line-height:1.6;">
      <img src="${APP_URL}/assets/email/icon-lock.png" width="14" height="14" alt="" style="border:0;vertical-align:-2px;" />&nbsp; <span style="color:${BRAND.link};font-weight:600;">Recordatorio de seguridad:</span> ${html}
    </td>
  </tr></table>`;
}

function layout(opts: {
  preheader: string;
  hero: { icon: string; eyebrow?: string; title: string; subtitle: string };
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
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
    ? `<div style="font-family:${FONT};font-size:13px;color:${BRAND.muted};text-align:center;margin-top:24px;">O ingresá este código en la pantalla de inicio de sesión:</div>
       <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:10px auto 0;"><tr>
         <td align="center" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;font-family:${FONT};font-size:24px;font-weight:700;letter-spacing:8px;color:${BRAND.heroFrom};padding:12px 24px;">${code}</td>
       </tr></table>`
    : "";

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">Hacé clic en el botón de abajo para iniciar sesión de forma segura. No necesitás contraseña.</div>
    ${button("Iniciar Sesión en Ulrich", url)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">Este enlace expira en ${expiresMinutes} minutos y solo puede usarse una vez.</div>
    ${codeBlock}
    ${fallbackLink(url)}
    ${securityNote(`Si no intentaste iniciar sesión, podés ignorar este email de forma segura — tu cuenta está protegida.`)}`;

  return layout({
    preheader: `Tu enlace seguro de inicio de sesión para ${APP_NAME}`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Enlace seguro de inicio de sesión",
      title: "Iniciar Sesión en Ulrich",
      subtitle: "Tu enlace de inicio de sesión con un clic está listo.<br />Te lleva directo a tu cuenta.",
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Forgot / reset password — Figma 61-1571                             */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Welcome / registration success — Figma 61-1153                      */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Tour confirmed — same brand shell as the auth emails above           */
/* ------------------------------------------------------------------ */

function detailRow(label: string, value: string, isLast: boolean): string {
  return `<tr>
    <td style="padding:14px 20px;${isLast ? "" : `border-bottom:1px solid ${BRAND.cardBorder};`}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:${FONT};font-size:13px;color:${BRAND.muted};width:110px;" valign="top">${label}</td>
        <td style="font-family:${FONT};font-size:14px;font-weight:600;color:${BRAND.text};">${value}</td>
      </tr></table>
    </td>
  </tr>`;
}

function detailCard(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;overflow:hidden;">
    ${rows.map(([label, value], i) => detailRow(label, value, i === rows.length - 1)).join("")}
  </table>`;
}

function agentNoteBox(label: string, note: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;"><tr>
      <td style="background-color:#ffffff;border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:16px 20px;font-family:${FONT};font-size:13px;color:${BRAND.text};line-height:1.6;">
        <span style="color:${BRAND.link};font-weight:600;">${label}:</span> ${note}
      </td>
    </tr></table>`;
}


/* ------------------------------------------------------------------ */
/* Tour rescheduled                                                     */
/* ------------------------------------------------------------------ */

export function renderTourRescheduledEmail(params: {
  submittedName: string;
  tourNumber: string;
  /** Pre-formatted previous date/time. */
  previousScheduledAtLabel: string;
  /** Pre-formatted new date/time. */
  newScheduledAtLabel: string;
  durationLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  agentName?: string | null;
  rescheduleNote?: string | null;
  ctaUrl: string;
}): string {
  const {
    submittedName, tourNumber, previousScheduledAtLabel, newScheduledAtLabel, durationLabel,
    propertyTitle, propertyLocation, agentName, rescheduleNote, ctaUrl,
  } = params;

  const rows: Array<[string, string]> = [
    ...(propertyTitle ? [["Propiedad", propertyLocation ? `${propertyTitle} — ${propertyLocation}` : propertyTitle] as [string, string]] : []),
    ["Horario Anterior", `<span style="text-decoration:line-through;color:${BRAND.faint};font-weight:400;">${previousScheduledAtLabel}</span>`],
    ["Nueva Fecha y Hora", newScheduledAtLabel],
    ["Duración", durationLabel],
    ...(agentName ? [["Agente", agentName] as [string, string]] : []),
    ["Referencia", tourNumber],
  ];

  const note = rescheduleNote ? agentNoteBox("Nota de tu agente", rescheduleNote) : "";

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">Hola <strong>${submittedName}</strong>, tu recorrido de la propiedad fue reprogramado. Estos son los detalles actualizados:</div>
    ${detailCard(rows)}
    ${note}
    ${button("Ver Mis Recorridos", ctaUrl)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">¿No podés en el nuevo horario? Podés gestionar este recorrido desde tu cuenta.</div>`;

  return layout({
    preheader: `Tu recorrido${propertyTitle ? ` para ${propertyTitle}` : ""} fue reprogramado`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Recorrido reprogramado",
      title: "Tu Recorrido Tiene un Nuevo Horario",
      subtitle: `Nos vemos el <strong style="color:#ffffff;">${newScheduledAtLabel}</strong>.`,
    },
    bodyHtml: body,
  });
}

/* ------------------------------------------------------------------ */
/* Tour cancelled                                                       */
/* ------------------------------------------------------------------ */

export function renderTourCancelledEmail(params: {
  submittedName: string;
  tourNumber: string;
  /** Pre-formatted date/time of the cancelled tour. */
  scheduledAtLabel: string;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  cancellationReason?: string | null;
  /** "Browse listings" URL. */
  ctaUrl: string;
}): string {
  const { submittedName, tourNumber, scheduledAtLabel, propertyTitle, propertyLocation, cancellationReason, ctaUrl } = params;

  const rows: Array<[string, string]> = [
    ...(propertyTitle ? [["Propiedad", propertyLocation ? `${propertyTitle} — ${propertyLocation}` : propertyTitle] as [string, string]] : []),
    ["Estaba Programado Para", scheduledAtLabel],
    ["Referencia", tourNumber],
  ];

  const note = cancellationReason ? agentNoteBox("Motivo", cancellationReason) : "";

  const body = `
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">Hola <strong>${submittedName}</strong>, tu recorrido de la propiedad fue cancelado.</div>
    ${detailCard(rows)}
    ${note}
    ${button("Explorar Propiedades", ctaUrl)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">¿Querés reservar otro horario? Visitá la página de la propiedad para agendar un nuevo recorrido.</div>`;

  return layout({
    preheader: `Tu recorrido${propertyTitle ? ` para ${propertyTitle}` : ""} fue cancelado`,
    hero: {
      icon: "icon-shield.png",
      eyebrow: "Recorrido cancelado",
      title: "Tu Recorrido fue Cancelado",
      subtitle: `Tu visita originalmente programada para <strong style="color:#ffffff;">${scheduledAtLabel}</strong> fue cancelada.`,
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
    <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;text-align:center;">Fuiste invitado a unirte al equipo de ${APP_NAME} como <strong>${roleLabel}</strong>. Hacé clic abajo para configurar tu cuenta.</div>
    ${button("Aceptar Invitación", inviteUrl)}
    <div style="font-family:${FONT};font-size:12px;color:${BRAND.muted};margin-top:16px;text-align:center;">Este enlace expira en ${expiresInDays} días y solo puede usarse una vez.</div>
    ${fallbackLink(inviteUrl)}
    ${securityNote(`Si no esperabas esta invitación, podés ignorar este email de forma segura.`)}`;

  return layout({
    preheader: `Fuiste invitado a unirte a ${APP_NAME}`,
    hero: {
      icon: "icon-check.png",
      eyebrow: "Invitación al equipo",
      title: `Unite al Equipo de ${APP_NAME}`,
      subtitle: `Fuiste invitado como <strong style="color:#ffffff;">${roleLabel}</strong>.<br />Configurá tu cuenta para empezar.`,
    },
    bodyHtml: body,
  });
}

export { renderVerificationDesign as renderOtpEmail, renderResetDesign as renderPasswordResetEmail, renderWelcomeDesign as renderWelcomeEmail, renderVisitDesign as renderTourConfirmedEmail } from "./transactional-email-design";
