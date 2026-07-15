// One-off: process and upload the 5 static Featured Spots homepage images
// (Figma export) to the existing "Ulrich Assets" bucket, HomePageFinal
// folder — same convention as every other static homepage image.
// Run: node --env-file=.env scripts/upload-featured-spots.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
// storage-js directly: supabase-js's realtime client needs Node 22+ WebSocket.
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const BUCKET = "Ulrich Assets";
const FOLDER = "HomePageFinal";
const SRC_DIR = path.join(import.meta.dirname, "../src/assets/FeatureSpot");

const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

// [source file, target name, max long-edge px] — row-1 cards render larger
// (up to 400px tall, ~660px wide) than row-2 (240px tall, ~450px wide).
const FILES = [
  ["FeatureSpot1.png", "featured-martindale.webp", 1200],
  ["FeatureSpot2.png", "featured-altos-del-pilar.webp", 1200],
  ["FeatureSpot3.png", "featured-ayres-de-pilar.webp", 900],
  ["FeatureSpot4.png", "featured-bouquet-pilar.webp", 900],
  ["FeatureSpot5.png", "featured-vilahaus.webp", 900],
];

for (const [srcName, targetName, maxDimension] of FILES) {
  const input = await readFile(path.join(SRC_DIR, srcName));
  const { data, info } = await sharp(input)
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const storagePath = `${FOLDER}/${targetName}`;
  const { error } = await storage.from(BUCKET).upload(storagePath, data, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload ${targetName}: ${error.message}`);

  const { data: pub } = storage.from(BUCKET).getPublicUrl(storagePath);
  console.log(`✓ ${targetName} — ${info.width}x${info.height}, ${(data.length / 1024).toFixed(0)}KB`);
  console.log(`  ${pub.publicUrl}`);
}
