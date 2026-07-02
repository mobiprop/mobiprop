-- Replace the single sqft-based area fields with square-meter fields that
-- support the Basic Info / Lot listing-type distinction (see listing.schema.ts).
ALTER TABLE "properties" DROP COLUMN "area_sqft";
ALTER TABLE "properties" DROP COLUMN "lot_size_sqft";

ALTER TABLE "properties" ADD COLUMN "total_area_m2" INTEGER;
ALTER TABLE "properties" ADD COLUMN "covered_area_m2" INTEGER;
ALTER TABLE "properties" ADD COLUMN "semi_covered_area_m2" INTEGER;
ALTER TABLE "properties" ADD COLUMN "lot_size_m2" INTEGER;
ALTER TABLE "properties" ADD COLUMN "lot_frontage_m2" INTEGER;
ALTER TABLE "properties" ADD COLUMN "lot_depth_m2" INTEGER;
