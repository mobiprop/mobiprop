import { APP_URL } from "@/lib/constants";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  DATABASE_URL: requiredEnv("DATABASE_URL"),
};

/**
 * Web Push / VAPID configuration. Intentionally optional: when keys are absent
 * the push channel degrades gracefully (status reports `serverConfigured:false`)
 * instead of crashing the app at boot. Read server-side only — the private key
 * must never reach the client. The public key is also exposed to the browser via
 * `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Next inlines it at build time).
 */
export function getVapidConfig():
  | { subject: string; publicKey: string; privateKey: string }
  | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:no-reply@ulrichpropiedades.com";

  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function isPushServerConfigured(): boolean {
  return getVapidConfig() !== null;
}

/**
 * Google Calendar OAuth configuration (Integrations page). Reuses the same
 * GOOGLE_CLIENT_ID/SECRET already configured for Google sign-in — the Google
 * Cloud Console OAuth client just needs the Calendar redirect URI added and
 * the Calendar API enabled (see Integrations setup notes). Intentionally
 * optional: when absent, the "Connect" button degrades to disabled instead of
 * crashing the app at boot.
 */
export function getGoogleCalendarOAuthConfig():
  | { clientId: string; clientSecret: string; redirectUri: string }
  | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri: `${APP_URL}/api/integrations/google-calendar/callback`,
  };
}

export function isGoogleCalendarConfigured(): boolean {
  return getGoogleCalendarOAuthConfig() !== null;
}
