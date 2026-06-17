import { APP_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "facebook";

export async function signInWithOAuth(provider: OAuthProvider): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return {};
}
