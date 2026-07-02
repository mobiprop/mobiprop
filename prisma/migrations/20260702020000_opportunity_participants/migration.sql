-- Opportunities can now have multiple parties (buyer, seller, co-buyers, a
-- co-broking agency, etc.) instead of exactly one linked Contact.

CREATE TYPE "OpportunityParticipantRole" AS ENUM ('BUYER', 'SELLER', 'AGENCY');

CREATE TABLE "opportunity_participants" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "role" "OpportunityParticipantRole" NOT NULL,
    "contact_id" TEXT,
    "company_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "opportunity_participants_opportunity_idx" ON "opportunity_participants"("opportunity_id");
CREATE INDEX "opportunity_participants_contact_idx" ON "opportunity_participants"("contact_id");

ALTER TABLE "opportunity_participants"
  ADD CONSTRAINT "opportunity_participants_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opportunity_participants"
  ADD CONSTRAINT "opportunity_participants_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."opportunity_participants" ENABLE ROW LEVEL SECURITY;

-- Migrate each opportunity's existing single contact into its first
-- participant row. No stored "side" existed before — derive BUYER/SELLER
-- from the linked Contact's own type (SELLER/BOTH -> SELLER, else BUYER).
INSERT INTO "opportunity_participants" ("id", "opportunity_id", "role", "contact_id", "created_at")
SELECT gen_random_uuid()::text, o."id",
       CASE WHEN c."type" = 'SELLER' THEN 'SELLER'::"OpportunityParticipantRole" ELSE 'BUYER'::"OpportunityParticipantRole" END,
       o."contact_id",
       now()
FROM "opportunities" o
JOIN "contacts" c ON c."id" = o."contact_id"
WHERE o."contact_id" IS NOT NULL;

ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "opportunities_contact_id_fkey";
DROP INDEX IF EXISTS "opportunities_contact_idx";
ALTER TABLE "opportunities" DROP COLUMN "contact_id";
