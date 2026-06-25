// One-off: the Locations sector was just made DB-backed (Property.locationId
// FK added 2026-06-25). Existing properties only have a free-text `location`
// string — this creates a real `Location` row per distinct value and links
// every matching property to it, so the dashboard's exact-FK stats have
// something to count from day one.
// Run: node --env-file=.env scripts/backfill-property-locations.mjs
import crypto from "node:crypto";
import pg from "pg";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

async function geocodeAddress(address) {
  if (!apiKey || !address.trim()) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    const location = data.results?.[0]?.geometry?.location;
    if (data.status !== "OK" || !location) return null;
    return { latitude: location.lat, longitude: location.lng };
  } catch {
    return null;
  }
}

// "Palermo, Buenos Aires, Argentina" -> name "Palermo", region "Buenos Aires, Argentina"
function splitNameRegion(location) {
  const [first, ...rest] = location.split(",").map((s) => s.trim());
  return { name: first, region: rest.join(", ") || first };
}

const { rows } = await pool.query(
  `select id, location, full_address, postal_code from properties where location_id is null order by created_at`,
);
console.log(`${rows.length} properties without a locationId.`);

const groups = new Map();
for (const row of rows) {
  if (!groups.has(row.location)) groups.set(row.location, []);
  groups.get(row.location).push(row);
}
console.log(`${groups.size} distinct location strings to create Location rows for.`);

const [{ max }] = (await pool.query(
  `select max(cast(substring(location_id from 5) as integer)) as max from locations`,
)).rows;
let nextSeq = (max ?? 0) + 1;

for (const [locationText, properties] of groups) {
  const { name, region } = splitNameRegion(locationText);
  const sample = properties[0];
  const geocoded = await geocodeAddress(`${sample.full_address}, ${locationText}`);
  const id = crypto.randomUUID();
  const locationId = `LOC-${String(nextSeq++).padStart(4, "0")}`;

  await pool.query(
    `insert into locations (id, location_id, name, region, address, postal_code, latitude, longitude, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
    [id, locationId, name, region, sample.full_address, sample.postal_code ?? "", geocoded?.latitude ?? null, geocoded?.longitude ?? null],
  );

  await pool.query(`update properties set location_id = $1 where location = $2`, [id, locationText]);

  console.log(`✓ ${locationId} "${name}, ${region}" <- ${properties.length} listing(s) ("${locationText}")`);
}

console.log("\nDone.");
await pool.end();
