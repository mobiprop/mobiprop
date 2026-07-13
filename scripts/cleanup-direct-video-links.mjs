// One-off follow-up to cleanup-youtube-links.mjs: 2 more migrated listings had
// a direct (non-YouTube) video link that the original WP HTML->text migration
// already stripped down to nothing (a `[video mp4="..."]` shortcode) or an
// orphaned filename (an `<a href="....mov">IMG_3772</a>` link, text kept,
// href dropped) — so they never showed up in the `description ilike '%youtu%'`
// sweep the first script ran. Source: wp-migration/estates.json (wpId 13900,
// 26667). Both files were confirmed still reachable (200, correct
// video/mp4 + video/quicktime content-type) before writing this.
// Run (dry run):   node --env-file=.env scripts/cleanup-direct-video-links.mjs
// Run (apply):     node --env-file=.env scripts/cleanup-direct-video-links.mjs --apply
import pg from "pg";

const apply = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const fixes = [
  {
    wpPostId: "13900",
    videoUrl: "https://www.ulrichpropiedades.com/wp-content/uploads/2018/03/TCC-cod-125-low-res.mp4",
    // No leftover text in the description to clean — the [video] shortcode
    // was already fully stripped by the original migration.
    cleanDescription: null,
  },
  {
    wpPostId: "26667",
    videoUrl: "https://www.ulrichpropiedades.com/wp-content/uploads/2021/02/IMG_3772.mov",
    // The <a> tag's href was dropped but its inner text ("IMG_3772") is still
    // sitting in the description as a meaningless orphan line — remove it.
    cleanDescription: (desc) => desc.replace(/\n?IMG_3772$/, "").trim(),
  },
];

for (const fix of fixes) {
  const { rows: [row] } = await pool.query(
    `select id, listing_id, description, video_url from properties where wp_post_id = $1`,
    [fix.wpPostId],
  );
  if (!row) {
    console.log(`wpPostId ${fix.wpPostId}: not found, skipping`);
    continue;
  }
  if (row.video_url) {
    console.log(`${row.listing_id}: skip — video_url already set to ${row.video_url}`);
    continue;
  }

  const newDescription = fix.cleanDescription ? fix.cleanDescription(row.description) : row.description;
  console.log(`${row.listing_id}: video_url -> ${fix.videoUrl}`);
  if (newDescription !== row.description) {
    console.log(`  description: ${JSON.stringify(row.description)} -> ${JSON.stringify(newDescription)}`);
  }

  if (apply) {
    await pool.query(
      `update properties set video_url = $1, description = $2, updated_at = now() where id = $3`,
      [fix.videoUrl, newDescription, row.id],
    );
    console.log(`  ✓ applied`);
  } else {
    console.log(`  (dry run) would apply the above`);
  }
}

await pool.end();
