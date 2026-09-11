"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, ShoppingBag, TrainFront, HeartPulse, Trees, Utensils, MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

const categories = [
  { label: "Educación", types: ["school", "university"], Icon: GraduationCap },
  { label: "Compras", types: ["shopping_mall", "supermarket"], Icon: ShoppingBag },
  { label: "Transporte", types: ["transit_station", "bus_stop"], Icon: TrainFront },
  { label: "Salud", types: ["hospital", "pharmacy"], Icon: HeartPulse },
  { label: "Parques", types: ["park"], Icon: Trees },
  { label: "Gastronomía", types: ["restaurant", "cafe"], Icon: Utensils },
];

export function PropertyLocationMap({ latitude, longitude, title, zoom = 15, address, approximate = false, showNearby = false }: {
  latitude?: number; longitude?: number; title?: string; address?: string; zoom?: number; showNearby?: boolean; approximate?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const locationRef = useRef<google.maps.LatLng | google.maps.LatLngLiteral | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map<number, google.maps.places.Place[]>());

  useEffect(() => {
    let cancelled = false;
    let marker: google.maps.Marker | undefined;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (latitude == null || longitude == null) {
      if (!address) return;
    }
    loadGoogleMaps(key ?? "").then(async () => {
      if (cancelled || !container.current) return;
      const result = address ? await new google.maps.Geocoder().geocode({ address }) : null;
      if (cancelled || !container.current) return;
      const position = result?.results[0]?.geometry.location ?? (latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null);
      if (!position) throw new Error("Location unavailable");
      const map = new google.maps.Map(container.current, { center: position, zoom, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: "cooperative" });
      marker = new google.maps.Marker({ position, map, title, zIndex: 1000 });
      mapRef.current = map;
      locationRef.current = position;
      cache.current.clear();
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; marker?.setMap(null); mapRef.current = null; };
  }, [latitude, longitude, address, title, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const center = locationRef.current;
    if (!ready || !map || !center) return;
    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    const info = new google.maps.InfoWindow();
    if (category == null) {
      map.panTo(center); map.setZoom(zoom);
      return () => info.close();
    }
    const search = async () => {
      setStatus("Buscando lugares cercanos…");
      try {
        let places = cache.current.get(category);
        if (!places) {
          const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
          const result = await Place.searchNearby({ fields: ["displayName", "location", "formattedAddress"], locationRestriction: { center, radius: 3000 }, includedTypes: categories[category].types, maxResultCount: 12, rankPreference: SearchNearbyRankPreference.DISTANCE });
          places = result.places;
          cache.current.set(category, places);
        }
        if (cancelled) return;
        const bounds = new google.maps.LatLngBounds(); bounds.extend(center);
        for (const place of places) {
          if (!place.location) continue;
          const marker = new google.maps.Marker({ map, position: place.location, title: place.displayName ?? "", icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#005089", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3, scale: 10 } });
          marker.addListener("click", () => {
            const content = document.createElement("div"); content.style.cssText = "color:#232323;font:14px/1.5 Montserrat,Arial,sans-serif;max-width:240px";
            const name = document.createElement("strong"); name.textContent = place.displayName ?? "";
            const addressText = document.createElement("p"); addressText.textContent = place.formattedAddress ?? "";
            content.append(name, addressText); info.setContent(content); info.open({ map, anchor: marker });
          });
          markers.push(marker); bounds.extend(place.location);
        }
        if (markers.length) map.fitBounds(bounds, 55);
        setStatus(markers.length ? `${markers.length} lugares a menos de 3 km` : "No encontramos lugares de esta categoría a menos de 3 km.");
      } catch { if (!cancelled) setStatus("No pudimos cargar los lugares cercanos. Volvé a intentar."); }
    };
    void search();
    return () => { cancelled = true; markers.forEach(marker => marker.setMap(null)); info.close(); };
  }, [category, ready, retry, zoom]);

  return <div className={showNearby ? "w-full" : "h-full w-full"}>
    {showNearby && <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Explorar lugares cercanos">
      <button type="button" disabled={!ready} onClick={() => { setCategory(null); setStatus(""); }} aria-pressed={category == null} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors disabled:opacity-50 ${category == null ? "border-[#005089] bg-[#005089] text-white" : "border-[#ccdeef] bg-white text-[#005089]"}`}><MapPin size={16} strokeWidth={1.5} />Propiedad</button>
      {categories.map(({ label, Icon }, index) => <button key={label} type="button" disabled={!ready} aria-pressed={category === index} onClick={() => { setCategory(index); setRetry(n => n + 1); }} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors hover:border-[#005089] disabled:opacity-50 ${category === index ? "border-[#005089] bg-[#005089] text-white" : "border-[#ccdeef] bg-white text-[#005089] hover:bg-[#f0f6fa]"}`}><Icon size={16} strokeWidth={1.5} />{label}</button>)}
    </div>}
    <div className={showNearby ? "relative h-[300px] overflow-hidden rounded-[20px] bg-[#f0f6fa] sm:h-[456px]" : "relative h-full w-full"}>
      <div ref={container} className="h-full w-full" aria-label="Ubicación de la propiedad y lugares cercanos" />
      {(failed || (!address && (latitude == null || longitude == null))) && <div className="absolute inset-0 flex items-center justify-center bg-[#f0f6fa] text-sm text-[#4f4f4f]">{failed ? "Mapa no disponible" : "Ubicación aún no disponible"}</div>}
      {showNearby && status && <p role="status" className="absolute bottom-8 left-3 right-14 w-fit rounded-xl border border-[#ccdeef] bg-white px-4 py-2 text-sm text-[#00223a] shadow-sm">{status}</p>}
      {showNearby && (address || approximate) && !status && <p className="absolute left-3 top-3 rounded-xl bg-white px-4 py-2 text-sm text-[#4f4f4f] shadow-sm">Ubicación aproximada de la zona</p>}
    </div>
  </div>;
}
