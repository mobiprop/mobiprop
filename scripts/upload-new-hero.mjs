// One-off: upload the client-supplied higher-quality homepage hero image
// to the existing "Ulrich Assets" bucket under a new filename so the
// old homehero.webp isn't clobbered until the code switch is verified.
// Run: node --env-file=.env scripts/upload-new-hero.mjs
import { readFile } from "node:fs/promises";

// storage-js directly: supabase-js's realtime client needs Node 22+ WebSocket.
import { StorageClient } from "../node_modules/.pnpm/@supabase+storage-js@2.108.1/node_modules/@supabase/storage-js/dist/index.mjs";

const BUCKET = "Ulrich Assets";
const SRC = "/private/tmp/claude-501/-Users-apple-Desktop-Matias/7222fc73-9c6c-487e-ac56-3c7439c36114/scratchpad/homehero-new.webp";
const STORAGE_PATH = "HomePageFinal/homehero-2026.webp";

const storage = new StorageClient(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const data = await readFile(SRC);
const { error } = await storage.from(BUCKET).upload(STORAGE_PATH, data, {
  contentType: "image/webp",
  upsert: true,
});
if (error) throw new Error(`Failed to upload: ${error.message}`);

const { data: pub } = storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
console.log(`✓ uploaded ${STORAGE_PATH} — ${(data.length / 1024).toFixed(0)}KB`);
console.log(`  ${pub.publicUrl}`);
