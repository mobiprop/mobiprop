import "server-only";

/**
 * Minimal in-memory per-key cooldown limiter. Sufficient for low-frequency,
 * self-targeted actions like the test-push endpoint. Note: state is per server
 * instance, so under horizontal scaling this is best-effort, not a hard cap —
 * acceptable here because the action is harmless and self-only.
 */
const lastHit = new Map<string, number>();

export function checkCooldown(
  key: string,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const previous = lastHit.get(key);

  if (previous !== undefined && now - previous < windowMs) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - previous)) / 1000);
    return { ok: false, retryAfterSeconds };
  }

  lastHit.set(key, now);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (lastHit.size > 5000) {
    for (const [k, t] of lastHit) {
      if (now - t > windowMs) lastHit.delete(k);
    }
  }
  return { ok: true };
}
