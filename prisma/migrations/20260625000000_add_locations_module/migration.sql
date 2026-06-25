-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_location_id_key" ON "locations"("location_id");

-- RowLevelSecurity
-- Deny ALL direct client (anon/authenticated PostgREST) access. No policies on
-- purpose — every read/write goes through server-side Prisma, which connects
-- as the table owner and bypasses RLS. Matches 20260624000000_enable_rls_crm_tables.
ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;
