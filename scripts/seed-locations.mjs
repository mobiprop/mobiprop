// One-off: bulk-add the remaining locations from the client's spreadsheet
// that weren't already entered manually via the dashboard. Maps only the
// columns our `Location` model actually has (name, address, region,
// postalCode) — City/Country/Primary Property Type/Status from the sheet
// aren't stored since there's no column for them.
// Run: node --env-file=.env scripts/seed-locations.mjs
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

// name, fullAddress (street only), city, region (province), postalCode
const ROWS = [
  ["Mendoza Centro", "Av. Colón 600", "Mendoza", "Mendoza", "M5500"],
  ["Luján de Cuyo", "San Martín 2500", "Luján de Cuyo", "Mendoza", "M5507"],
  ["San Miguel de Tucumán", "Av. Mate de Luna 1800", "San Miguel de Tucumán", "Tucumán", "T4000"],
  ["Yerba Buena", "Av. Aconquija 1700", "Yerba Buena", "Tucumán", "T4107"],
  ["Salta Capital", "Av. Belgrano 900", "Salta", "Salta", "A4400"],
  ["San Lorenzo", "Ruta Provincial 28", "San Lorenzo", "Salta", "A4401"],
  ["Neuquén Centro", "Av. Argentina 700", "Neuquén", "Neuquén", "Q8300"],
  ["San Martín de los Andes", "Av. San Martín 1100", "San Martín de los Andes", "Neuquén", "Q8370"],
  ["Bariloche Centro", "Av. Mitre 900", "San Carlos de Bariloche", "Río Negro", "R8400"],
  ["Cipolletti", "Av. Alem 1200", "Cipolletti", "Río Negro", "R8324"],
  ["Mar del Plata", "Av. Colón 2200", "Mar del Plata", "Buenos Aires", "B7600"],
  ["La Plata", "Calle 7 800", "La Plata", "Buenos Aires", "B1900"],
  ["Paraná Centro", "Av. Ramírez 1000", "Paraná", "Entre Ríos", "E3100"],
  ["Gualeguaychú", "Urquiza 900", "Gualeguaychú", "Entre Ríos", "E2820"],
  ["Posadas Centro", "Av. Corrientes 1800", "Posadas", "Misiones", "N3300"],
  ["Ushuaia Centro", "Av. San Martín 1200", "Ushuaia", "Tierra del Fuego", "V9410"],
];

const { rows: existing } = await pool.query(`select name from locations`);
const existingNames = new Set(existing.map((r) => r.name));

const [{ max }] = (await pool.query(
  `select max(cast(substring(location_id from 5) as integer)) as max from locations`,
)).rows;
let nextSeq = (max ?? 0) + 1;

let added = 0;
let skipped = 0;

for (const [name, fullAddress, city, region, postalCode] of ROWS) {
  if (existingNames.has(name)) {
    console.log(`- skip "${name}" (already exists)`);
    skipped++;
    continue;
  }

  const address = `${fullAddress}, ${city}`;
  const geocoded = await geocodeAddress(`${address}, ${region}, Argentina`);
  const id = crypto.randomUUID();
  const locationId = `LOC-${String(nextSeq++).padStart(4, "0")}`;

  await pool.query(
    `insert into locations (id, location_id, name, region, address, postal_code, latitude, longitude, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
    [id, locationId, name, region, address, postalCode, geocoded?.latitude ?? null, geocoded?.longitude ?? null],
  );

  console.log(`✓ ${locationId} "${name}" — ${address}, ${region}${geocoded ? "" : " (geocode failed)"}`);
  added++;
  // Be polite to the Geocoding API.
  await new Promise((r) => setTimeout(r, 150));
}

console.log(`\nDone. Added ${added}, skipped ${skipped} (already present).`);
await pool.end();
