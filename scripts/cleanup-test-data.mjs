// One-off (2026-07-08, client-approved plan): wipe all development/test data,
// keeping only — the 341 WordPress-imported listings + their locations/images,
// admin & manager accounts, the developer agent account (agent@developer.com),
// Agent Test (agent@ulrichpropiedades.com), the client's user account
// (matiasulrich@hotmail.com), and docusign_settings.
// Run: node --env-file=.env scripts/cleanup-test-data.mjs
import pg from "pg";
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const DELETE_EMAILS = [
  // 4 fake demo agents (Agent Test + developer accounts are kept)
  "hernan.castro@ulrich.com",
  "patricia.luna@ulrich.com",
  "valentina.ruiz@ulrich.com",
  "martin.espinoza@ulrich.com",
  // 6 test public users (matiasulrich@hotmail.com is kept)
  "tested@yopmail.com",
  "user@ulrichpropiedades.com",
  "tourtest@yopmail.com",
  "tourtest+1782215217@yopmail.com",
  "email@yopmail.com",
  "dev.univisionz@gmail.com",
];

const client = await pool.connect();
const del = async (label, sql, params = []) => {
  const { rowCount } = await client.query(sql, params);
  console.log(`  ✓ ${label}: ${rowCount}`);
  return rowCount;
};

try {
  // ── Collect storage paths before rows disappear ────────────────────────────
  const { rows: propImgs } = await client.query(
    `select i.storage_path from property_images i join properties p on p.id = i.property_id where p.wp_post_id is null`);
  const { rows: chatFiles } = await client.query(`select storage_path from message_attachments`);
  const { rows: oppDocs } = await client.query(`select storage_path from opportunity_documents`);
  const { rows: delProfiles } = await client.query(
    `select id, email from profiles where email = any($1)`, [DELETE_EMAILS]);
  const delIds = delProfiles.map((r) => r.id);
  console.log(`accounts to delete: ${delProfiles.map((r) => r.email).join(", ")}`);

  // Safety: no kept property may reference a profile being deleted.
  const { rows: [refs] } = await client.query(
    `select count(*) from properties where wp_post_id is not null
       and (assigned_agent_id = any($1) or created_by_id = any($1))`, [delIds]);
  if (Number(refs.count) > 0) throw new Error("kept listings reference a profile marked for deletion — aborting");

  await client.query("begin");
  console.log("— CRM data —");
  await del("tours", `delete from tours`);
  await del("docusign envelopes", `delete from docusign_envelopes`);
  await del("opportunity documents", `delete from opportunity_documents`);
  await del("opportunity participants", `delete from opportunity_participants`);
  await del("opportunity listings", `delete from opportunity_listings`);
  await del("opportunities", `delete from opportunities`);
  await del("leads", `delete from leads`);
  await del("contact-property links", `delete from contact_properties`);
  await del("contacts", `delete from contacts`);

  console.log("— test listings & locations —");
  await del("saved properties", `delete from saved_properties`);
  await del("test listings (images/amenities cascade)", `delete from properties where wp_post_id is null`);
  await del("unused seed locations",
    `delete from locations l where not exists (select 1 from properties p where p.location_id = l.id)`);

  console.log("— history —");
  await del("notifications (deliveries cascade)", `delete from notifications`);
  await del("activity logs", `delete from activity_logs`);
  await del("agent invitations", `delete from agent_invitations`);
  await del("message attachments", `delete from message_attachments`);
  await del("messages", `delete from messages`);
  await del("conversation participants", `delete from conversation_participants`);
  await del("conversations", `delete from conversations`);

  console.log("— accounts —");
  await del("push subscriptions", `delete from push_subscriptions where user_id = any($1)`, [delIds]);
  await del("profiles", `delete from profiles where id = any($1)`, [delIds]);
  await del("auth.users (login access)", `delete from auth.users where id = any($1::uuid[])`, [delIds]);
  await client.query("commit");

  // ── Storage (best-effort, after commit) ────────────────────────────────────
  console.log("— storage files —");
  const remove = async (bucket, paths) => {
    if (!paths.length) return console.log(`  ✓ ${bucket}: nothing to remove`);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) console.log(`  ✗ ${bucket}: ${error.message}`);
    }
    console.log(`  ✓ ${bucket}: ${paths.length} objects removed`);
  };
  await remove("property-images", propImgs.map((r) => r.storage_path));
  await remove("chat-attachments", chatFiles.map((r) => r.storage_path));
  await remove("opportunity-documents", oppDocs.map((r) => r.storage_path));
  for (const p of delProfiles) {
    const { data: files } = await storage.from("avatars").list(p.id);
    if (files?.length) await remove("avatars", files.map((f) => `${p.id}/${f.name}`));
  }

  console.log("\nDone. Remaining:");
  const { rows: [summary] } = await pool.query(`select
    (select count(*) from properties) as properties,
    (select count(*) from property_images) as images,
    (select count(*) from locations) as locations,
    (select count(*) from profiles) as accounts,
    (select count(*) from contacts) + (select count(*) from leads) + (select count(*) from opportunities) + (select count(*) from tours) as crm_rows`);
  console.table([summary]);
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("ABORTED — nothing was deleted:", e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
