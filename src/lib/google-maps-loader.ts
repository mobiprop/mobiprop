// Shared browser loader. Places powers suggestions; custom map drawing uses native overlays.
let loaderPromise: Promise<void> | null = null;
let attempt = 0;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (!apiKey.trim()) return Promise.reject(new Error("Missing Google Maps API key"));
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<void>((resolve, reject) => {
    const callback = `__mobiMapsReady${++attempt}`;
    const globals = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => fail(), 20000);
    function cleanup() { window.clearTimeout(timer); delete globals[callback]; }
    function fail() {
      cleanup(); script.remove(); loaderPromise = null;
      reject(new Error("Google Maps could not load"));
    }
    globals[callback] = () => { cleanup(); resolve(); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loaderPromise;
}
