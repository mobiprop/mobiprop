-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "agency_commission_total" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "opportunity_participants" ADD COLUMN     "commission_unit" TEXT,
ADD COLUMN     "commission_value" DECIMAL(14,2);
