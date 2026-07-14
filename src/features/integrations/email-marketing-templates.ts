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
      Featured properties will appear here.<br />Select them under &ldquo;Featured Properties&rdquo; in the campaign editor.
    </td>
  </tr></table>`;
}

export function renderListingCardsHtml(cards: EmailListingCard[]): string {
  if (cards.length === 0) return propertiesPlaceholder();
  return cards
    .map((card) => {
      const meta = [
        card.bedrooms != null ? `${card.bedrooms} bed` : null,
        card.bathrooms != null ? `${card.bathrooms} bath` : null,
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
            <td align="right"><a href="${card.url}" style="font-family:${FONT};font-size:13px;font-weight:600;color:${BRAND.link};text-decoration:none;">View Property &rarr;</a></td>
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

// ── Marketing layout (auth-email shell + compliance bar) ─────────────────────

/** The unsubscribe/compliance bar every campaign carries — sits between the
 *  white body and the navy footer. %unsubscribe_url% is per-recipient. */
function complianceBar(): string {
  return `<tr><td bgcolor="#ffffff" align="center" style="padding:0 32px 28px;">
    <div style="border-top:1px solid ${BRAND.cardBorder};padding-top:18px;font-family:${FONT};font-size:12px;color:${BRAND.muted};line-height:1.7;">
      You are receiving this email because you subscribed to updates from ${APP_NAME}.<br />
      <a href="%unsubscribe_url%" style="color:${BRAND.link};text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp; ${APP_NAME}, Mar del Plata, Argentina
    </div>
  </td></tr>`;
}

function marketingLayout(opts: {
  heroOpts: { icon: string; eyebrow?: string; title: string; subtitle: string };
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
  `<div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;">Hi %first_name%,</div>
   <div style="font-family:${FONT};font-size:15px;color:${BRAND.text};line-height:1.7;margin-top:14px;">${text}</div>`;

// ── Templates ────────────────────────────────────────────────────────────────

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    key: "new-listing-alert",
    name: "New Listing Alert",
    category: "Marketing",
    subject: "New Properties Just Listed",
    previewText: "Fresh properties just hit the market — take a look before they're gone.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "Property alert",
        title: "New Properties Just Listed",
        subtitle: "Hand-picked new listings from our portfolio.<br />Be the first to visit them.",
      },
      bodyHtml: `${greeting(
        "We just added new properties that we think you'll love. Here are the highlights:",
      )}
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${button("Browse All Listings", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "monthly-market-report",
    name: "Monthly Market Report",
    category: "Marketing",
    subject: "Real Estate Market Report",
    previewText: "This month's market trends, prices and featured neighbourhoods.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-shield.png",
        eyebrow: "Market insights",
        title: "Monthly Market Report",
        subtitle: "Trends, prices and opportunities in the<br />Mar del Plata real estate market.",
      },
      bodyHtml: `${greeting(
        "[Write your market commentary here — trends, featured neighbourhoods, and advice for buyers and sellers this month.]",
      )}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr>
        <td width="48%" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:18px 20px;">
          <div style="font-family:${FONT};font-size:12px;color:${BRAND.faint};">Average sale price</div>
          <div style="font-family:${FONT};font-size:20px;font-weight:700;color:${BRAND.heroFrom};margin-top:6px;">[USD 000,000]</div>
        </td>
        <td width="4%">&nbsp;</td>
        <td width="48%" style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.cardBorder};border-radius:12px;padding:18px 20px;">
          <div style="font-family:${FONT};font-size:12px;color:${BRAND.faint};">New listings this month</div>
          <div style="font-family:${FONT};font-size:20px;font-weight:700;color:${BRAND.heroFrom};margin-top:6px;">[00]</div>
        </td>
      </tr></table>
      <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${BRAND.heroFrom};margin-top:28px;">Featured this month</div>
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${button("Browse All Listings", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "lead-follow-up",
    name: "Lead Follow-up",
    category: "Marketing",
    subject: "Still Looking? We Have New Matches",
    previewText: "New properties matching your search are now available.",
    supportsProperties: true,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "New matches",
        title: "Still Looking for Your Next Property?",
        subtitle: "New listings match what you were searching for.<br />Our team is ready to help.",
      },
      bodyHtml: `${greeting(
        "We have new properties that match what you were looking for. Take a look — and if you'd like to visit any of them, just reply to this email and we'll arrange it.",
      )}
      <!--PROPERTIES:START ids=-->${propertiesPlaceholder()}<!--PROPERTIES:END-->
      ${button("See All New Matches", `${APP_URL}/listings`)}`,
    }),
  },
  {
    key: "blank",
    name: "Blank Newsletter",
    category: "Marketing",
    subject: "",
    previewText: "",
    supportsProperties: false,
    html: marketingLayout({
      heroOpts: {
        icon: "icon-check.png",
        eyebrow: "Newsletter",
        title: "[Your headline here]",
        subtitle: "[A short subtitle for the hero section.]",
      },
      bodyHtml: `${greeting("[Write your newsletter content here.]")}
      ${button("Visit Ulrich Propiedades", APP_URL)}`,
    }),
  },
];

export function getMarketingTemplate(key: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES.find((t) => t.key === key);
}
