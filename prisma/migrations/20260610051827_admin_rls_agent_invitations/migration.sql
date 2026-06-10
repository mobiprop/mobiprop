-- Defense-in-depth RLS for public.agent_invitations (spec: invite flow RLS
-- requirements). The app's own access (Prisma -> postgres role, admin client
-- -> service_role) already bypasses RLS via BYPASSRLS, and every invite
-- mutation goes through server-side permission checks (requirePermission).
-- This migration additionally allows ADMIN users to manage invitations via
-- the client-side Supabase API, scoped strictly to ADMIN by RLS policy.

-- is_admin(): SECURITY DEFINER so it can read public.profiles (which has its
-- own restrictive RLS) regardless of the calling user's row-level access.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
  );
$$;

-- agent_invitations currently has zero grants for anon/authenticated
-- (REVOKE ALL from migration 20260609140000). Re-grant to authenticated so
-- the RLS policies below can take effect; anon remains with zero access.
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."agent_invitations" TO "authenticated";

DROP POLICY IF EXISTS "Admins can view agent invitations" ON "public"."agent_invitations";
DROP POLICY IF EXISTS "Admins can create agent invitations" ON "public"."agent_invitations";
DROP POLICY IF EXISTS "Admins can update agent invitations" ON "public"."agent_invitations";
DROP POLICY IF EXISTS "Admins can delete agent invitations" ON "public"."agent_invitations";

CREATE POLICY "Admins can view agent invitations"
ON "public"."agent_invitations"
FOR SELECT
TO "authenticated"
USING (public.is_admin());

CREATE POLICY "Admins can create agent invitations"
ON "public"."agent_invitations"
FOR INSERT
TO "authenticated"
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update agent invitations"
ON "public"."agent_invitations"
FOR UPDATE
TO "authenticated"
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete agent invitations"
ON "public"."agent_invitations"
FOR DELETE
TO "authenticated"
USING (public.is_admin());
