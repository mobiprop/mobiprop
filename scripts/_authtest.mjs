#!/usr/bin/env node
// Role-access matrix test (authenticated + unauthenticated)
// Usage: node --env-file=.env --env-file=.env.local scripts/_authtest.mjs
// Requires dev server running on http://localhost:3000

// Stub WebSocket — @supabase/realtime-js requires it at import time in Node 20
globalThis.WebSocket ??= class {
  close() {}
  addEventListener() {}
  removeEventListener() {}
  send() {}
};

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_URL = RAW_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const BASE = "http://localhost:3000";

// Sanity-check env
const missing = [];
if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!SERVICE_KEY || SERVICE_KEY.startsWith("your_")) missing.push("SUPABASE_SERVICE_ROLE_KEY (still placeholder)");
if (!DATABASE_URL) missing.push("DATABASE_URL");
if (missing.length) { console.error("Missing env vars:", missing.join(", ")); process.exit(1); }

// Supabase admin client (service role — server only)
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Postgres client for direct profile upsert
const pool = new pg.Pool({ connectionString: DATABASE_URL });

// ── helpers ──────────────────────────────────────────────────────────────────

async function signIn(email, password) {
  const store = new Map();
  const sb = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
      setAll: (list) => { for (const { name, value } of list) store.set(name, value); },
    },
  });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return [...store.entries()].map(([n, v]) => `${n}=${v}`).join("; ");
}

async function get(path, cookieHeader = "") {
  const headers = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers });
  return { status: res.status, location: res.headers.get("location") ?? "" };
}

// Results tracking
let pass = 0, fail = 0;
function ok(label, { status, location }, wantRedirectTo) {
  // For redirect assertions: accept any 3xx pointing to the expected path.
  // For 200: pass wantRedirectTo = null.
  let good;
  if (wantRedirectTo === null) {
    good = status === 200;
  } else {
    good = status >= 300 && status < 400 && location.includes(wantRedirectTo);
  }
  const icon = good ? "✓" : "✗";
  const info = location ? ` → ${location}` : "";
  const hint = good ? "" : `  ← expected ${wantRedirectTo === null ? "200" : `3xx → *${wantRedirectTo}*`}`;
  console.log(`  ${icon} [${status}] ${label}${info}${hint}`);
  good ? pass++ : fail++;
}

// ── test user management ──────────────────────────────────────────────────────

const MANAGER = { email: "manager@ulrichpropiedades.com", password: "Manager1234!" };
let managerId = null;
let managerWasCreated = false;

async function setupManager() {
  console.log("\n── Setup: MANAGER test user ─────────────────────────────────");
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === MANAGER.email);

  if (existing) {
    managerId = existing.id;
    console.log(`  reusing existing auth user: ${managerId}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: MANAGER.email,
      password: MANAGER.password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    managerId = data.user.id;
    managerWasCreated = true;
    console.log(`  created auth user: ${managerId}`);
  }

  // Upsert profile (postgres role bypasses RLS — safe from server)
  await pool.query(
    `INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
     VALUES ($1, $2, 'Manager Test', 'MANAGER'::"UserRole", 'ACTIVE'::"UserStatus", NOW(), NOW())
     ON CONFLICT (id) DO UPDATE
       SET role = 'MANAGER'::"UserRole",
           status = 'ACTIVE'::"UserStatus",
           updated_at = NOW()`,
    [managerId, MANAGER.email],
  );
  console.log("  profile upserted with role=MANAGER");
}

async function cleanup() {
  if (managerWasCreated && managerId) {
    console.log("\n── Cleanup ──────────────────────────────────────────────────");
    await admin.auth.admin.deleteUser(managerId);
    // Profile is deleted by CASCADE if FK is set, else delete explicitly
    await pool.query(`DELETE FROM public.profiles WHERE id = $1`, [managerId]);
    console.log(`  deleted manager ${managerId}`);
  }
  await pool.end();
}

// ── main ─────────────────────────────────────────────────────────────────────

const AUTH_PAGES = ["/login", "/register", "/dashboard-login", "/reset-password", "/verify-otp"];

async function main() {
  await setupManager();

  // ── 1. Unauthenticated ────────────────────────────────────────────────────
  console.log("\n── Unauthenticated ──────────────────────────────────────────");
  ok("/ (public home)", await get("/"), null);
  ok("/dashboard → /dashboard-login", await get("/dashboard"), "/dashboard-login");
  ok("/dashboard/agents → /dashboard-login", await get("/dashboard/agents"), "/dashboard-login");
  ok("/profile → /login", await get("/profile"), "/login");
  for (const p of AUTH_PAGES) ok(`${p} is reachable`, await get(p), null);

  // ── 2. Authenticated roles ────────────────────────────────────────────────
  const roles = [
    { label: "ADMIN",   email: "admin@ulrichpropiedades.com", password: "Admin1234!" },
    { label: "MANAGER", email: MANAGER.email,                 password: MANAGER.password },
    { label: "AGENT",   email: "agent@ulrichpropiedades.com", password: "Agent1234!" },
    { label: "CLIENT",  email: "user@ulrichpropiedades.com",  password: "User1234!" },
  ];

  for (const { label, email, password } of roles) {
    console.log(`\n── ${label} (${email}) ─────────────────────────────────────`);
    let cookies;
    try {
      cookies = await signIn(email, password);
      console.log(`  signed in OK, cookies: ${cookies.length} chars`);
    } catch (e) {
      console.log(`  ✗ sign-in failed: ${e.message}`);
      fail++;
      continue;
    }

    // Auth entry pages must redirect authenticated users away
    for (const p of AUTH_PAGES) {
      ok(`${p} → /dashboard (blocked for signed-in user)`, await get(p, cookies), "/dashboard");
    }

    // Dashboard access
    switch (label) {
      case "ADMIN":
      case "MANAGER":
        ok("/dashboard accessible", await get("/dashboard", cookies), null);
        ok("/dashboard/agents accessible", await get("/dashboard/agents", cookies), null);
        break;
      case "AGENT":
        ok("/dashboard accessible", await get("/dashboard", cookies), null);
        ok("/dashboard/agents → /dashboard (no agents:view)", await get("/dashboard/agents", cookies), "/dashboard");
        break;
      case "CLIENT":
        ok("/dashboard → /profile (CLIENT not staff)", await get("/dashboard", cookies), "/profile");
        break;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  const total = pass + fail;
  console.log(`Results: ${pass}/${total} passed${fail > 0 ? `, ${fail} FAILED` : " ✓"}`);
  console.log("─".repeat(60));

  await cleanup();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error("\nFatal:", e.message); process.exit(1); });
