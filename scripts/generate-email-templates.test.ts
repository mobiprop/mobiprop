/**
 * One-off generator (run via vitest so TS + "@" alias resolve):
 *   pnpm vitest run scripts/generate-email-templates.test.ts
 * Writes Supabase dashboard paste-ins to supabase/email-templates/ and
 * sample-data previews to .email-previews/ (gitignored scratch).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL ||= "https://mobi-prop.vercel.app";
});
import { APP_URL } from "@/lib/constants";

import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderOtpEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
  renderTourConfirmedEmail,
} from "@/lib/email-templates";

test("generate email template files", () => {
  // Dashboard paste-ins must never accidentally use the local development URL.
  expect(APP_URL).toMatch(/^https:\/\//);
  const root = path.resolve(__dirname, "..");
  const supa = path.join(root, "supabase/email-templates");
  const prev = path.join(root, ".email-previews");
  mkdirSync(supa, { recursive: true });
  mkdirSync(prev, { recursive: true });

  writeFileSync(
    path.join(supa, "confirm-signup.html"),
    renderOtpEmail({ code: "{{ .Token }}", email: "{{ .Email }}", expiresMinutes: 60 }),
  );
  writeFileSync(
    path.join(supa, "magic-link.html"),
    renderMagicLinkEmail({ url: "{{ .ConfirmationURL }}", code: "{{ .Token }}", expiresMinutes: 60 }),
  );
  writeFileSync(
    path.join(supa, "reset-password.html"),
    renderPasswordResetEmail({ url: "{{ .ConfirmationURL }}", email: "{{ .Email }}", expiresMinutes: 60 }),
  );

  writeFileSync(
    path.join(prev, "preview-otp.html"),
    renderOtpEmail({
      code: "742916",
      email: "matiasui@email.com",
      expiresMinutes: 10,
    }),
  );
  writeFileSync(
    path.join(prev, "preview-magic-link.html"),
    renderMagicLinkEmail({ url: "https://mobi-prop.vercel.app/auth/callback?token=sample", code: "742916" }),
  );
  writeFileSync(
    path.join(prev, "preview-reset.html"),
    renderPasswordResetEmail({ url: "https://mobi-prop.vercel.app/auth/reset?token=sample" }),
  );
  writeFileSync(path.join(prev, "preview-welcome.html"), renderWelcomeEmail({ name: "Matias" }));
  writeFileSync(path.join(prev, "preview-visit.html"), renderTourConfirmedEmail({submittedName:"Matias",tourNumber:"TR-DEMO",scheduledAtLabel:"September 15, 2026 at 10:00 AM (Buenos Aires)",durationLabel:"1 hour",ctaUrl:"https://mobi-prop.vercel.app/profile",requested:true,property:{title:"Sample property",location:"Buenos Aires",url:"https://mobi-prop.vercel.app/listings",image:"https://mobi-prop.vercel.app/hero/cta-footer-bg.webp",price:"USD 285,000",bedrooms:3,bathrooms:2,area:140}}));
  writeFileSync(
    path.join(prev, "preview-invite.html"),
    renderInvitationEmail({
      inviteUrl: "https://mobi-prop.vercel.app/register?invite=sample",
      roleLabel: "Agent",
      expiresInDays: 7,
    }),
  );
});
