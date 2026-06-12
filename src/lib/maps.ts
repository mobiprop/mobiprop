import "server-only";

// Server-side Google Geocoding helper (uses GOOGLE_MAPS_API_KEY). Geocoding is
// always best-effort: listings save fine without coordinates, and the public
// map section simply stays hidden until they exist.

export type GeocodeResult = { latitude: number; longitude: number };

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const query = address.trim();
  if (!apiKey || !query) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      status: string;
      results?: { geometry?: { location?: { lat: number; lng: number } } }[];
    };
    const location = data.results?.[0]?.geometry?.location;
    if (data.status !== "OK" || !location) return null;

    return { latitude: location.lat, longitude: location.lng };
  } catch {
    return null;
  }
}
