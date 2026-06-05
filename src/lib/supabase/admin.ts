import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

function requiredServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
