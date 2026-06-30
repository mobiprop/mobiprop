-- contract_documents has zero rows at this point in development (the table
-- was created earlier this same session) — safe to add a NOT NULL column
-- without a default. Storing the real storage path avoids deriving it by
-- parsing the (signed, expiring) public URL on delete.
ALTER TABLE "contract_documents" ADD COLUMN "storage_path" TEXT NOT NULL;
