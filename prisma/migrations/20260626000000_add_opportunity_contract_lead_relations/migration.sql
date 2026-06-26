-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "opportunity_id" TEXT;

-- CreateIndex
CREATE INDEX "contracts_opportunity_idx" ON "contracts"("opportunity_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "leads_converted_opportunity_id_key" ON "leads"("converted_opportunity_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_opportunity_id_fkey" FOREIGN KEY ("converted_opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
