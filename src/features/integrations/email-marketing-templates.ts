// Built-in marketing email templates for the SendGrid campaign editor.
//
// These render on the SAME brand shell as the auth/transactional emails
// (src/lib/email-templates.ts — navy header + gradient hero + navy footer),
// so a newsletter looks exactly like the OTP/welcome emails the client
// approved from Figma. Each template is a full self-contained HTML document;
// what you see in the editor preview is byte-for-byte what gets sent (the
// server only injects the hidden preheader and per-recipient substitutions).
//
// Dynamic slots:
//   %first_name%       — replaced per recipient at send time
//   %unsubscribe_url%  — per-recipient unsubscribe link (in the compliance bar)
//   PROPERTIES block   — real listings picked in the campaign editor, rendered
//                        as property cards between the PROPERTIES markers.
//
// No secrets, no server deps — imported by both the wizard UI and the server.

import { APP_NAME, APP_URL } from "@/lib/constants";
import { BRAND, FONT, header, hero, footer, button } from "@/lib/email-templates";

export type MarketingTemplateKey =
  | "new-listing-alert"
  | "monthly-market-report"
  | "lead-follow-up"
  | "blank";

export type MarketingTemplate = {
  key: MarketingTemplateKey;
  name: string;
  category: "Marketing";
  subject: string;
  previewText: string;
  /** True when the template contains a PROPERTIES block the editor can fill. */
  supportsProperties: boolean;
  html: string;
};

/** Listing data needed to render one property card in an email. */
export type EmailListingCard = {
  id: string;
  listingId: string;
  title: string;
  location: string;
  priceLabel: string;
  bedrooms: number | null;
  bathrooms: number | null;
  totalAreaM2: number | null;
  coverImageUrl: string | null;
  url: string;
};

// ── Featured-properties block ────────────────────────────────────────────────
// The editor swaps the content between these markers whenever the user picks
// listings; the ids ride along in the START marker so reopening a draft can
// rehydrate the selection.

export const PROPERTIES_START = "<!--PROPERTIES:START";
export const PROPERTIES_BLOCK_RE =
  /<!--PROPERTIES:START(?: ids=([A-Za-z0-9,_-]*))?-->[\s\S]*?<!--PROPERTIES:END-->/;

export function parsePropertiesBlockIds(html: string): string[] | null {
  const match = PROPERTIES_BLOCK_RE.exec(html);
  if (!match) return null;
  return (match[1] ?? "").split(",").filter(Boolean);
}

function propertiesPlaceholder(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr>
    <td align="center" style="border:2px dashed ${BRAND.cardBorder};border-radius:12px;padding:28px 20px;font-family:${FONT};font-size:13px;color:${BRAND.faint};line-height:1.6;">
      Las propiedades destacadas van a aparecer acá.<br />Seleccionalas en &ldquo;Propiedades Destacadas&rdquo; dentro del editor de campaña.
    </td>
  </tr></table>`;
}

export function renderListingCardsHtml(cards: EmailListingCard[]): string {
  if (cards.length === 0) return propertiesPlaceholder();
  return cards
    .map((card) => {
      const meta = [
        card.bedrooms != null ? `${card.bedrooms} dorm.` : null,
        card.bathrooms != null ? `${card.bathrooms} baños` : null,
        card.totalAreaM2 != null ? `${card.totalAreaM2} m²` : null,
      ]
        .filter(Boolean)
        .join(" &nbsp;&middot;&nbsp; ");

      const image = card.coverImageUrl
        ? `<tr><td><a href="${card.url}" style="text-decoration:none;"><img src="${card.coverImageUrl}" width="536" alt="${escapeAttr(card.title)}" style="display:block;width:100%;height:auto;border:0;border-radius:12px 12px 0 0;" /></a></td></tr>`
        : "";

      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border:1px solid ${BRAND.cardBorder};border-radius:12px;background-color:#ffffff;">
        ${image}
        <tr><td style="padding:18px 20px;">
          <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${BRAND.text};line-height:1.4;">
            <a href="${card.url}" style="color:${BRAND.text};text-decoration:none;">${escapeAttr(card.title)}</a>
          </div>
          <div style="font-family:${FONT};font-size:13px;color:${BRAND.muted};margin-top:4px;">${escapeAttr(card.location)}</div>
          ${meta ? `<div style="font-family:${FONT};font-size:13px;color:${BRAND.muted};margin-top:8px;">${meta}</div>` : ""}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>
            <td style="font-family:${FONT};font-size:17px;font-weight:700;color:${BRAND.button};">${escapeAttr(card.priceLabel)}</td>
            <td align="right"><a href="${card.url}" style="font-family:${FONT};font-size:13px;font-weight:600;color:${BRAND.link};text-decoration:none;">Ver Propiedad &rarr;</a></td>
          </tr></table>
        </td></tr>
      </table>`;
    })
    .join("");
}

