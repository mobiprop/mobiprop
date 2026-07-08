// One-off: import WordPress "estate" listings (parsed from the WXR export into
// /Users/apple/Desktop/Matias/wp-migration/estates.json) as Property rows with
// optimized images in the property-images bucket. Idempotent per WP post id via
// the state file next to estates.json — safe to re-run after an interruption.
// Run from the project root:
//   node --env-file=.env scripts/import-wp-estates.mjs --wp-ids 123,456
//   node --env-file=.env scripts/import-wp-estates.mjs --limit 10 [--dry-run]
//   node --env-file=.env scripts/import-wp-estates.mjs --all
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import sharp from "sharp";
// storage-js directly: supabase-js's realtime client needs Node 22+ WebSocket.
// pnpm doesn't hoist the nested package, so import it from the store path.
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const STAGING_DIR = "/Users/apple/Desktop/Matias/wp-migration";
const ESTATES_FILE = `${STAGING_DIR}/estates.json`;
const STATE_FILE = `${STAGING_DIR}/import-state.json`;
const BUCKET = "property-images";
// Match src/lib/images.ts exactly so imported photos look like dashboard uploads.
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 90;
const DOWNLOAD_DELAY_MS = 300; // be polite to the WP server

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const importAll = args.includes("--all");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : null;
const idsIdx = args.indexOf("--wp-ids");
const onlyIds = idsIdx >= 0 ? new Set(args[idsIdx + 1].split(",")) : null;

if (!importAll && !limit && !onlyIds) {
  console.error("Pass --wp-ids <id,id,...>, --limit <n>, or --all.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

// ── WP → app mappings ─────────────────────────────────────────────────────────

const TYPE_MAP = {
  Casa: "HOUSE",
  Departamento: "APARTMENT",
  Lotes: "LOT",
  Oficina: "COMMERCIAL_OFFICE",
};

const OPERATION_MAP = {
  "Venta": "SALE",
  "Alquiler": "RENT",
  "Alquiler+Venta": "SALE_AND_RENT",
};

// Stamps that carry a real lifecycle meaning; everything else ("FINANCIA",
// "OPORT!", "c/renta", ...) is marketing copy and maps to ACTIVE.
const STAMP_STATUS = {
  VENDIDA: "SOLD",
  ALQUILADA: "RENTED",
  SUSPENDIDA: "PAUSED",
  SUSPENDIDO: "PAUSED",
  RESERVADO: "PAUSED",
};

// WP facility label → seeded amenity key. Labels with no counterpart in the
// catalog are preserved by appending them to the description instead.
const AMENITY_MAP = {
  "Pileta": "amn_pool",
  "Cochera": "amn_parking",
  "Garage": "amn_parking",
  "Aire acondicionado": "amn_air_conditioning",
  "Aire acond. central": "amn_air_conditioning",
  "Seguridad 24 hs": "amn_security",
  "Tarjeta de acceso": "amn_security",
  "Parrilla": "amn_barbecue",
  "Cancha de Tenis": "amn_tennis_court",
  "Gimnasio": "amn_gym",
  "Internet": "amn_internet",
  "Calef x por losa rad": "amn_radiant_floors",
  "Lavadero": "amn_laundry",
  "Lavarropas": "amn_laundry",
  "Servicio de laundry": "amn_laundry",
  "Balcón": "amn_balcony",
  "Con muebles": "amn_furnished",
  "Huerta": "amn_garden",
};

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// "Barrio Cerrado Las Liebres, Avenida X, Garin, Buenos Aires Province, Argentina"
// → city/province/country from the tail segments.
function parseAddressTail(address) {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return { city: null, province: null, country: parts.at(-1) ?? null };
  return { city: parts.at(-3), province: parts.at(-2), country: parts.at(-1) };
}

function mapEstate(e, amenityIdByKey, locationIdByName) {
  const warnings = [];

  const type = TYPE_MAP[e.type[0]] ?? "HOUSE";
  if (!e.type[0]) warnings.push("no type in WP — defaulted to HOUSE");

  const opKey = [...e.operation].sort().join("+");
  const operationType = OPERATION_MAP[opKey] ?? "SALE";
  if (!OPERATION_MAP[opKey]) warnings.push(`no operation in WP ("${opKey}") — defaulted to SALE`);

  const price = e.price ? Number(e.price) : null;
  if (!price && e.priceTxt) warnings.push(`price on request ("${e.priceTxt}")`);
  else if (!price) warnings.push("no price in WP");
  if (operationType !== "SALE" && price) {
    warnings.push("rental price imported as-is; app displays USD — verify currency");
  }

  const stampKey = (e.stamp ?? "").trim().toUpperCase();
  const status = STAMP_STATUS[stampKey] ?? "ACTIVE";
  if (e.stamp && !STAMP_STATUS[stampKey]) warnings.push(`marketing stamp "${e.stamp}" dropped`);

  const amenityIds = [];
  const unmapped = [];
  for (const label of e.amenities) {
    const key = AMENITY_MAP[label];
    if (key && amenityIdByKey.has(key)) amenityIds.push(amenityIdByKey.get(key));
    else unmapped.push(label);
  }

  let description = stripHtml(e.description) || e.title;
  if (unmapped.length) description += `\n\nInstalaciones: ${unmapped.join(", ")}.`;

  const locationName = e.location[0] ?? e.address.split(",")[0].trim();
  const locationId = locationIdByName.get(locationName.toLowerCase()) ?? null;
  const tail = parseAddressTail(e.address);

  return {
    id: randomUUID(),
    slug: e.slug || slugify(e.title),
    title: e.title,
    description,
    type,
    status,
    operationType,
    salePrice: operationType === "RENT" ? null : price,
    rentPrice: operationType === "RENT" ? price : null,
    location: locationName,
    locationId,
    fullAddress: e.address,
    city: tail.city,
    province: tail.province,
    country: tail.country,
    latitude: e.lat ? Number(e.lat) : null,
    longitude: e.lng ? Number(e.lng) : null,
    bedrooms: e.bedrooms ? Number(e.bedrooms) : null,
    bathrooms: e.bathrooms ? Number(e.bathrooms) : null,
    totalAreaM2: e.areaM2 ? Math.round(Number(e.areaM2)) : null,
    parkingSpaces: e.parking ? Number(e.parking) : null,
    isFeatured: e.featured === true,
    publishedAt: e.postDate ? new Date(e.postDate + "Z") : new Date(),
    amenityIds: [...new Set(amenityIds)],
    warnings,
  };
}

// ── Images ────────────────────────────────────────────────────────────────────

async function downloadImage(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return downloadImage(url, attempt + 1);
    }
    throw err;
  }
}

