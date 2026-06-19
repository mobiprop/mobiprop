/**
 * Classification of Web Push provider HTTP responses, plus the retry backoff
 * schedule. Pure functions so the delivery worker and tests share one source of
 * truth (project guide §20–§21).
 */

/** Permanent subscription errors — the endpoint is gone; deactivate, never retry. */
export function isGoneStatus(status: number | undefined | null): boolean {
  return status === 404 || status === 410;
}

/** Auth/config errors (bad VAPID) — fail, do not endlessly retry. */
export function isAuthStatus(status: number | undefined | null): boolean {
  return status === 401 || status === 403;
}

/** Transient errors worth retrying with backoff. */
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
export function isRetryableStatus(status: number | undefined | null): boolean {
  return status != null && RETRYABLE.has(status);
}

export const MAX_PUSH_ATTEMPTS = 3;

/**
 * Backoff schedule keyed by the attempt that just failed:
 *   after attempt 1 -> +1 minute, after attempt 2 -> +5 minutes, then stop.
 * Returns the next attempt time, or null when retries are exhausted.
 */
export function nextRetryAt(attemptCount: number, from: Date = new Date()): Date | null {
  const delaysMs: Record<number, number> = {
    1: 60_000,
    2: 5 * 60_000,
  };
  const delay = delaysMs[attemptCount];
  if (delay === undefined) return null;
  return new Date(from.getTime() + delay);
}
