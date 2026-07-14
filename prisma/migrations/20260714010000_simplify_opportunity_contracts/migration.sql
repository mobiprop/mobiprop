-- Removes the "Supporting Documents" concept from Opportunities. Per the
-- client's simplification decision: an Opportunity has ONE contracts
-- surface — real DocuSign envelopes — not a separate internal-file-upload
-- table. Every OpportunityDocument row that was actually sent via DocuSign
-- already lives on as a self-contained snapshot on DocusignEnvelope
-- (document_file_name/document_url/document_mime_type); rows that were
-- never sent had their storage object removed by
-- scripts/cleanup-orphaned-opportunity-documents.mjs before this migration
-- ran. Postgres drops the table's own FK/constraints automatically.
DROP TABLE IF EXISTS "opportunity_documents";

-- Lets a co-broking AGENCY participant (company name only, no Contact
-- record) be picked as a DocuSign signer — previously impossible since
-- agencies had no email field at all.
ALTER TABLE "opportunity_participants" ADD COLUMN "company_email" TEXT;
