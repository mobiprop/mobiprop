-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "tour_number" TEXT NOT NULL,
    "submitted_name" TEXT NOT NULL,
    "submitted_email" TEXT,
    "submitted_phone" TEXT,
    "submitted_message" TEXT,
    "contact_id" TEXT NOT NULL,
    "property_id" TEXT,
    "lead_id" TEXT,
    "assigned_agent_id" UUID,
    "created_by_id" UUID,
    "status" "TourStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "confirmation_note" TEXT,
    "reschedule_note" TEXT,
    "cancellation_reason" TEXT,
    "completion_note" TEXT,
    "rescheduled_from" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'PUBLIC_REQUEST',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tours_tour_number_key" ON "tours"("tour_number");

-- CreateIndex
CREATE INDEX "tours_contact_idx" ON "tours"("contact_id");

-- CreateIndex
CREATE INDEX "tours_property_idx" ON "tours"("property_id");

-- CreateIndex
CREATE INDEX "tours_lead_idx" ON "tours"("lead_id");

-- CreateIndex
CREATE INDEX "tours_agent_idx" ON "tours"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "tours_status_idx" ON "tours"("status");

-- CreateIndex
CREATE INDEX "tours_scheduled_at_idx" ON "tours"("scheduled_at");

-- CreateIndex
CREATE INDEX "tours_created_at_idx" ON "tours"("created_at");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: deny all direct client access; all reads/writes go through server actions
ALTER TABLE "tours" ENABLE ROW LEVEL SECURITY;
