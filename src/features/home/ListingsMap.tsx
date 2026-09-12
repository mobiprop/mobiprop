"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";
import { PropertyCard } from "@/features/listings/components/PropertyCard";
import { buildOverlayClass, type PinOverlay } from "@/components/maps/PricePinOverlay";
import { listingDisplayPrice } from "@/features/listings/utils/format";
import { transitionMapLocation } from "./map-location-transition";

export function ListingsMap({ listings, selectedId, onSelect, onClose }: {
  listings: PublicListingDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("home");
  const { t: listingT } = useTranslation("listings");
  const container = useRef<HTMLDivElement>(null);
  const popupCard = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pins = useRef(new Map<string, PinOverlay>());
  const previousLocation = useRef<{ lat: number; lng: number } | null>(null);
  const cameraMoving = useRef(false);
  const [moving, setMoving] = useState(false);
  const [popup, setPopup] = useState<{x:number;y:number}|null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const geo = useMemo(() => listings.filter(item => item.latitude != null && item.longitude != null && Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180), [listings]);
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
    const Overlay = buildOverlayClass();
    const currentPins = pins.current;
    const markers = geo.map((item) => {
      const position = { lat: item.latitude!, lng: item.longitude! };
      bounds.extend(position);
      // Stack labels sharing a CRM location without changing their coordinates.
      const colocated = geo.filter(other => other.latitude === item.latitude && other.longitude === item.longitude);
      const offsetY = (colocated.findIndex(other => other.id === item.id) - (colocated.length - 1) / 2) * 34;
      const marker = new Overlay(position, listingDisplayPrice(item, listingT), () => { if (!cameraMoving.current) onSelect(item.id); }, offsetY);
      marker.setMap(map);
      currentPins.set(item.id,marker);
      return marker;
    });
    if (geo.every(item => item.latitude === geo[0].latitude && item.longitude === geo[0].longitude)) { map.setCenter(bounds.getCenter()); map.setZoom(14); }
    else map.fitBounds(bounds, 48);
    return () => { markers.forEach(marker => marker.setMap(null)); currentPins.clear(); };
  }, [geo, ready, onSelect, listingT]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    pins.current.forEach((pin,id) => pin.setSelected(id === selectedId));
    if (!selectedGeo) return;
    const map = mapRef.current;
    const update = () => {
      const bounds = container.current?.getBoundingClientRect();
      const anchor = pins.current.get(selectedGeo.id)?.getAnchorRect();
      if (!bounds || !anchor || !container.current) return;
      const scale = container.current.offsetWidth / bounds.width;
      const halfWidth = Math.min(159, (container.current.offsetWidth - 32) / 2);
      setPopup({x:Math.max(halfWidth+16,Math.min(container.current.offsetWidth-halfWidth-16,(anchor.left-bounds.left)*scale)),y:Math.max(16,Math.min(container.current.offsetHeight - (popupCard.current?.offsetHeight ?? 500) - 16,(anchor.top-bounds.top)*scale + 16))});
    };
    const destination = { lat: selectedGeo.latitude!, lng: selectedGeo.longitude! };
    const previous = previousLocation.current;
    previousLocation.current = destination;
    const switchingLocation = !!previous && (previous.lat !== destination.lat || previous.lng !== destination.lng);
    cameraMoving.current = true;
    const start = window.setTimeout(() => setMoving(true), 0);
    const cancelTransition = transitionMapLocation(map, destination, selectedGeo.locationApproximate ? 15 : 17, {
      switchingLocation,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onFinish: () => { window.clearTimeout(start); cameraMoving.current = false; setMoving(false); update(); },
    });
    const listener = map.addListener("idle",update);
    const resizeObserver = new ResizeObserver(update);
    if (container.current) resizeObserver.observe(container.current);
    if (popupCard.current) resizeObserver.observe(popupCard.current);
    update();
    return () => { window.clearTimeout(start); cancelTransition(); cameraMoving.current = false; listener.remove(); resizeObserver.disconnect(); };
  }, [selectedGeo, selectedId, ready]);

  const unavailable = !apiKey || failed || geo.length === 0;
  return (
    <div className="home-listings-map relative overflow-hidden rounded-[20px] bg-[#f0f6fa]" style={unavailable && selected ? {minHeight:640} : undefined}>
      <div ref={container} className="absolute inset-0" role="region" aria-label={t("explorer.mapLabel")} />
      {(!ready || unavailable) && <div className="absolute inset-x-4 top-4 rounded-2xl border border-[#ccdeef] bg-white p-5 text-center text-[#4f4f4f] shadow-sm" role="status">
        <p className="text-xl font-medium text-[#00223a]">{t(unavailable ? "explorer.mapUnavailable" : "explorer.mapLoading")}</p>
        {unavailable && <p className="mx-auto max-w-sm text-center text-sm leading-relaxed">{t("explorer.mapFallback")}</p>}
      </div>}
      {selected && <div ref={popupCard} className="home-map-popup absolute z-10 w-[318px] max-w-[calc(100%-32px)] max-h-[calc(100%-32px)] overflow-y-auto overscroll-contain rounded-2xl" style={{...(selectedGeo && popup ? {left:popup.x, top:popup.y,transform:"translateX(-50%)"} : {left:16,bottom:16}), visibility: selectedGeo && moving ? "hidden" : "visible"}}>
        <PropertyCard key={selected.id} property={selected} compact onClose={onClose} />
        {selected.locationApproximate && selectedGeo && <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-[#4f4f4f]">Ubicación aproximada de la zona</p>}
        {!selectedGeo && <p role="status" className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-[#4f4f4f]">Ubicación aún no disponible</p>}
        {externalQuery && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(externalQuery)}`} target="_blank" rel="noopener noreferrer" className="mt-2 block rounded-lg bg-white px-3 py-2 text-center text-sm text-[#005089] underline shadow-sm">{t("explorer.openMap")}</a>}
      </div>}
    </div>
  );
}
