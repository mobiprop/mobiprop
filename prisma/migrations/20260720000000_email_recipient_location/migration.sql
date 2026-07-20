-- Adds a free-text location field to email_recipients, captured from the
-- public website's newsletter signup form. Hand-written (shadow-db
-- workaround) — apply with `migrate deploy`.

ALTER TABLE "email_recipients" ADD COLUMN "location" TEXT;
