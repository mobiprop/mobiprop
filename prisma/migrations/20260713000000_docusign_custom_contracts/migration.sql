-- DocuSign "Upload Custom Contract" flow — adds a second envelope source
-- (an ad-hoc uploaded PDF/DOC/DOCX sent via DocuSign Free Form Signing)
-- alongside the existing reusable-template flow. Additive only — every
-- existing docusign_envelopes row backfills to source = 'TEMPLATE' with no
-- recipients rows, so the already-verified template flow is untouched.

-- CreateEnum
CREATE TYPE "EnvelopeSource" AS ENUM ('TEMPLATE', 'CUSTOM_UPLOAD');
CREATE TYPE "EnvelopeRecipientRole" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'THIRD_PARTY', 'OTHER');

-- AlterTable: template_id becomes optional (null for CUSTOM_UPLOAD); new
-- source + document columns.
ALTER TABLE "docusign_envelopes" ALTER COLUMN "template_id" DROP NOT NULL;
ALTER TABLE "docusign_envelopes" ADD COLUMN "source" "EnvelopeSource" NOT NULL DEFAULT 'TEMPLATE';
ALTER TABLE "docusign_envelopes" ADD COLUMN "document_file_name" TEXT;
ALTER TABLE "docusign_envelopes" ADD COLUMN "document_storage_path" TEXT;
ALTER TABLE "docusign_envelopes" ADD COLUMN "document_url" TEXT;
ALTER TABLE "docusign_envelopes" ADD COLUMN "document_mime_type" TEXT;

-- CreateTable
CREATE TABLE "docusign_envelope_recipients" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "EnvelopeRecipientRole" NOT NULL,
    "role_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "docusign_envelope_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "docusign_envelope_recipients_envelope_idx" ON "docusign_envelope_recipients"("envelope_id");

ALTER TABLE "docusign_envelope_recipients"
  ADD CONSTRAINT "docusign_envelope_recipients_envelope_id_fkey"
  FOREIGN KEY ("envelope_id") REFERENCES "docusign_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny-all from client roles, same as docusign_envelopes itself — all
-- access goes through server actions using the service-role connection.
ALTER TABLE "docusign_envelope_recipients" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "docusign_envelope_recipients" FROM anon, authenticated;
