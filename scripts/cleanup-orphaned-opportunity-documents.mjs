// One-off (2026-07-14, per client's Opportunity/DocuSign simplification):
// the "Supporting Documents" concept on Opportunities was removed in favor
// of a single contract surface (real DocuSign envelopes). Before the
// opportunity_documents table is dropped (see
// prisma/migrations/20260714010000_simplify_opportunity_contracts), this
// script checks every OpportunityDocument row against the docusign_envelopes
// table: if it was actually sent through DocuSign (an envelope on the same
// opportunity copied its url/fileName/mimeType verbatim at send time — the
// old "Use Supporting Document" send path), the envelope already carries a
// self-contained snapshot and needs no migration, so the row is left alone.
// If it was never sent, its storage object is deleted so nothing goes
// orphaned in the opportunity-documents bucket once the table disappears.
//
// Default is a dry run (report only). Pass --apply to actually delete
// storage objects. Run: node --env-file=.env scripts/cleanup-orphaned-opportunity-documents.mjs [--apply]
import pg from "pg";
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const apply = process.argv.includes("--apply");

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const client = await pool.connect();

try {
  console.log(apply ? "Running in APPLY mode — storage objects will be deleted." : "Running in DRY RUN mode — pass --apply to actually delete.");

  const { rows: docs } = await client.query(`
    select id, opportunity_id, file_name, storage_path, url, mime_type
    from opportunity_documents
    order by created_at
  `);
  console.log(`Found ${docs.length} opportunity_documents row(s).\n`);

  let sentCount = 0;
  let orphanCount = 0;
  let mismatchCount = 0;

  for (const doc of docs) {
    const { rows: matches } = await client.query(
      `select id, document_file_name, document_mime_type, document_storage_path
       from docusign_envelopes
       where opportunity_id = $1 and document_url = $2 and source = 'CUSTOM_UPLOAD'`,
      [doc.opportunity_id, doc.url],
    );

    if (matches.length > 0) {
      const env = matches[0];
      const selfContained =
        env.document_storage_path === null &&
        env.document_file_name === doc.file_name &&
        env.document_mime_type === doc.mime_type;
      console.log(
        `  ✓ SENT — kept — opportunity_document ${doc.id} ("${doc.file_name}") -> envelope ${env.id}` +
          (selfContained ? "" : " (snapshot DIFFERS — review by hand)"),
      );
      sentCount++;
      if (!selfContained) mismatchCount++;
      continue;
    }

    orphanCount++;
    console.log(`  ${apply ? "✗ DELETING" : "would delete"} storage object "${doc.storage_path}" (opportunity_document ${doc.id}, "${doc.file_name}")`);
    if (apply) {
      const { error } = await storage.from("opportunity-documents").remove([doc.storage_path]);
      if (error) console.error(`    ! failed: ${error.message}`);
    }
  }

  console.log(
    `\nTotal: ${docs.length} row(s) — ${sentCount} sent (kept), ${orphanCount} orphaned (${apply ? "deleted" : "would delete"}), ${mismatchCount} snapshot mismatch(es) to review by hand.`,
  );
} finally {
  client.release();
  await pool.end();
}
