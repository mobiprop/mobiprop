-- AlterTable: allow a recipient to dismiss a notification from their list
-- without deleting the audit row.
ALTER TABLE "notifications" ADD COLUMN "dismissed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notifications_recipient_dismissed_idx" ON "notifications"("recipient_id", "dismissed_at");
