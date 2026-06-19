-- Enable Supabase Realtime for in-app notifications, scoped to the recipient.
--
-- Security model: authenticated users may READ ONLY THEIR OWN notifications.
-- Writes remain server-only — only SELECT is granted, and there are no
-- INSERT/UPDATE/DELETE policies, so the browser can never create or mutate a
-- notification (those continue to go through Prisma's postgres role). anon stays
-- fully denied. recipient_id == Profile.id == auth.users.id, so auth.uid()
-- compares directly with no Profile join.

GRANT SELECT ON TABLE "public"."notifications" TO authenticated;

DROP POLICY IF EXISTS "notifications_select_own" ON "public"."notifications";
CREATE POLICY "notifications_select_own"
  ON "public"."notifications"
  FOR SELECT
  TO authenticated
  USING ("recipient_id" = auth.uid());

-- Emit full row data so Realtime can evaluate the recipient_id filter on
-- UPDATE/DELETE events (mark-read / dismiss), not just INSERT.
ALTER TABLE "public"."notifications" REPLICA IDENTITY FULL;

-- Add the table to the Realtime publication (no-op if already present / absent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "public"."notifications";
    END IF;
  END IF;
END
$$;
