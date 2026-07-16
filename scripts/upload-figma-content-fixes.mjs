// One-off: process and upload Figma reference images for the home-page
// content fixes (Our Services cards, team placeholder, testimonial
// placeholder) to the existing "Ulrich Assets" bucket.
// Run: node --env-file=.env scripts/upload-figma-content-fixes.mjs
import { readFile } from "node:fs/promises";

import sharp from "sharp";
// storage-js directly: supabase-js's realtime client needs Node 22+ WebSocket.
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const BUCKET = "Ulrich Assets";
const SRC_DIR = "/private/tmp/claude-501/-Users-apple-Desktop-Matias/8b66b5f7-5b4b-48fb-8742-c3ab9a7c2fd0/scratchpad/figma-imgs";

const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

// [source file, folder, target name, max long-edge px]
const FILES = [
  ["ventas.png", "HomePageFinal", "services-ventas.webp", 1200],
  ["alquileres.png", "HomePageFinal", "services-alquileres.webp", 1200],
  ["tasaciones.png", "HomePageFinal", "services-tasaciones.webp", 1200],
  ["9d117dca.jpg", "AboutUs", "team-placeholder.webp", 600],
  ["3511dcc0.jpg", "HomePageFinal", "testimonial-placeholder.webp", 400],
];

for (const [srcName, folder, targetName, maxDimension] of FILES) {
  const input = await readFile(`${SRC_DIR}/${srcName}`);
  const { data, info } = await sharp(input)
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const storagePath = `${folder}/${targetName}`;
  const { error } = await storage.from(BUCKET).upload(storagePath, data, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload ${targetName}: ${error.message}`);

  const { data: pub } = storage.from(BUCKET).getPublicUrl(storagePath);
  console.log(`✓ ${targetName} — ${info.width}x${info.height}, ${(data.length / 1024).toFixed(0)}KB`);
  console.log(`  ${pub.publicUrl}`);
}
