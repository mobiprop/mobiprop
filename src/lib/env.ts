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
