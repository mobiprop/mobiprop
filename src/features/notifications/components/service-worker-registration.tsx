"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { ensureServiceWorker } from "@/features/notifications/utils/register-service-worker";

/**
 * Registers the push service worker once, near the app root. Render-null. Does
 * NOT request notification permission — that happens only on explicit user
 * action from the settings screen.
 *
 * Also listens for "push-notification" messages from the SW: when the app is
 * in the foreground, Chrome on macOS sends the OS notification silently to the
 * Notification Center without a visible banner. The SW detects this case and
 * posts a message here so we can show a toast instead.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    let cancelled = false;
    ensureServiceWorker().catch((error) => {
      if (!cancelled && process.env.NODE_ENV === "development") {
        console.warn("[push] service worker registration failed", error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "push-notification") return;
      const { title, body } = event.data as { title?: string; body?: string };
      toast(title ?? "Ulrich Propiedades", {
        description: body,
        duration: 6000,
      });
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
