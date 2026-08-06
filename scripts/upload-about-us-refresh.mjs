// One-off: upload the client-approved About Us image refresh (per updated
// Figma design, node 103:5271) to the existing "Ulrich Assets" bucket.
// Run: node --env-file=.env scripts/upload-about-us-refresh.mjs
import { readFile } from "node:fs/promises";

//storage-js directly: supabase-js's realtime client needs Node 22+ WebSocket.
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const BUCKET = "Ulrich Assets";
const SRC_DIR = "/private/tmp/claude-501/-Users-apple-Desktop-Matias/7222fc73-9c6c-487e-ac56-3c7439c36114/scratchpad";

const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const FILES = [
  "ourstory-2026.webp",
  "expertise-2026.webp",
  "team-2026.webp",
  "gallery-1-2026.webp",
  "gallery-2-2026.webp",
  "gallery-3-2026.webp",
  "gallery-4-2026.webp",
  "gallery-5-2026.webp",
  "gallery-6-2026.webp",
  "gallery-7-2026.webp",
  "gallery-8-2026.webp",
  "gallery-9-2026.webp",
];

for (const name of FILES) {
  const data = await readFile(`${SRC_DIR}/${name}`);
  const storagePath = `AboutUs/${name}`;
  const { error } = await storage.from(BUCKET).upload(storagePath, data, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload ${name}: ${error.message}`);

  const { data: pub } = storage.from(BUCKET).getPublicUrl(storagePath);
  console.log(`✓ ${name} — ${(data.length / 1024).toFixed(0)}KB`);
  console.log(`  ${pub.publicUrl}`);
}
