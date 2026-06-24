-- Harden public.is_admin() against direct invocation.
--
-- Supabase Security Advisor warned that this SECURITY DEFINER function was
-- executable by `anon` and `authenticated` (and PUBLIC), meaning it could be
-- called directly as a PostgREST RPC (/rest/v1/rpc/is_admin).
--
-- The function is only ever referenced inside RLS policies, which the app
-- evaluates through server-side Prisma (the `postgres` owner role). Revoking
-- EXECUTE from the public-facing roles closes the RPC surface while leaving
-- `postgres` and `service_role` able to use it.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
