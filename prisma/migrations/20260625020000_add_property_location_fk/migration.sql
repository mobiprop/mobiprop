-- AlterTable
ALTER TABLE "properties" ADD COLUMN "location_id" TEXT;

-- CreateIndex
CREATE INDEX "properties_location_idx" ON "properties"("location_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