async function importImages(client, propertyId, imageUrls) {
  let sortOrder = 0;
  let failed = 0;
  for (const srcUrl of imageUrls) {
    try {
      const input = await downloadImage(srcUrl);
      const { data, info } = await sharp(input)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });

      const imageId = randomUUID();
      const storagePath = `${propertyId}/${imageId}.webp`;
      const { error } = await storage.from(BUCKET).upload(storagePath, data, {
        contentType: "image/webp",
        upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data: pub } = storage.from(BUCKET).getPublicUrl(storagePath);

      await client.query(
        `insert into property_images
           (id, property_id, url, storage_path, original_file_name, mime_type,
            size_bytes, width, height, format, sort_order, is_cover)
         values ($1,$2,$3,$4,$5,'image/webp',$6,$7,$8,'webp',$9,$10)`,
        [imageId, propertyId, pub.publicUrl, storagePath, srcUrl.split("/").pop(),
         data.length, info.width, info.height, sortOrder, sortOrder === 0],
      );
      sortOrder++;
    } catch (err) {
      failed++;
      console.log(`    ✗ image ${srcUrl.split("/").pop()}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, DOWNLOAD_DELAY_MS));
  }
  return { uploaded: sortOrder, failed };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const estates = JSON.parse(readFileSync(ESTATES_FILE, "utf8"));
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));

const { rows: importedRows } = await pool.query(
  `select wp_post_id from properties where wp_post_id is not null`,
);
const alreadyImported = new Set(importedRows.map((r) => r.wp_post_id));

let candidates = estates.filter(
  (e) => e.status === "publish" && !state[e.wpId]?.done && !alreadyImported.has(e.wpId),
);
if (onlyIds) candidates = candidates.filter((e) => onlyIds.has(e.wpId));
if (limit) candidates = candidates.slice(0, limit);
console.log(`${candidates.length} listings to import${dryRun ? " (dry run)" : ""}.`);

// AMENITY_MAP values are the seeded row *ids* (amn_*); `key` is UPPERCASE.
const { rows: amenityRows } = await pool.query(`select id from amenities`);
const amenityIdByKey = new Map(amenityRows.map((r) => [r.id, r.id]));
const { rows: locationRows } = await pool.query(`select id, name from locations`);
const locationIdByName = new Map(locationRows.map((r) => [r.name.toLowerCase(), r.id]));

const { rows: [maxRow] } = await pool.query(
  `select max(cast(substring(listing_id from 5) as integer)) as max from properties where listing_id like 'LST-%'`,
);
let nextNum = (maxRow.max ?? 0) + 1;

let ok = 0;
let failed = 0;
for (const e of candidates) {
  const mapped = mapEstate(e, amenityIdByKey, locationIdByName);
  console.log(`\n[wp ${e.wpId}] ${e.title} → ${mapped.type}/${mapped.operationType}/${mapped.status}, ${e.images.length} images`);
  for (const w of mapped.warnings) console.log(`    ⚠ ${w}`);

  if (dryRun) continue;

  const client = await pool.connect();
  try {
    // Re-runs must not duplicate: reuse the row a previous partial run created.
    const listingId = state[e.wpId]?.listingId ?? `LST-${String(nextNum++).padStart(4, "0")}`;
    const propertyId = state[e.wpId]?.propertyId ?? mapped.id;

    // Slug collision (WP had duplicates / listing pre-exists) → suffix by wp id.
    const { rows: slugHit } = await client.query(
      `select id from properties where slug = $1 and id <> $2`, [mapped.slug, propertyId],
    );
    const slug = slugHit.length ? `${mapped.slug}-wp${e.wpId}` : mapped.slug;

    await client.query("begin");
    // wp_post_id marks migrated rows apart from in-app/test listings, and its
    // unique index makes re-imports impossible even if the state file is lost.
    await client.query(
      `insert into properties
         (id, listing_id, slug, title, description, type, status, operation_type,
          sale_price, rent_price, location, location_id, full_address, city, province,
          country, latitude, longitude, bedrooms, bathrooms, total_area_m2,
          parking_spaces, is_featured, published_at, wp_post_id, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,now())
       on conflict (id) do nothing`,
      [propertyId, listingId, slug, mapped.title, mapped.description, mapped.type,
       mapped.status, mapped.operationType, mapped.salePrice, mapped.rentPrice,
       mapped.location, mapped.locationId, mapped.fullAddress, mapped.city,
       mapped.province, mapped.country, mapped.latitude, mapped.longitude,
       mapped.bedrooms, mapped.bathrooms, mapped.totalAreaM2, mapped.parkingSpaces,
       mapped.isFeatured, mapped.publishedAt, e.wpId],
    );
    for (const amenityId of mapped.amenityIds) {
      await client.query(
        `insert into property_amenities (property_id, amenity_id) values ($1,$2) on conflict do nothing`,
        [propertyId, amenityId],
      );
    }
    await client.query("commit");

    state[e.wpId] = { propertyId, listingId, slug, done: false };
    saveState();

    // Skip images already uploaded by a previous partial run.
    const { rows: [{ count }] } = await client.query(
      `select count(*)::int as count from property_images where property_id = $1`, [propertyId],
    );
    const remaining = e.images.slice(Number(count));
    const { uploaded, failed: imgFailed } = await importImages(client, propertyId, remaining);
    console.log(`    ✓ ${listingId} "${slug}" — ${Number(count) + uploaded}/${e.images.length} images${imgFailed ? `, ${imgFailed} failed` : ""}`);

    state[e.wpId].done = true;
    state[e.wpId].images = Number(count) + uploaded;
    state[e.wpId].imageFailures = imgFailed;
    saveState();
    ok++;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    console.log(`    ✗ FAILED: ${err.message}`);
    failed++;
  } finally {
    client.release();
  }
}

console.log(`\nDone. ${ok} imported, ${failed} failed, state in ${STATE_FILE}`);
await pool.end();
