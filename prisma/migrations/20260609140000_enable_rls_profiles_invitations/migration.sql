-- Row Level Security for profiles + agent_invitations (spec §8).
--
-- Context: these tables were created by Prisma and Supabase's default grants
-- gave `anon` and `authenticated` full read/write on them. With RLS disabled
-- that means the public anon key (shipped in the browser) could read every
-- profile and even UPDATE its own row's `role` to ADMIN. We lock that down.
--
-- The app's Prisma connection uses the `postgres` role (BYPASSRLS) and the
-- admin client uses `service_role` (BYPASSRLS), so server-side access is
-- unaffected. App-level permission checks still apply (Prisma bypasses RLS).

-- ── profiles ────────────────────────────────────────────────────────────────
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Drop the blanket privileges Supabase granted by default, then re-grant the
-- minimum: authenticated users may read their own row and edit only
-- non-sensitive columns (never `role`/`status`/`email`/`id`). anon gets nothing.
REVOKE ALL ON "public"."profiles" FROM "anon";
REVOKE ALL ON "public"."profiles" FROM "authenticated";

GRANT SELECT ON "public"."profiles" TO "authenticated";
GRANT UPDATE ("full_name", "phone") ON "public"."profiles" TO "authenticated";

DROP POLICY IF EXISTS "profiles_select_own" ON "public"."profiles";
CREATE POLICY "profiles_select_own" ON "public"."profiles"
  FOR SELECT TO "authenticated"
  USING ((SELECT auth.uid()) = "id");

DROP POLICY IF EXISTS "profiles_update_own" ON "public"."profiles";
CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE TO "authenticated"
  USING ((SELECT auth.uid()) = "id")
  WITH CHECK ((SELECT auth.uid()) = "id");

-- ── agent_invitations ───────────────────────────────────────────────────────
-- No client ever touches this table directly; every invitation flow runs
-- server-side through Prisma. Enable RLS and revoke all client grants so anon/
-- authenticated have zero access (no policies = deny-all for non-bypass roles).
ALTER TABLE "public"."agent_invitations" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "public"."agent_invitations" FROM "anon";
REVOKE ALL ON "public"."agent_invitations" FROM "authenticated";
