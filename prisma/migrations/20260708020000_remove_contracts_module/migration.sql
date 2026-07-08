-- Removes the Contracts module entirely, now that the DocuSign +
-- Opportunity-listings/documents replacement (previous two migrations) is in
-- place and verified. Per the client: Contract data has no retention
-- requirement ("still in development... data not important").

-- Drop in FK-dependency order: documents/participants/listings reference
-- contracts, so they go first.
DROP TABLE IF EXISTS "contract_documents";
DROP TABLE IF EXISTS "contract_participants";
DROP TABLE IF EXISTS "contract_listings";
DROP TABLE IF EXISTS "contracts";

DROP TYPE IF EXISTS "ContractParticipantRole";
DROP TYPE IF EXISTS "ContractType";
DROP TYPE IF EXISTS "ContractStatus";

-- Opportunity.property_id / its relation is fully superseded by
-- opportunity_listings (added in the earlier additive migration).
ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "opportunities_property_id_fkey";
DROP INDEX IF EXISTS "opportunities_property_idx";
ALTER TABLE "opportunities" DROP COLUMN IF EXISTS "property_id";
