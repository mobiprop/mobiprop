// One-off: 11 WP-migrated listings have a raw YouTube link pasted inline in
// their description (leftover from the WP "[embed]...[/embed]" shortcode,
// stripped down to a bare URL by the import). Move each link into the
// video_url column (already rendered by VideoPreviewSection on the public
// listing page) and remove it from the description text.
// Run (dry run):   node --env-file=.env scripts/cleanup-youtube-links.mjs
// Run (apply):     node --env-file=.env scripts/cleanup-youtube-links.mjs --apply
import pg from "pg";

const apply = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const urlRe = /https?:\/\/(?:www\.)?(?:youtube\.com|m\.youtube\.com|youtu\.be)\/\S+/i;

function cleanDescription(desc, url) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withWhitespace = new RegExp(`[ \\t]*\\n*[ \\t]*${escaped}[ \\t]*\\n*[ \\t]*`, "i");
  const match = desc.match(withWhitespace);
  if (!match) return desc;
  const replacement = match.index === 0 ? "" : "\n\n";
  return (desc.slice(0, match.index) + replacement + desc.slice(match.index + match[0].length))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const { rows } = await pool.query(`
  select id, listing_id, description, video_url
  from properties
  where wp_post_id is not null and description ~* 'youtube\\.com|youtu\\.be'
  order by listing_id
`);

console.log(`${rows.length} migrated listings with a YouTube link in the description.\n`);

for (const row of rows) {
  const match = row.description.match(urlRe);
  if (!match) continue;
  const url = match[0];
  const cleanedDescription = cleanDescription(row.description, url);

  console.log(`${row.listing_id}: ${url}`);
  if (row.video_url) {
    console.log(`  skip — video_url already set to ${row.video_url}`);
    continue;
  }

  if (apply) {
    await pool.query(
      `update properties set video_url = $1, description = $2, updated_at = now() where id = $3`,
      [url, cleanedDescription, row.id],
    );
    console.log(`  ✓ moved to video_url, description cleaned`);
  } else {
    console.log(`  (dry run) would set video_url and strip the link from the description`);
  }
}

await pool.end();
