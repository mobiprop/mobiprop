/** Resolve a public origin without allowing production emails to point to localhost. */
export function resolveAppUrl(configured: string | undefined, production: boolean): string {
  const fallback = production ? "https://mobi-prop.vercel.app" : "http://localhost:3000";
  if (!configured) return fallback;
  try {
    const url = new URL(configured);
    const local = url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname === "[::1]" || /^127\./.test(url.hostname) || url.hostname === "0.0.0.0";
    if (url.username || url.password || !["http:", "https:"].includes(url.protocol) || (production && (local || url.protocol !== "https:"))) return fallback;
    return url.origin;
  } catch { return fallback; }
}
