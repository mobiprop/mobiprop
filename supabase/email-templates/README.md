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
3. Disable click tracking for authentication email so token links are not rewritten.
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

Copy the complete HTML file into the corresponding editor. Keep the `{{ ... }}` variables intact. The signup template offers both the OTP and a direct token-hash confirmation link, so it also works when opened in another browser. Password recovery preserves the app's `/auth/callback?next=/new-password` redirect. Match the displayed expiration to your configured OTP lifetime (templates currently say 60 minutes).

## Verify before calling email setup complete

Request a fresh signup email using an address you control. Check From is `Mobi Prop <hola@mobiprop.com.ar>`, confirm the button opens the production domain and signs the user in, and verify the six-digit OTP alternative. Test password recovery with the same account. Check SendGrid Email Activity for delivery or bounce errors. Do not reuse an already-consumed token.

Regenerate after changing the shared renderer:

```sh
NEXT_PUBLIC_APP_URL=https://mobi-prop.vercel.app pnpm exec vitest run scripts/generate-email-templates.test.ts
```

Sources: https://supabase.com/docs/guides/auth/redirect-urls · https://supabase.com/docs/guides/auth/auth-smtp · https://supabase.com/docs/guides/auth/auth-email-templates · https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api
