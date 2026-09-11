/**
 * One-off generator (run via vitest so TS + "@" alias resolve):
 *   pnpm vitest run scripts/generate-email-templates.test.ts
 * Writes Supabase dashboard paste-ins to supabase/email-templates/ and
 * sample-data previews to .email-previews/ (gitignored scratch).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "vitest";

import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderOtpEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
} from "@/lib/email-templates";

test("generate email template files", () => {
  const root = path.resolve(__dirname, "..");
  const supa = path.join(root, "supabase/email-templates");
  const prev = path.join(root, ".email-previews");
  mkdirSync(supa, { recursive: true });
  mkdirSync(prev, { recursive: true });

  writeFileSync(
    path.join(supa, "confirm-signup.html"),
    renderOtpEmail({ code: "{{ .Token }}", email: "{{ .Email }}", confirmationUrl: "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email", expiresMinutes: 60 }),
  );
  writeFileSync(
    path.join(supa, "magic-link.html"),
    renderMagicLinkEmail({ url: "{{ .ConfirmationURL }}", code: "{{ .Token }}", expiresMinutes: 60 }),
  );
  writeFileSync(
    path.join(supa, "reset-password.html"),
    renderPasswordResetEmail({ url: "{{ .ConfirmationURL }}", expiresMinutes: 60 }),
  );

  writeFileSync(
    path.join(prev, "preview-otp.html"),
    renderOtpEmail({
      code: "742916",
      email: "matiasui@email.com",
      expiresMinutes: 10,
      requestedAt: "Jun 15, 2026 · 09:42 PST",
      device: "Chrome · macOS",
      location: "Los Angeles, CA",
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
  writeFileSync(path.join(prev, "preview-welcome.html"), renderWelcomeEmail({ name: "James Whitmore" }));
  writeFileSync(
    path.join(prev, "preview-invite.html"),
    renderInvitationEmail({
      inviteUrl: "https://mobi-prop.vercel.app/register?invite=sample",
      roleLabel: "Agent",
      expiresInDays: 7,
    }),
  );
});
