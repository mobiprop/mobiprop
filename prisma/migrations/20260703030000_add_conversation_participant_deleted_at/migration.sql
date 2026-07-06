-- "Delete conversation" (soft, per-user) — see ConversationParticipant.deletedAt
-- doc comment in schema.prisma for the design rationale.

ALTER TABLE "conversation_participants" ADD COLUMN "deleted_at" TIMESTAMP(3);
