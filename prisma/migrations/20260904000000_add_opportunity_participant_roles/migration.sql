-- Client feedback (item #4): the lead→opportunity conversion's participant
-- "Role" field only offered BUYER/SELLER/AGENCY, unlike the Contact roles
-- field (BUYER/SELLER/TENANT/OWNER/REAL_ESTATE_COMPANY). Add the missing
-- TENANT and OWNER values so both pickers offer the same set. AGENCY is kept
-- as-is (free-text company name, no Contact) — it already matches
-- REAL_ESTATE_COMPANY conceptually.
ALTER TYPE "OpportunityParticipantRole" ADD VALUE 'TENANT' AFTER 'SELLER';
ALTER TYPE "OpportunityParticipantRole" ADD VALUE 'OWNER' AFTER 'TENANT';
