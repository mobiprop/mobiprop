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
