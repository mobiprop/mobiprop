// One-off: the pilot run linked 0 amenities (id/key mixup) and appended every
// facility label to descriptions. Recompute both for the already-imported rows.
import { readFileSync } from "node:fs";
import pg from "pg";

const AMENITY_MAP = {
  "Pileta": "amn_pool", "Cochera": "amn_parking", "Garage": "amn_parking",
  "Aire acondicionado": "amn_air_conditioning", "Aire acond. central": "amn_air_conditioning",
  "Seguridad 24 hs": "amn_security", "Tarjeta de acceso": "amn_security",
  "Parrilla": "amn_barbecue", "Cancha de Tenis": "amn_tennis_court",
  "Gimnasio": "amn_gym", "Internet": "amn_internet",
  "Calef x por losa rad": "amn_radiant_floors",
  "Lavadero": "amn_laundry", "Lavarropas": "amn_laundry", "Servicio de laundry": "amn_laundry",
  "Balcón": "amn_balcony", "Con muebles": "amn_furnished", "Huerta": "amn_garden",
};

const estates = JSON.parse(readFileSync("/Users/apple/Desktop/Matias/wp-migration/estates.json", "utf8"));
const state = JSON.parse(readFileSync("/Users/apple/Desktop/Matias/wp-migration/import-state.json", "utf8"));
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

for (const [wpId, s] of Object.entries(state)) {
  if (!s.done) continue;
  const e = estates.find((x) => x.wpId === wpId);
  const mapped = [...new Set(e.amenities.map((l) => AMENITY_MAP[l]).filter(Boolean))];
  const unmapped = e.amenities.filter((l) => !AMENITY_MAP[l]);

  for (const amenityId of mapped) {
    await pool.query(
      `insert into property_amenities (property_id, amenity_id) values ($1,$2) on conflict do nothing`,
      [s.propertyId, amenityId],
    );
  }
  // Rebuild the trailing "Instalaciones:" line with only the unmapped labels.
  const { rows: [row] } = await pool.query(`select description from properties where id = $1`, [s.propertyId]);
  let desc = row.description.replace(/\n\nInstalaciones: .*$/s, "");
  if (unmapped.length) desc += `\n\nInstalaciones: ${unmapped.join(", ")}.`;
  await pool.query(`update properties set description = $1, updated_at = now() where id = $2`, [desc, s.propertyId]);
  console.log(`✓ ${s.listingId}: ${mapped.length} amenities linked, ${unmapped.length} left in description`);
}
await pool.end();
