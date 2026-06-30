-- AlterTable
ALTER TABLE "profiles"
  ADD COLUMN "google_calendar_email" TEXT,
  ADD COLUMN "google_calendar_access_token" TEXT,
  ADD COLUMN "google_calendar_refresh_token" TEXT,
  ADD COLUMN "google_calendar_token_expires_at" TIMESTAMP(3),
  ADD COLUMN "google_calendar_connected_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tours" ADD COLUMN "google_calendar_event_id" TEXT;
