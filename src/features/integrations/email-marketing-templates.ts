// Built-in marketing email templates for the SendGrid campaign editor.
// Plain data (no secrets, no server deps) so both the campaign wizard UI and
// the server actions can import it. Bodies are self-contained table-layout
// HTML; `%first_name%` is substituted per-recipient at send time and the
// unsubscribe footer is appended server-side (sendgrid-marketing.ts) — do not
// add one here.

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
  html: string;
};

const BRAND = "#1e4f86";
const INK = "#0d2138";
const MUTED = "#6a7282";

function shell(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td style="background-color:${BRAND};padding:22px 32px;">
          <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:0.4px;">ULRICH PROPIEDADES</span>
        </td>
      </tr>
      ${inner}
    </table>
  </td></tr>
</table>`;
}

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    key: "new-listing-alert",
    name: "New Listing Alert",
    category: "Marketing",
    subject: "New Property Available",
    previewText: "A new property just hit the market — take a look before it's gone.",
    html: shell(`
      <tr><td style="padding:32px 32px 8px;">
        <h1 style="margin:0;font-size:22px;line-height:30px;color:${INK};">New Property Available</h1>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">Hi %first_name%,</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">
          A new property matching your interests was just listed. Here are the highlights:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 6px;font-size:16px;font-weight:bold;color:${INK};">[Property title]</p>
            <p style="margin:0 0 4px;font-size:13px;line-height:20px;color:${MUTED};">[Location] · [Bedrooms] bed · [Bathrooms] bath · [Area] m²</p>
            <p style="margin:0;font-size:16px;font-weight:bold;color:${BRAND};">[Price]</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 32px 36px;" align="center">
        <a href="https://ulrichpropiedades.com/properties" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:8px;">View Property</a>
      </td></tr>`),
  },
  {
    key: "monthly-market-report",
    name: "Monthly Market Report",
    category: "Marketing",
    subject: "Real Estate Market Report",
    previewText: "This month's market trends, prices and featured neighbourhoods.",
    html: shell(`
      <tr><td style="padding:32px 32px 8px;">
        <h1 style="margin:0;font-size:22px;line-height:30px;color:${INK};">Market Report</h1>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">Hi %first_name%,</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">
          Here is your monthly overview of the Mar del Plata real estate market:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding:14px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
              <p style="margin:0 0 4px;font-size:12px;color:${MUTED};">Average sale price</p>
              <p style="margin:0;font-size:18px;font-weight:bold;color:${INK};">[USD 000,000]</p>
            </td>
            <td width="12">&nbsp;</td>
            <td width="50%" style="padding:14px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
              <p style="margin:0 0 4px;font-size:12px;color:${MUTED};">New listings this month</p>
              <p style="margin:0;font-size:18px;font-weight:bold;color:${INK};">[00]</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:14px;line-height:22px;color:${MUTED};">
          [Write your market commentary here — trends, featured neighbourhoods, advice for buyers and sellers.]
        </p>
      </td></tr>
      <tr><td style="padding:24px 32px 36px;" align="center">
        <a href="https://ulrichpropiedades.com/properties" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:8px;">Browse Listings</a>
      </td></tr>`),
  },
  {
    key: "lead-follow-up",
    name: "Lead Follow-up",
    category: "Marketing",
    subject: "Still Looking? We Have New Matches",
    previewText: "New properties matching your search are now available.",
    html: shell(`
      <tr><td style="padding:32px 32px 8px;">
        <h1 style="margin:0;font-size:22px;line-height:30px;color:${INK};">Still looking for your next property?</h1>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">Hi %first_name%,</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:${MUTED};">
          We have new properties that match what you were searching for. Our team would love to
          help you find the right one — reply to this email or browse the latest listings below.
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px 36px;" align="center">
        <a href="https://ulrichpropiedades.com/properties" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:8px;">See New Matches</a>
      </td></tr>`),
  },
  {
    key: "blank",
    name: "Blank Newsletter",
    category: "Marketing",
    subject: "",
    previewText: "",
    html: shell(`
      <tr><td style="padding:32px;">
        <p style="margin:0;font-size:14px;line-height:22px;color:${MUTED};">Hi %first_name%,</p>
        <p style="margin:16px 0 0;font-size:14px;line-height:22px;color:${MUTED};">[Write your newsletter content here.]</p>
      </td></tr>`),
  },
];

export function getMarketingTemplate(key: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES.find((t) => t.key === key);
}
