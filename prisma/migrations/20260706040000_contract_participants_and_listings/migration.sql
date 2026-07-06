-- Contracts can now have multiple parties (buyer, seller, co-buyers, a
-- co-broking agency, etc.) and multiple linked properties, instead of
-- exactly one linked Contact and one linked Property.

CREATE TYPE "ContractParticipantRole" AS ENUM ('BUYER', 'SELLER', 'AGENCY');

CREATE TABLE "contract_participants" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "role" "ContractParticipantRole" NOT NULL,
    "contact_id" TEXT,
    "company_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_participants_contract_idx" ON "contract_participants"("contract_id");
CREATE INDEX "contract_participants_contact_idx" ON "contract_participants"("contact_id");

ALTER TABLE "contract_participants"
  ADD CONSTRAINT "contract_participants_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_participants"
  ADD CONSTRAINT "contract_participants_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."contract_participants" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "contract_listings" (
    "contract_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,

    CONSTRAINT "contract_listings_pkey" PRIMARY KEY ("contract_id", "property_id")
);

CREATE INDEX "contract_listings_property_idx" ON "contract_listings"("property_id");

ALTER TABLE "contract_listings"
  ADD CONSTRAINT "contract_listings_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_listings"
  ADD CONSTRAINT "contract_listings_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."contract_listings" ENABLE ROW LEVEL SECURITY;

-- Migrate each contract's existing single contact into its first participant
-- row. No stored "side" existed before — derive BUYER/SELLER from the linked
-- Contact's own type (SELLER/BOTH -> SELLER, else BUYER), same rule already
-- used for the analogous opportunities migration.
INSERT INTO "contract_participants" ("id", "contract_id", "role", "contact_id", "created_at")
SELECT gen_random_uuid()::text, k."id",
       CASE WHEN c."type" = 'SELLER' THEN 'SELLER'::"ContractParticipantRole" ELSE 'BUYER'::"ContractParticipantRole" END,
       k."contact_id",
       now()
FROM "contracts" k
JOIN "contacts" c ON c."id" = k."contact_id"
WHERE k."contact_id" IS NOT NULL;

-- Migrate each contract's existing single property into the new join table.
INSERT INTO "contract_listings" ("contract_id", "property_id")
SELECT "id", "property_id" FROM "contracts" WHERE "property_id" IS NOT NULL;

ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_contact_id_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_property_id_fkey";
DROP INDEX IF EXISTS "contracts_contact_idx";
DROP INDEX IF EXISTS "contracts_property_idx";
ALTER TABLE "contracts" DROP COLUMN "contact_id";
ALTER TABLE "contracts" DROP COLUMN "property_id";
