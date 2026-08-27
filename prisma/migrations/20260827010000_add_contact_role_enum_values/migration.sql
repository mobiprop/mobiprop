-- Item #16 (client feedback batch): contacts can hold multiple roles going
-- forward (Comprador/Vendedor/Inquilino/Propietario/Inmobiliaria). This adds
-- the three new ContactType values; BOTH stays in the type (unused by new
-- code) since Postgres can't cheaply drop an enum value.
--
-- Split into its own migration (rather than combined with the roles column
-- below) because a newly added enum value cannot be referenced by name in
-- the same transaction that adds it.
ALTER TYPE "ContactType" ADD VALUE 'TENANT' AFTER 'SELLER';
ALTER TYPE "ContactType" ADD VALUE 'OWNER' AFTER 'TENANT';
ALTER TYPE "ContactType" ADD VALUE 'REAL_ESTATE_COMPANY' AFTER 'OWNER';
