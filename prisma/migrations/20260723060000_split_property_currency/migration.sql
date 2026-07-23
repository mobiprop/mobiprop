-- Splits Property.currency into saleCurrency/rentCurrency — a SALE_AND_RENT
-- listing can legitimately be priced for sale and for rent in different
-- currencies (e.g. sale in USD, rent in ARS).

ALTER TABLE "properties" ADD COLUMN "sale_currency" "Currency" NOT NULL DEFAULT 'USD';
ALTER TABLE "properties" ADD COLUMN "rent_currency" "Currency" NOT NULL DEFAULT 'USD';

-- Backfill both from the existing single currency column so no listing's
-- price display changes as a result of this migration.
UPDATE "properties" SET "sale_currency" = "currency", "rent_currency" = "currency";

ALTER TABLE "properties" DROP COLUMN "currency";
