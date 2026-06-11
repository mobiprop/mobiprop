-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL_OFFICE', 'LOT', 'TOWNHOUSE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'RENTED', 'SOLD', 'DRAFT');

-- CreateEnum
CREATE TYPE "PropertyOperationType" AS ENUM ('SALE', 'RENT', 'SALE_AND_RENT');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "operation_type" "PropertyOperationType" NOT NULL,
    "sale_price" DECIMAL(14,2),
    "rent_price" DECIMAL(14,2),
    "location" TEXT NOT NULL,
    "full_address" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "toilets" INTEGER,
    "area_sqft" INTEGER,
    "lot_size_sqft" INTEGER,
    "parking_spaces" INTEGER,
    "year_built" INTEGER,
    "floors" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "assigned_agent_id" UUID,
    "owner_contact_id" TEXT,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_amenities" (
    "property_id" TEXT NOT NULL,
    "amenity_id" TEXT NOT NULL,

    CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("property_id","amenity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_listing_id_key" ON "properties"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "properties_is_featured_idx" ON "properties"("is_featured");

-- CreateIndex
CREATE INDEX "properties_assigned_agent_idx" ON "properties"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "properties_created_by_idx" ON "properties"("created_by_id");

-- CreateIndex
CREATE INDEX "property_images_property_idx" ON "property_images"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_key_key" ON "amenities"("key");

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Listing tables follow the project's server-only pattern: RLS enabled with no
-- policies (deny-all) and Supabase client-role grants revoked. Public listing
-- reads go through the server API (Prisma, postgres role with BYPASSRLS), so
-- anon/authenticated never query these tables directly.
ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."property_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."amenities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."property_amenities" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."properties" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."property_images" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."amenities" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."property_amenities" FROM anon, authenticated;

-- Seed the canonical amenity catalog (keys are stable identifiers used by the
-- app; labels are display text).
INSERT INTO "public"."amenities" ("id", "key", "label") VALUES
  ('amn_parking',          'PARKING',          'Parking'),
  ('amn_garden',           'GARDEN',           'Garden'),
  ('amn_pool',             'POOL',             'Pool'),
  ('amn_gym',              'GYM',              'Gym'),
  ('amn_balcony',          'BALCONY',          'Balcony'),
  ('amn_elevator',         'ELEVATOR',         'Elevator'),
  ('amn_security',         'SECURITY',         'Security'),
  ('amn_furnished',        'FURNISHED',        'Furnished'),
  ('amn_pet_friendly',     'PET_FRIENDLY',     'Pet Friendly'),
  ('amn_credit_approved',  'CREDIT_APPROVED',  'Credit Approved'),
  ('amn_internet',         'INTERNET',         'Internet'),
  ('amn_gas',              'GAS',              'Gas'),
  ('amn_radiant_floors',   'RADIANT_FLOORS',   'Radiant Floors'),
  ('amn_air_conditioning', 'AIR_CONDITIONING', 'Air Conditioning'),
  ('amn_barbecue',         'BARBECUE',         'Barbecue'),
  ('amn_laundry',          'LAUNDRY',          'Laundry'),
  ('amn_water',            'WATER',            'Water'),
  ('amn_tennis_court',     'TENNIS_COURT',     'Tennis Court')
ON CONFLICT ("key") DO NOTHING;
