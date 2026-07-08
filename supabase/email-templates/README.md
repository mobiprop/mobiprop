# Supabase Auth email templates

Branded HTML for the emails Supabase Auth sends itself (OTP sign-up/sign-in,
magic link, password reset). Generated from `src/lib/email-templates.ts` —
do not hand-edit these files; regenerate instead:

```bash
pnpm vitest run scripts/generate-email-templates.test.ts
```

## How to install (Supabase dashboard)

1. **Custom SMTP first** (or emails still go out unbranded from Supabase's
   shared sender): Authentication → Emails → SMTP Settings →
   host `smtp.sendgrid.net`, port `587`, username `apikey`,
   password = SendGrid API key, sender `no-reply@ulrichpropiedades.com`.
2. Authentication → Emails → Templates, then paste the full file contents:

| File | Supabase template | Vars used |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `{{ .Token }}`, `{{ .Email }}` |
| `magic-link.html` | Magic Link | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| `reset-password.html` | Reset Password | `{{ .ConfirmationURL }}` |

Subjects to set alongside:

- Confirm signup: `{{ .Token }} is your Ulrich Propiedades verification code`
  (Supabase substitutes the code; keep or simplify to
  `Your Ulrich Propiedades verification code`)
- Magic Link: `Your secure sign-in link for Ulrich Propiedades`
- Reset Password: `Reset your Ulrich Propiedades password`

Images (logo + icons) are served from the deployed app at
`https://ulrich-propiedades.vercel.app/logo.png` and
`/assets/email/icon-*.png`, so a deploy must have happened before the
images resolve in real inboxes. If a custom domain replaces the vercel.app
URL later, set `NEXT_PUBLIC_APP_URL` and regenerate + re-paste.

Emails sent by our own code (SendGrid via `src/lib/email.ts` — invitations,
and the ready-to-use OTP/magic-link/reset/welcome senders) use the same
renderers directly; nothing to paste for those.
