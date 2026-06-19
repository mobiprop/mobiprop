/**
 * Convert a URL-safe base64 VAPID public key into the `Uint8Array` that
 * `PushManager.subscribe({ applicationServerKey })` requires. Runs in the
 * browser; kept pure so it can be unit-tested without a DOM.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  // Back the array with a concrete ArrayBuffer so the result satisfies the DOM
  // `BufferSource` expected by `PushManager.subscribe({ applicationServerKey })`.
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
