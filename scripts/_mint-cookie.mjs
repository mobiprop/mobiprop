// One-off: mint an @supabase/ssr auth cookie for the admin user and print it.
// Run: node --env-file=.env scripts/_mint-cookie.mjs
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@ulrichpropiedades.com";
const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: ADMIN_EMAIL,
});
if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);

const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
  type: "email",
  token_hash: linkData.properties.hashed_token,
});
if (otpError) throw new Error(`verifyOtp failed: ${otpError.message}`);

const ref = new URL(url).hostname.split(".")[0];
const name = `sb-${ref}-auth-token`;
const value = "base64-" + Buffer.from(JSON.stringify(otpData.session)).toString("base64");
const CHUNK = 3180;
const parts = [];
if (value.length <= CHUNK) {
  parts.push(`${name}=${value}`);
} else {
  for (let i = 0; i * CHUNK < value.length; i++) {
    parts.push(`${name}.${i}=${value.slice(i * CHUNK, (i + 1) * CHUNK)}`);
  }
}
process.stdout.write(parts.join("; "));
