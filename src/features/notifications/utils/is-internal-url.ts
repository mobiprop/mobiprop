/**
 * Validate that a notification action URL is a safe, same-origin internal path.
 * Push payloads and in-app links must never open external/attacker-controlled
 * destinations. Pure + isomorphic so it can guard both server creation and tests.
 *
 * Accepts only absolute internal paths beginning with a single "/" (e.g.
 * "/dashboard/leads/123"). Rejects:
 *   - protocol-relative URLs ("//evil.com")
 *   - absolute URLs ("https://evil.com", "javascript:...", "mailto:...")
 *   - backslash tricks ("/\evil.com", "\\evil.com")
 *   - empty / non-string values and control-character smuggling
 */
export function isInternalUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();

  if (url.length === 0 || url.length > 2048) return false;
  if (!url.startsWith("/")) return false;
  // Protocol-relative or backslash-smuggled host.
  if (url.startsWith("//") || url.startsWith("/\\")) return false;
  if (url.includes("\\")) return false;

  // Reject ASCII control characters / whitespace smuggling (e.g. "/java\nscript:")
  // without embedding raw control bytes in source.
  for (let i = 0; i < url.length; i += 1) {
    const code = url.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return false;
  }

  // Resolve against an arbitrary origin and confirm the origin is unchanged.
  try {
    const base = "https://internal.invalid";
    const resolved = new URL(url, base);
    if (resolved.origin !== base) return false;
  } catch {
    return false;
  }

  return true;
}
