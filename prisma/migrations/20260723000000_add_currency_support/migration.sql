-- Currency support for listings and opportunities, plus a real closedAt
-- timestamp on Opportunity so the ARS->USD exchange rate can be locked to
-- the exact date a deal was marked CLOSED_WON.

CREATE TYPE "Currency" AS ENUM ('USD', 'ARS');

ALTER TABLE "properties" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'USD';

ALTER TABLE "opportunities" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'USD';
ALTER TABLE "opportunities" ADD COLUMN "closed_at" TIMESTAMP(3);
ALTER TABLE "opportunities" ADD COLUMN "exchange_rate" DECIMAL(10,4);

-- Backfill closedAt for already-won deals from updatedAt (the previous,
-- fragile stand-in) so date-window filtering doesn't lose historical data.
UPDATE "opportunities" SET "closed_at" = "updated_at" WHERE "status" = 'CLOSED_WON' AND "closed_at" IS NULL;
