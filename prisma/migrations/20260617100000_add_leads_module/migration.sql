-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE_LISTING_INQUIRY', 'WEBSITE_CONTACT_FORM', 'SCHEDULED_TOUR', 'MANUAL', 'PHONE', 'EMAIL', 'WHATSAPP', 'REFERRAL', 'SOCIAL_MEDIA', 'IMPORT', 'EXTERNAL_API', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "LeadLifecycleStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'CLOSED');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "lead_number" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "primary_listing_id" TEXT,
    "assigned_agent_id" UUID,
    "created_by_id" UUID,
    "converted_opportunity_id" TEXT,
    "converted_at" TIMESTAMP(3),
    "submitted_name" TEXT NOT NULL,
    "submitted_email" TEXT,
    "submitted_phone" TEXT,
    "submitted_location" TEXT,
    "source" "LeadSource" NOT NULL,
    "source_detail" TEXT,
    "source_url" TEXT,
    "external_source" TEXT,
    "external_source_id" TEXT,
    "import_batch_id" TEXT,
    "budget_min" DECIMAL(14,2),
    "budget_max" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "score" INTEGER NOT NULL DEFAULT 0,
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD',
    "lifecycle_status" "LeadLifecycleStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "last_contacted_at" TIMESTAMP(3),
    "next_follow_up_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "actor_id" UUID,
    "type" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_lead_number_key" ON "leads"("lead_number");

-- CreateIndex
CREATE INDEX "leads_contact_idx" ON "leads"("contact_id");

-- CreateIndex
CREATE INDEX "leads_listing_idx" ON "leads"("primary_listing_id");

-- CreateIndex
CREATE INDEX "leads_agent_idx" ON "leads"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "leads_temperature_idx" ON "leads"("temperature");

-- CreateIndex
CREATE INDEX "leads_lifecycle_status_idx" ON "leads"("lifecycle_status");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_is_archived_idx" ON "leads"("is_archived");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_next_follow_up_idx" ON "leads"("next_follow_up_at");

-- CreateIndex
CREATE INDEX "lead_notes_lead_created_idx" ON "lead_notes"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_activities_lead_created_idx" ON "lead_activities"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_activities_actor_idx" ON "lead_activities"("actor_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_primary_listing_id_fkey" FOREIGN KEY ("primary_listing_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny all direct client access; all reads/writes go through server actions
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;