export function buildPropertiesBlock(cards: EmailListingCard[]): string {
  const ids = cards.map((c) => c.id).join(",");
  return `<!--PROPERTIES:START ids=${ids}-->${renderListingCardsHtml(cards)}<!--PROPERTIES:END-->`;
}

/** Replaces the PROPERTIES block in a template body with the given cards. */
export function replacePropertiesBlock(html: string, cards: EmailListingCard[]): string {
  return html.replace(PROPERTIES_BLOCK_RE, buildPropertiesBlock(cards));
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Simple-editor blocks ──────────────────────────────────────────────────
// Non-technical marketers edit a campaign's message, banner image and CTA
// button through plain text boxes (CampaignWizardModal's "Simple" tab)
// instead of hand-editing HTML. Each block's raw value rides along
// URL-encoded in the marker comment (same trick as PROPERTIES' `ids=`) so it
// round-trips exactly regardless of what the rendered HTML looks like.

export const MESSAGE_BLOCK_RE = /<!--MESSAGE:START text="([^"]*)"-->[\s\S]*?<!--MESSAGE:END-->/;

export function buildMessageBlock(text: string): string {
  const html = `<div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;margin-top:14px;">${escapeAttr(text).replace(/\n/g, "<br />")}</div>`;
  return `<!--MESSAGE:START text="${encodeURIComponent(text)}"-->${html}<!--MESSAGE:END-->`;
}

export function parseMessageText(html: string): string | null {
  const match = MESSAGE_BLOCK_RE.exec(html);
  return match ? decodeURIComponent(match[1]) : null;
}

export function replaceMessageBlock(html: string, text: string): string {
  return html.replace(MESSAGE_BLOCK_RE, buildMessageBlock(text));
}

export const IMAGE_BLOCK_RE = /<!--IMAGE:START url="([^"]*)"-->[\s\S]*?<!--IMAGE:END-->/;

