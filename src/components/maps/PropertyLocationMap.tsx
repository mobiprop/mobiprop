"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

/**
 * Single-pin Google Map for a property's location. Fills its parent (which
 * must have a height). Renders a quiet fallback if the API key is missing or
 * the script fails, so the page never breaks on map problems.
 */
export function PropertyLocationMap({
  latitude,
  longitude,
  title,
  zoom = 15,
  address,
}: {
  latitude?: number;
  longitude?: number;
  title?: string;
  address?: string;
  zoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Bailing out of the external Maps script load below, not deriving state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const result = address ? await new google.maps.Geocoder().geocode({address}) : null;
        if (cancelled || !containerRef.current) return;
        const position = result?.results[0]?.geometry.location ?? (latitude != null && longitude != null ? {lat: latitude, lng: longitude} : null);
        if (!position) throw new Error("Location not found");
        const map = new google.maps.Map(containerRef.current, {
          center: position,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        new google.maps.Marker({ position, map, title });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, title, zoom, address]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#edf6ff]">
        <p
          className="text-[14px] text-[#6a7282]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Map unavailable
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
