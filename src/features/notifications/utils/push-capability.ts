/**
 * Browser capability + permission detection for the push UI. Client-only; all
 * functions are guarded so they are safe to import in SSR'd modules (they simply
 * report "unsupported" when the relevant globals are missing).
 */

export type PushCapabilityStatus =
  | "unsupported"
  | "permission-default"
  | "permission-denied"
  | "permission-granted-no-subscription"
  | "enabled"
  | "error";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  return Notification.permission;
}

/** Best-effort detection of iOS, where push requires an installed (A2HS) PWA. */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as Mac; disambiguate via touch points.
  const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/** True when running as an installed standalone PWA. */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standaloneMedia || iosStandalone);
}
