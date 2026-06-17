-- CreateTable
CREATE TABLE "saved_properties" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_unique" ON "saved_properties"("profile_id", "property_id");

-- CreateIndex
CREATE INDEX "saved_properties_profile_idx" ON "saved_properties"("profile_id");

-- RLS: each user can only read/write their own saved rows.
ALTER TABLE "saved_properties" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_properties_select_own"
  ON "saved_properties" FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "saved_properties_insert_own"
  ON "saved_properties" FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "saved_properties_delete_own"
  ON "saved_properties" FOR DELETE
  USING (profile_id = auth.uid());
