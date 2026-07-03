-- Internal staff-to-staff chat (1:1 only). See Conversation/ConversationParticipant/
-- Message/MessageAttachment doc comments in schema.prisma for the design rationale.

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participant_one_id" UUID NOT NULL,
    "participant_two_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "last_message_preview" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_pair_unique" ON "conversations"("participant_one_id", "participant_two_id");

-- CreateIndex
CREATE INDEX "conversations_participant_one_idx" ON "conversations"("participant_one_id");

-- CreateIndex
CREATE INDEX "conversations_participant_two_idx" ON "conversations"("participant_two_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_unique" ON "conversation_participants"("conversation_id", "profile_id");

-- CreateIndex
CREATE INDEX "conversation_participants_profile_archived_idx" ON "conversation_participants"("profile_id", "is_archived");

-- CreateIndex
CREATE INDEX "messages_conversation_created_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_recipient_read_idx" ON "messages"("recipient_id", "read_at");

-- CreateIndex
CREATE INDEX "messages_sender_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "message_attachments_message_idx" ON "message_attachments"("message_id");

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only tables: enable RLS and strip the default Supabase grants so the
-- anon/authenticated client roles can never touch them (no policies = deny-all;
-- the app reaches them via the postgres role, which has BYPASSRLS). "messages"
-- gets a narrower SELECT-only policy for Realtime in the next migration instead
-- of the blanket REVOKE below.
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."message_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."conversations" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."conversation_participants" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."message_attachments" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."messages" FROM anon, authenticated;
