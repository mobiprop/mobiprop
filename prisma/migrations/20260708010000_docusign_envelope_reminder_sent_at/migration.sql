-- Idempotency marker for the daily DocuSign envelope-expiry reminder cron —
-- mirrors contracts.expiry_notified_at's role for the (now-removed) contract
-- expiry cron.
ALTER TABLE "docusign_envelopes" ADD COLUMN "reminder_sent_at" TIMESTAMP(3);
