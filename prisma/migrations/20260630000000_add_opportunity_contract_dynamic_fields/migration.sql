-- Opportunities: split the free-text "agent_commission" string into a
-- structured value+unit pair (mirrors commission/commission_unit), and add
-- soft-delete columns to match Contact's pattern.
ALTER TABLE "opportunities" DROP COLUMN "agent_commission";
ALTER TABLE "opportunities" ADD COLUMN "agent_commission_value" DECIMAL(14,2);
ALTER TABLE "opportunities" ADD COLUMN "agent_commission_unit" TEXT;
ALTER TABLE "opportunities" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "opportunities" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "opportunities_is_deleted_idx" ON "opportunities"("is_deleted");

-- Contracts: soft-delete columns + expiry-notification idempotency marker.
ALTER TABLE "contracts" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN "expiry_notified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "contracts_is_deleted_idx" ON "contracts"("is_deleted");

-- CreateTable
CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_documents_contract_idx" ON "contract_documents"("contract_id");

-- AddForeignKey
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: deny-all from the client roles, same as every other CRM table — all
-- access goes through server actions using the service-role connection.
ALTER TABLE "contract_documents" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "contract_documents" FROM anon, authenticated;
