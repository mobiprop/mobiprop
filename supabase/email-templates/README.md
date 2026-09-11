# Mobi Prop authentication email setup

These templates are ready to paste into Supabase Authentication → Emails → Templates.
Supabase generates each verification token and renders the HTML; SendGrid delivers it through custom SMTP. SendGrid Dynamic Templates are not automatically used by Supabase SMTP. To manage designs in SendGrid instead would require a Send Email Auth Hook and a separate API integration.

## Fix production redirects first (Mobi Prop project only)

Authentication → URL Configuration:

- Site URL: `https://mobi-prop.vercel.app`
- Allowed redirect: `https://mobi-prop.vercel.app/auth/callback`
- Allowed redirect: `https://mobi-prop.vercel.app/auth/callback?next=/new-password`
- Development only, if needed: `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=/new-password`

In the mobi-prop Vercel project, set `NEXT_PUBLIC_APP_URL=https://mobi-prop.vercel.app` for Production. If the public domain changes, update both services and regenerate these files. Old verification emails retain their old URL: request a new email after saving.

## SendGrid setup

1. In SendGrid Settings → Sender Authentication, authenticate `mobiprop.com.ar`. Add the exact DNS records SendGrid gives you at the domain's DNS provider, then verify. Do not replace unrelated DNS or mail records. Disable Cloudflare proxying for the supplied authentication CNAMEs.
2. Create a dedicated API key with Mail Send permission. Do not paste the key into source code or chat.
3. Disable click tracking for authentication email in the dedicated Mobi SendGrid account so token links are not rewritten. Do not change Ulrich account-wide settings. App-generated emails disable click tracking per message.
4. In the Mobi Prop Supabase project, Authentication → Emails → SMTP Settings, enable custom SMTP and save:

| Setting | Value |
|---|---|
| Sender name | Mobi Prop |
| Sender email | hola@mobiprop.com.ar |
| Host | smtp.sendgrid.net |
| Port | 587 |
| Username | apikey (literally this word) |
| Password | The SendGrid API key |

For app-generated emails, add `SENDGRID_API_KEY` as a secret in the **mobi-prop** Vercel project. Set `MAIL_FROM` and `MAIL_FROM_WELCOME` to `Mobi Prop <hola@mobiprop.com.ar>` if those variables already exist, then redeploy. Supabase SMTP credentials and Vercel environment variables are separate settings.

## Install the HTML

| File | Supabase template | Subject |
|---|---|---|
| confirm-signup.html | Confirm signup | Confirmá tu cuenta de Mobi Prop |
| magic-link.html | Magic Link | Tu enlace para ingresar a Mobi Prop |
| reset-password.html | Reset Password | Restablecé tu contraseña de Mobi Prop |

Copy the complete HTML file into the corresponding editor. Keep the `{{ ... }}` variables intact. The signup template delivers `{{ .Token }}` as a six-digit OTP. Its button opens `/verify-otp` with the email address; opening the button alone does not verify the account. Enable Confirm email in Authentication → Sign In / Providers → Email. Password recovery preserves the app's `/auth/callback?next=/new-password` redirect. The new verification and reset designs do not hardcode an expiration duration.

## Verify before calling email setup complete

Request a fresh signup email using an address you control. Check From is `Mobi Prop <hola@mobiprop.com.ar>`, confirm the button opens the production OTP page, enter the code, and verify the user can then sign in. Before verification, password login must fail. Test password recovery with the same account. Check SendGrid Email Activity for delivery or bounce errors. Do not reuse an already-consumed token.

Regenerate after changing the shared renderer:

```sh
NEXT_PUBLIC_APP_URL=https://mobi-prop.vercel.app pnpm exec vitest run scripts/generate-email-templates.test.ts
```

Sources: https://supabase.com/docs/guides/auth/redirect-urls · https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/auth/auth-email-templates · https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api

## Figma implementation and dynamic content

Design references: welcome 2771:2807, verification 2771:2740, reset 2769:2366, visit 2694:4127 in file 685I9vX5kdlHXAVRcraxvx.

Welcome is sent after verified public login, OTP verification or callback, with a deterministic activity-log claim to prevent duplicate concurrent delivery. Failed provider sends release the claim for another login attempt. A process interruption can leave a pending claim; inspect WELCOME_EMAIL_PENDING before retrying manually. No marketing subscription is implied. Recommended listings are real published properties; the section is omitted when none exist. Sample counts, dates, Colombian contact details and nonfunctional newsletter links are replaced with actual transactional content.

Visit-request receipt is sent after the public tour is saved. REQUESTED is not described as CONFIRMED. Agent confirmation retains its separate email. Dates in request emails explicitly use Buenos Aires time. SMTP delivery still needs end-to-end validation with a user-controlled account.

## Node version warning

The repository requires Node 22.x. Vercel mobi-prop currently has 24.x selected, so package.json overrides it. In mobi-prop → Settings → Build and Deployment → Node.js Version select 22.x and save. Keep Ulrich settings unchanged. This warning did not prevent the previous production deployment reaching Ready.

The Mobi Prop OTP form expects six numeric digits. Set Email OTP Length to 6 in Supabase Authentication → Sign In / Providers → Email before testing. This dashboard setting controls the generated token length; do not truncate tokens in the HTML.
