import { createClient as createAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { Client as Pg } from "pg";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PG = process.env.DIRECT_URL || process.env.DATABASE_URL;
const BASE = "http://localhost:3000";
const PASSWORD = "Test1234!pacc";

const admin = createAdmin(URL, SERVICE, { auth: { persistSession: false } });
const pg = new Pg({ connectionString: PG });
await pg.connect();

const pad = (s, n) => String(s).padEnd(n);

// Routes we assert per role. expect = {code, loc?} or "200".
const ROUTES = ["/dashboard", "/dashboard/agents", "/login", "/register", "/profile"];

async function signInCookies(email) {
  const store = new Map();
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
      setAll: (cks) => cks.forEach(({ name, value }) => store.set(name, value)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error("signin: " + error.message);
  return [...store.entries()].map(([n, v]) => `${n}=${v}`).join("; ");
}

async function testRole(role) {
  const email = `proxytest_${role.toLowerCase()}_${Date.now()}@example.com`;
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (cErr) throw new Error("createUser: " + cErr.message);
  const id = created.user.id;
  await pg.query(
    `insert into profiles (id,email,full_name,role,status,created_at,updated_at)
     values ($1,$2,$3,$4::"UserRole",'ACTIVE'::"UserStatus",now(),now())`,
    [id, email, `Test ${role}`, role],
  );

  try {
    const cookie = await signInCookies(email);
    console.log(`\n=== ${role} (signed in) ===`);
    for (const p of ROUTES) {
      const r = await fetch(BASE + p, { redirect: "manual", headers: { cookie } });
      console.log(pad(p, 20), pad(r.status, 5), r.headers.get("location") ?? "");
    }
  } finally {
    await pg.query(`delete from profiles where id=$1`, [id]);
    await admin.auth.admin.deleteUser(id);
  }
}

console.log(pad("ROUTE", 20), pad("CODE", 5), "LOCATION");
for (const role of ["AGENT", "MANAGER", "ADMIN", "CLIENT"]) {
  await testRole(role);
}
await pg.end();
console.log("\n(test users created + deleted)");
