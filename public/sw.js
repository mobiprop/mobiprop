// Ulrich Propiedades service worker — receives Web Push events and displays
// system notifications. Kept dependency-free and defensive: a malformed payload
// must never throw out of the event handler.

const FALLBACK = {
  title: "Ulrich Propiedades",
  body: "You have a new update.",
  icon: "/icons/icon-192.png",
  badge: "/icons/notification-badge.png",
  url: "/dashboard/notifications",
};

// Activate immediately on update so the newest handler is in control.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = FALLBACK;

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...FALLBACK, ...parsed };
    }
  } catch {
    data = FALLBACK;
  }

  const payload = data;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // When the app is in the foreground, also postMessage the page so it
        // can show an in-app toast for immediate feedback.
        const visibleClients = clients.filter((c) => c.visibilityState === "visible");
        for (const client of visibleClients) {
          client.postMessage({ type: "push-notification", ...payload });
        }

        // Always show the OS notification so it lands in the macOS Notification
        // Center. requireInteraction keeps it visible until dismissed (Alert
        // behaviour), preventing it from disappearing as a transient Banner.
        return self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          tag: payload.tag,
          requireInteraction: true,
          data: { url: payload.url, notificationId: payload.notificationId },
        });
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = event.notification.data?.url || FALLBACK.url;

  let targetUrl;
  try {
    targetUrl = new URL(requestedUrl, self.location.origin);
  } catch {
    targetUrl = new URL(FALLBACK.url, self.location.origin);
  }

  // Same-origin only — never navigate to an external/attacker-controlled URL.
  if (targetUrl.origin !== self.location.origin) {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            if ("navigate" in client) {
              try {
                await client.navigate(targetUrl.href);
              } catch {
                // Some browsers reject navigate() for cross-document moves; fall
                // back to focusing the existing window as-is.
              }
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl.href);
      }),
  );
});
