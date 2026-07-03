-- Enable Supabase Realtime for chat messages, scoped to sender OR recipient.
--
-- Security model: authenticated users may READ ONLY messages where they are
-- the sender or the recipient. Writes remain server-only (Prisma/postgres
-- role, which has BYPASSRLS) — only SELECT is granted, no INSERT/UPDATE/DELETE
-- policy exists, so the browser can never create, edit, or delete a message.
-- conversations / conversation_participants / message_attachments stay
-- RLS deny-all (see previous migration) — the client never reads them
-- directly, only through server actions; Realtime only needs to fire on
-- "messages" itself (list/thread views refetch through Prisma on change).

-- Strip Supabase's default anon/authenticated grants first (every new public
-- table gets basic CRUD grants by default) so only the narrow SELECT below
-- remains — matches the REVOKE-then-GRANT hygiene used everywhere else in
-- this schema, on top of (not instead of) the RLS policy itself.
REVOKE ALL ON TABLE "public"."messages" FROM anon, authenticated;
GRANT SELECT ON TABLE "public"."messages" TO authenticated;

DROP POLICY IF EXISTS "messages_select_own" ON "public"."messages";
CREATE POLICY "messages_select_own"
  ON "public"."messages"
  FOR SELECT
  TO authenticated
  USING ("sender_id" = auth.uid() OR "recipient_id" = auth.uid());

-- Emit full row data so Realtime can evaluate the sender/recipient filter on
-- UPDATE events (read receipts, soft delete), not just INSERT.
ALTER TABLE "public"."messages" REPLICA IDENTITY FULL;

-- Add the table to the Realtime publication (no-op if already present / absent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "public"."messages";
    END IF;
  END IF;
END
$$;
