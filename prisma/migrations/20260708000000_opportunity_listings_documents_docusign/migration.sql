-- Additive migration ahead of the Contracts -> DocuSign migration. Contracts
-- module (contracts/contract_participants/contract_listings/contract_documents)
-- is NOT touched here — it's dropped in a later cleanup migration once the
-- replacement flow (this migration + application code) is verified working.
--
-- Adds:
--   - opportunity_listings: many-to-many Opportunity<->Property, mirrors
--     contract_listings. Opportunity.property_id stays in place (unused by
--     new code) until the Contracts cleanup migration drops it.
--   - opportunity_documents: mirrors contract_documents, renamed FK.
--   - docusign_envelopes: tracked e-signature envelopes, optionally linked
--     to an Opportunity.
--   - docusign_settings: singleton "Signature Defaults" settings row.

-- CreateTable
CREATE TABLE "opportunity_listings" (
    "opportunity_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,

    CONSTRAINT "opportunity_listings_pkey" PRIMARY KEY ("opportunity_id", "property_id")
);

CREATE INDEX "opportunity_listings_property_idx" ON "opportunity_listings"("property_id");

ALTER TABLE "opportunity_listings"
  ADD CONSTRAINT "opportunity_listings_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opportunity_listings"
  ADD CONSTRAINT "opportunity_listings_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."opportunity_listings" ENABLE ROW LEVEL SECURITY;

-- Seed opportunity_listings from each opportunity's existing single
-- property_id, so existing opportunities don't lose their listing once the
-- modal switches to reading/writing the join table in application code.
INSERT INTO "opportunity_listings" ("opportunity_id", "property_id")
SELECT "id", "property_id" FROM "opportunities" WHERE "property_id" IS NOT NULL;

-- CreateTable
CREATE TABLE "opportunity_documents" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "opportunity_documents_opportunity_idx" ON "opportunity_documents"("opportunity_id");

ALTER TABLE "opportunity_documents"
  ADD CONSTRAINT "opportunity_documents_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny-all from the client roles, same as contract_documents — all
-- access goes through server actions using the service-role connection.
ALTER TABLE "opportunity_documents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "opportunity_documents" FROM anon, authenticated;

-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('SENT', 'DELIVERED', 'COMPLETED', 'DECLINED', 'VOIDED');

-- CreateTable
CREATE TABLE "docusign_envelopes" (
    "id" TEXT NOT NULL,
    "docusign_envelope_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'SENT',
    "recipient_name" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "property_reference" TEXT,
    "opportunity_id" TEXT,
    "sent_by_id" UUID,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "voided_reason" TEXT,
    "last_webhook_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docusign_envelopes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "docusign_envelopes_docusign_envelope_id_key" ON "docusign_envelopes"("docusign_envelope_id");
CREATE INDEX "docusign_envelopes_opportunity_idx" ON "docusign_envelopes"("opportunity_id");
CREATE INDEX "docusign_envelopes_status_idx" ON "docusign_envelopes"("status");

ALTER TABLE "docusign_envelopes"
  ADD CONSTRAINT "docusign_envelopes_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: deny-all from the client roles, same as opportunity_documents — all
-- access goes through server actions using the service-role connection.
ALTER TABLE "docusign_envelopes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "docusign_envelopes" FROM anon, authenticated;

-- CreateTable
CREATE TABLE "docusign_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_expiry_days" INTEGER NOT NULL DEFAULT 7,
    "auto_reminder_days" INTEGER NOT NULL DEFAULT 3,
    "auto_send_reminders" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "docusign_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "docusign_settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "docusign_settings" FROM anon, authenticated;

-- Seed the singleton settings row so getDocusignSettings() never has to
-- handle a missing row.
INSERT INTO "docusign_settings" ("id", "updated_at") VALUES ('default', now());
