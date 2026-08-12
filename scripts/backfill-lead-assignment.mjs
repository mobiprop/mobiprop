// One-off: backfill the "lead inherits listing's agent" rule (2026-08,
// requested by Matias) against leads created before the rule existed —
// mostly leads tied to WordPress-imported listings, which never got an
// assigned_agent_id/created_by_id in the first place.
//
// Fallback chain (matches src/features/crm/lead-assignment.ts):
//   1. the listing's assigned_agent_id, if that profile is ACTIVE
//   2. else the listing's created_by_id, if that profile is ACTIVE
//   3. else leave unassigned (reported for manual/admin triage)
//
// Defaults to a dry run — nothing is written unless --apply is passed.
// Run: node --env-file=.env scripts/backfill-lead-assignment.mjs [--apply]
import pg from "pg";

const APPLY = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const { rows: leads } = await pool.query(`
  select id, lead_number, primary_listing_id
  from leads
  where assigned_agent_id is null
    and is_archived = false
    and lifecycle_status not in ('CONVERTED', 'CLOSED', 'UNQUALIFIED')
`);
console.log(`${leads.length} unassigned, open lead(s) found.\n`);

const noListing = leads.filter((l) => !l.primary_listing_id);
const withListing = leads.filter((l) => l.primary_listing_id);

const listingIds = [...new Set(withListing.map((l) => l.primary_listing_id))];
const { rows: properties } = listingIds.length
  ? await pool.query(
      `select id, assigned_agent_id, created_by_id from properties where id = any($1::text[])`,
      [listingIds],
    )
  : { rows: [] };
const propertyById = new Map(properties.map((p) => [p.id, p]));

const candidateAgentIds = [
  ...new Set(properties.flatMap((p) => [p.assigned_agent_id, p.created_by_id]).filter(Boolean)),
];
const { rows: activeProfiles } = candidateAgentIds.length
  ? await pool.query(`select id from profiles where id = any($1::uuid[]) and status = 'ACTIVE'`, [
      candidateAgentIds,
    ])
  : { rows: [] };
const activeIds = new Set(activeProfiles.map((p) => p.id));

const resolvedToListingAgent = [];
const resolvedToCreator = [];
const stillUnresolved = [];

for (const lead of withListing) {
  const property = propertyById.get(lead.primary_listing_id);
  if (!property) {
    stillUnresolved.push(lead);
    continue;
  }
  if (property.assigned_agent_id && activeIds.has(property.assigned_agent_id)) {
    resolvedToListingAgent.push({ lead, agentId: property.assigned_agent_id });
  } else if (property.created_by_id && activeIds.has(property.created_by_id)) {
    resolvedToCreator.push({ lead, agentId: property.created_by_id });
  } else {
    stillUnresolved.push(lead);
  }
}

console.log(`→ ${resolvedToListingAgent.length} resolve to the listing's assigned agent.`);
console.log(`→ ${resolvedToCreator.length} resolve to the listing's creator (no listing agent).`);
console.log(`→ ${stillUnresolved.length} still unresolved (no valid agent or creator) — needs manual/admin triage.`);
console.log(`→ ${noListing.length} have no primary_listing_id at all — nothing to resolve against.\n`);

if (!APPLY) {
  console.log("Dry run — pass --apply to write changes.\n");
  for (const { lead, agentId } of [...resolvedToListingAgent, ...resolvedToCreator]) {
    console.log(`  would assign ${lead.lead_number} -> agent ${agentId}`);
  }
  for (const lead of stillUnresolved) {
    console.log(`  UNRESOLVED: ${lead.lead_number} (listing ${lead.primary_listing_id ?? "none"})`);
  }
  await pool.end();
  process.exit(0);
}

const toApply = [...resolvedToListingAgent, ...resolvedToCreator];
for (const { lead, agentId } of toApply) {
  await pool.query(`update leads set assigned_agent_id = $1, updated_at = now() where id = $2`, [
    agentId,
    lead.id,
  ]);
  await pool.query(
    `insert into lead_activities (id, lead_id, type, field_name, old_value, new_value, created_at)
     values (gen_random_uuid(), $1, 'LEAD_ASSIGNED', 'assignedAgentId', 'null'::jsonb, to_jsonb($2::text), now())`,
    [lead.id, agentId],
  );
  console.log(`  ✓ ${lead.lead_number} -> agent ${agentId}`);
}

console.log(`\nDone. ${toApply.length} lead(s) assigned, ${stillUnresolved.length} still need manual triage.`);
await pool.end();
