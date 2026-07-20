-- Tours/Leads no longer require a Contact up front — a tour request (or the
-- Lead it creates/reuses) now stays contact-less until staff explicitly
-- convert it to an Opportunity. Hand-written (shadow-db workaround); apply
-- with `migrate deploy`.

ALTER TABLE "tours" DROP CONSTRAINT "tours_contact_id_fkey";
ALTER TABLE "tours" ALTER COLUMN "contact_id" DROP NOT NULL;
ALTER TABLE "tours" ADD CONSTRAINT "tours_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads" DROP CONSTRAINT "leads_contact_id_fkey";
ALTER TABLE "leads" ALTER COLUMN "contact_id" DROP NOT NULL;
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