export function buildImageBlock(url: string): string {
  const html = url
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr>
        <td><img src="${escapeAttr(url)}" width="536" alt="" style="display:block;width:100%;height:auto;border:0;border-radius:12px;" /></td>
      </tr></table>`
    : "";
  return `<!--IMAGE:START url="${encodeURIComponent(url)}"-->${html}<!--IMAGE:END-->`;
}

export function parseImageUrl(html: string): string | null {
  const match = IMAGE_BLOCK_RE.exec(html);
  return match ? decodeURIComponent(match[1]) : null;
}

export function replaceImageBlock(html: string, url: string): string {
  return html.replace(IMAGE_BLOCK_RE, buildImageBlock(url));
}

export const CTA_BLOCK_RE = /<!--CTA:START label="([^"]*)" url="([^"]*)"-->[\s\S]*?<!--CTA:END-->/;

export function buildCtaBlock(label: string, url: string): string {
  return `<!--CTA:START label="${encodeURIComponent(label)}" url="${encodeURIComponent(url)}"-->${button(label, url)}<!--CTA:END-->`;
}

export function parseCta(html: string): { label: string; url: string } | null {
  const match = CTA_BLOCK_RE.exec(html);
  return match ? { label: decodeURIComponent(match[1]), url: decodeURIComponent(match[2]) } : null;
}

export function replaceCtaBlock(html: string, label: string, url: string): string {
  return html.replace(CTA_BLOCK_RE, buildCtaBlock(label, url));
}

// ── Marketing layout (auth-email shell + compliance bar) ─────────────────────

/** The unsubscribe/compliance bar every campaign carries — sits between the
 *  white body and the navy footer. %unsubscribe_url% is per-recipient. */
function complianceBar(): string {
  return `<tr><td bgcolor="#ffffff" align="center" style="padding:0 32px 28px;">
    <div style="border-top:1px solid ${BRAND.cardBorder};padding-top:18px;font-family:${FONT};font-size:12px;color:${BRAND.muted};line-height:1.7;">
      Recibís este correo porque te suscribiste a las novedades de ${APP_NAME}.<br />
      <a href="%unsubscribe_url%" style="color:${BRAND.link};text-decoration:underline;">Darse de baja</a>
      &nbsp;&middot;&nbsp; ${APP_NAME}, Mar del Plata, Argentina
    </div>
  </td></tr>`;
}

function marketingLayout(opts: {
  heroOpts: { icon: string; eyebrow?: string; title: string; subtitle: string };
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
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.canvas}">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;">
      ${header()}
      ${hero(opts.heroOpts)}
      <tr><td bgcolor="#ffffff" style="padding:36px 32px;">${opts.bodyHtml}</td></tr>
      ${complianceBar()}
      ${footer()}
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const greeting = (text: string) =>
  `<div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;">Hola %first_name%,</div>
   ${buildMessageBlock(text)}`;

// ── Templates ────────────────────────────────────────────────────────────────

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    key: "new-listing-alert",
    name: "Alerta de Nueva Propiedad",
    category: "Marketing",
    subject: "Nuevas Propiedades Recién Publicadas",
    previewText: "Propiedades recién salidas al mercado — mirálas antes de que vuelen.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "Alerta de propiedad",
        title: "Nuevas Propiedades Recién Publicadas",
        subtitle: "Una selección de las últimas propiedades de nuestro portfolio.<br />Sé el primero en visitarlas.",
      },
      bodyHtml: `${greeting(
        "Acabamos de sumar propiedades que sabemos que te van a encantar. Estos son los destacados:",
      )}
      ${buildImageBlock("")}
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${buildCtaBlock("Ver Todas las Propiedades", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "monthly-market-report",
    name: "Informe Mensual de Mercado",
    category: "Marketing",
    subject: "Informe del Mercado Inmobiliario",
    previewText: "Las tendencias, precios y barrios destacados de este mes.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-shield.png",
        eyebrow: "Panorama de mercado",
        title: "Informe Mensual de Mercado",
        subtitle: "Tendencias, precios y oportunidades del<br />mercado inmobiliario de Mar del Plata.",
      },
      bodyHtml: `${greeting(
        "[Escribí acá tu comentario de mercado: tendencias, barrios destacados y consejos para compradores y vendedores este mes.]",
      )}
      ${buildImageBlock("")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr>
        <td width="48%" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:18px 20px;">
          <div style="font-family:${FONT};font-size:12px;color:${BRAND.faint};">Precio de venta promedio</div>
          <div style="font-family:${FONT};font-size:20px;font-weight:700;color:${BRAND.heroFrom};margin-top:6px;">[USD 000.000]</div>
        </td>
        <td width="4%">&nbsp;</td>
        <td width="48%" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:18px 20px;">
          <div style="font-family:${FONT};font-size:12px;color:${BRAND.faint};">Nuevas propiedades este mes</div>
          <div style="font-family:${FONT};font-size:20px;font-weight:700;color:${BRAND.heroFrom};margin-top:6px;">[00]</div>
        </td>
      </tr></table>
      <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${BRAND.heroFrom};margin-top:28px;">Destacadas del mes</div>
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${buildCtaBlock("Ver Todas las Propiedades", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "lead-follow-up",
    name: "Seguimiento de Lead",
    category: "Marketing",
    subject: "¿Seguís Buscando? Tenemos Nuevas Opciones",
    previewText: "Ya están disponibles nuevas propiedades que coinciden con tu búsqueda.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "Nuevas coincidencias",
        title: "¿Seguís Buscando tu Próxima Propiedad?",
        subtitle: "Tenemos nuevas propiedades que coinciden con lo que buscabas.<br />Nuestro equipo está listo para ayudarte.",
      },
      bodyHtml: `${greeting(
        "Tenemos nuevas propiedades que coinciden con lo que estabas buscando. Echales un vistazo — y si querés visitar alguna, respondé este correo y lo coordinamos.",
      )}
      ${buildImageBlock("")}
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${buildCtaBlock("Ver Todas las Coincidencias", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "blank",
    name: "Newsletter en Blanco",
    category: "Marketing",
    subject: "",
    previewText: "",
    supportsProperties: false,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "Newsletter",
        title: "[Tu título acá]",
        subtitle: "[Un subtítulo breve para la sección principal.]",
      },
      bodyHtml: `${greeting("[Escribí acá el contenido de tu newsletter.]")}
      ${buildImageBlock("")}
      ${buildCtaBlock("Visitar Ulrich Propiedades", APP_URL)}`,
    }),
  },
];

export function getMarketingTemplate(key: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES.find((t) => t.key === key);
}
