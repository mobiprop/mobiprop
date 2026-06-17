-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('BUYER', 'SELLER', 'BOTH');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('QUALIFICATION', 'VISITATION', 'OFFER', 'NEGOTIATION', 'CLOSING');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SALE', 'RENT', 'SALE_AND_RENT');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "address" TEXT,
    "type" "ContactType" NOT NULL DEFAULT 'BUYER',
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "assigned_agent_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_properties" (
    "contact_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER',

    CONSTRAINT "contact_properties_pkey" PRIMARY KEY ("contact_id","property_id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contact_id" TEXT,
    "property_id" TEXT,
    "deal_type" TEXT,
    "deal_size" DECIMAL(14,2),
    "stage" "OpportunityStage" NOT NULL DEFAULT 'QUALIFICATION',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "probability" INTEGER NOT NULL DEFAULT 50,
    "commission" DECIMAL(14,2),
    "commission_unit" TEXT,
    "payment_terms" TEXT,
    "contract_start" TIMESTAMP(3),
    "contract_end" TIMESTAMP(3),
    "expected_close_at" TIMESTAMP(3),
    "agent_commission" TEXT,
    "notes" TEXT,
    "assigned_agent_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contact_id" TEXT,
    "property_id" TEXT,
    "type" "ContractType" NOT NULL DEFAULT 'SALE',
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "value" DECIMAL(14,2),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "terms" TEXT,
    "notes" TEXT,
    "assigned_agent_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_contact_id_key" ON "contacts"("contact_id");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_agent_idx" ON "contacts"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "contacts_is_deleted_idx" ON "contacts"("is_deleted");

-- CreateIndex
CREATE INDEX "contact_properties_property_idx" ON "contact_properties"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_opportunity_id_key" ON "opportunities"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunities_contact_idx" ON "opportunities"("contact_id");

-- CreateIndex
CREATE INDEX "opportunities_property_idx" ON "opportunities"("property_id");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_id_key" ON "contracts"("contract_id");

-- CreateIndex
CREATE INDEX "contracts_contact_idx" ON "contracts"("contact_id");

-- CreateIndex
CREATE INDEX "contracts_property_idx" ON "contracts"("property_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- AddForeignKey
ALTER TABLE "contact_properties" ADD CONSTRAINT "contact_properties_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_properties" ADD CONSTRAINT "contact_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: deny all direct client access — all reads/writes go through server-side Prisma
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "contacts" FROM anon, authenticated;
REVOKE ALL ON "contact_properties" FROM anon, authenticated;
REVOKE ALL ON "opportunities" FROM anon, authenticated;
REVOKE ALL ON "contracts" FROM anon, authenticated;
