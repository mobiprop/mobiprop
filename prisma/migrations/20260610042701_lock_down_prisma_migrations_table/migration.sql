-- Lock down public._prisma_migrations (Supabase advisor: rls_disabled_in_public).
--
-- Context: this table is Prisma's internal migration history (migration
-- names, checksums, timestamps). It lives in the `public` schema, so it's
-- exposed via the PostgREST API. Supabase's default grants gave `anon` and
-- `authenticated` full SELECT/INSERT/UPDATE/DELETE/TRUNCATE on it with RLS
-- disabled, so the public anon key could read or tamper with the migration
-- history table. No client ever needs this table - Prisma connects as the
-- `postgres` role (BYPASSRLS), so server-side access is unaffected.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "public"."_prisma_migrations" FROM "anon";
REVOKE ALL ON "public"."_prisma_migrations" FROM "authenticated";
