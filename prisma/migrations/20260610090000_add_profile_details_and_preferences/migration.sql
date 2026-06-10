-- AlterTable
ALTER TABLE "public"."profiles"
  ADD COLUMN "country" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "preferences" JSONB;
