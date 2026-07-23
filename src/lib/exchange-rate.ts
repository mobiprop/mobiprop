import "server-only";

// Server-side Dólar Blue rate lookup (dolarapi.com — public, no key needed).
// Best-effort like src/lib/maps.ts: a failed fetch never throws, callers
// decide how to handle a missing rate (fall back to a manual override, or
// exclude the figure from a sum rather than guessing).

export async function getDolarBlueVenta(): Promise<number | null> {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/blue", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { venta?: number };
    return typeof data.venta === "number" && data.venta > 0 ? data.venta : null;
  } catch {
    return null;
  }
}
