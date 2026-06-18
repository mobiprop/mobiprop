// One-off: geocode existing properties that have no latitude/longitude yet.
// Geocoding normally runs at create/update time (src/lib/maps.ts), so any
// listing saved while GOOGLE_MAPS_API_KEY was unset/invalid is missing
// coordinates forever — this fills those in using the same Google Geocoding
// API call, without touching properties that already have coordinates.
// Run: node --env-file=.env scripts/backfill-geocode.mjs
import pg from "pg";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_MAPS_API_KEY is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

async function geocodeAddress(address) {
  const query = address.trim();
  if (!query) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    const location = data.results?.[0]?.geometry?.location;
    if (data.status !== "OK" || !location) return { error: data.status };
    return { latitude: location.lat, longitude: location.lng };
  } catch (err) {
    return { error: err.message };
  }
}

const { rows } = await pool.query(
  `select id, listing_id, title, location, full_address from properties
   where latitude is null or longitude is null
   order by created_at`,
);
console.log(`${rows.length} properties missing coordinates.`);

let geocoded = 0;
let failed = 0;
for (const row of rows) {
  const address = `${row.full_address}, ${row.location}`;
  const result = await geocodeAddress(address);
  if (result && !result.error) {
    await pool.query(`update properties set latitude = $1, longitude = $2 where id = $3`, [
      result.latitude,
      result.longitude,
      row.id,
    ]);
    geocoded++;
    console.log(`✓ ${row.listing_id} "${row.title}" -> ${result.latitude}, ${result.longitude}`);
  } else {
    failed++;
    console.log(`✗ ${row.listing_id} "${row.title}" (${address}) -> ${result?.error ?? "no result"}`);
  }
  // Be polite to the Geocoding API.
  await new Promise((r) => setTimeout(r, 200));
}

console.log(`\nDone. Geocoded ${geocoded}, failed ${failed}.`);
await pool.end();
