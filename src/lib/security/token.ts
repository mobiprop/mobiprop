import { createHash, randomBytes } from "node:crypto";

/** Generates a cryptographically random raw invite token (sent to the user, never stored). */
export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hashes a raw invite token for storage/lookup — only the hash is persisted. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
