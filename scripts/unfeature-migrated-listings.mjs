// One-off: the WP import carried the source site's "featured" flag straight
// through (344/350 posts had it set), so almost every migrated listing landed
// on the public site marked Featured. Reset all migrated listings to
// not-featured; staff re-feature specific ones from the dashboard afterward.
// Run (dry run):   node --env-file=.env scripts/unfeature-migrated-listings.mjs
// Run (apply):     node --env-file=.env scripts/unfeature-migrated-listings.mjs --apply
import pg from "pg";

const apply = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const { rows } = await pool.query(`
  select listing_id from properties where wp_post_id is not null and is_featured = true order by listing_id
`);

console.log(`${rows.length} migrated listings currently featured.`);

if (apply) {
  const { rowCount } = await pool.query(`
    update properties set is_featured = false, updated_at = now()
    where wp_post_id is not null and is_featured = true
  `);
  console.log(`✓ un-featured ${rowCount} listings.`);
} else {
  console.log("(dry run) would set is_featured = false on the listings above. Re-run with --apply.");
}

await pool.end();
