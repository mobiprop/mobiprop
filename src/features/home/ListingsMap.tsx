"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";
import { listingDisplayPrice } from "@/features/listings/utils/format";

export function ListingsMap({ listings, selectedId, onSelect }: {
  listings: PublicListingDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("home");
  const { t: listingT } = useTranslation("listings");
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const geo = useMemo(() => listings.filter((item) => item.latitude != null && item.longitude != null && Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180), [listings]);
  const selected = listings.find((item) => item.id === selectedId);
  const selectedGeo = geo.find((item) => item.id === selectedId);
  const externalQuery = selectedGeo ? `${selectedGeo.latitude},${selectedGeo.longitude}` : [selected?.fullAddress || selected?.location, selected?.city, selected?.province, selected?.country].filter(Boolean).join(", ");

  useEffect(() => {
    if (!apiKey || !container.current) return;
    let cancelled = false;
    const initialize = () => {
      observer?.disconnect();
      loadGoogleMaps(apiKey).then(() => {
        if (cancelled || !container.current) return;
        mapRef.current = new google.maps.Map(container.current, {
          center: { lat: -34.5, lng: -58.65 }, zoom: 10,
          mapTypeControl: false, streetViewControl: false,
          fullscreenControl: true, gestureHandling: "cooperative",
        });
        setReady(true);
      }).catch(() => { if (!cancelled) setFailed(true); });
    };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) initialize(); }, { rootMargin: "200px" });
    observer.observe(container.current);
    return () => { cancelled = true; observer?.disconnect(); mapRef.current = null; };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || geo.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    const markers = geo.map((item) => {
      const position = { lat: item.latitude!, lng: item.longitude! };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map, position, title: `${listingDisplayPrice(item, listingT)} · ${item.title}`,
      });
      marker.addListener("click", () => onSelect(item.id));
      return marker;
    });
    if (geo.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(14); }
    else map.fitBounds(bounds, 48);
    return () => markers.forEach((marker) => { google.maps.event.clearInstanceListeners(marker); marker.setMap(null); });
  }, [geo, ready, onSelect, listingT]);

  useEffect(() => {
    if (!ready || !selectedGeo || !mapRef.current) return;
    mapRef.current.panTo({ lat: selectedGeo.latitude!, lng: selectedGeo.longitude! });
  }, [selectedGeo, ready]);

  const unavailable = !apiKey || failed || geo.length === 0;
  return (
    <div className="home-listings-map relative overflow-hidden rounded-[20px] bg-[#f0f6fa]">
      <div ref={container} className="absolute inset-0" role="region" aria-label={t("explorer.mapLabel")} />
      {(!ready || unavailable) && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-[#4f4f4f]" role="status">
        <p className="text-xl font-medium text-[#00223a]">{t(unavailable ? "explorer.mapUnavailable" : "explorer.mapLoading")}</p>
        {unavailable && <p className="max-w-sm text-sm leading-relaxed">{t("explorer.mapFallback")}</p>}
      </div>}
      {selected && <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-[#ccdeef] bg-white p-4 shadow-sm">
        <p className="font-medium text-[#00223a]">{selected.title}</p>
        <p className="mt-1 text-sm text-[#4f4f4f]">{selected.location}</p>
        {externalQuery && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(externalQuery)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-[#005089] underline underline-offset-4">{t("explorer.openMap")}</a>}
      </div>}
    </div>
  );
}
