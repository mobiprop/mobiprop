-- Re-enable Row-Level Security on the CRM tables that were left exposed in production.
--
-- The original CRM migration (20260617000000_add_crm_contacts_module) intended to
-- enable RLS on all four tables, but only `contacts` was actually applied to the
-- production database. Supabase flagged `contact_properties`, `opportunities`, and
-- `contracts` as publicly accessible (rls_disabled_in_public).
--
-- Security model: deny ALL direct client (anon/authenticated PostgREST) access.
-- These tables carry no policies on purpose — every read/write goes through
-- server-side Prisma, which connects as the table owner and bypasses RLS.
--
-- ENABLE ROW LEVEL SECURITY is idempotent (no error if already enabled), so this
-- is safe to run against any environment.
ALTER TABLE "public"."contact_properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;
