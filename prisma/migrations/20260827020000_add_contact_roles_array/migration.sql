-- Item #16 (client feedback batch): replaces Contact.type (single role)
-- with Contact.roles (multiple roles) at the application level.
--
-- The old `type` column is intentionally left in place (not dropped) as a
-- safety net — there's no staging DB for this project, so this migration
-- stays reversible until the client confirms the new roles UI is correct
-- in production. It can be dropped in a later cleanup migration.
ALTER TABLE "contacts" ADD COLUMN "roles" "ContactType"[] NOT NULL DEFAULT ARRAY['BUYER']::"ContactType"[];

-- Backfill every existing row from its current single `type` value. BOTH
-- (buyer and seller) expands to both roles; everything else maps 1:1.
UPDATE "contacts"
SET "roles" = CASE
  WHEN "type" = 'BOTH' THEN ARRAY['BUYER','SELLER']::"ContactType"[]
  ELSE ARRAY["type"]::"ContactType"[]
END;

-- Replace the old scalar index on `type` with a GIN index over `roles`
-- (array containment/overlap lookups, e.g. "has role X").
DROP INDEX IF EXISTS "contacts_type_idx";
CREATE INDEX "contacts_roles_idx" ON "contacts" USING GIN ("roles");
