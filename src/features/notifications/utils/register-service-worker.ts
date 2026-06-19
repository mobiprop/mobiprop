/**
 * Register /sw.js once and resolve to the active registration. Idempotent:
 * repeated calls reuse the existing registration. Client-only.
 */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) {
    // Make sure it's active before callers try pushManager.subscribe().
    await navigator.serviceWorker.ready;
    return existing;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return registration;
}
