"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PropertyCard } from "@/features/listings/components/PropertyCard";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";
import {
  listingDisplayPrice,
  formatBeds,
  formatBaths,
  formatArea,
} from "@/features/listings/utils/format";

import { buildOverlayClass, type PinOverlay } from "./PricePinOverlay";

/* ─── geometry helpers ─── */

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const f1 = (lat1 * Math.PI) / 180;
  const f2 = (lat2 * Math.PI) / 180;
  const df = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Ray-casting point-in-polygon for freehand drawn shapes.
function pointInPolygon(lat: number, lng: number, path: google.maps.LatLng[]): boolean {
  let inside = false;
  const n = path.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = path[i].lat(), yi = path[i].lng();
    const xj = path[j].lat(), yj = path[j].lng();
    if (yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* ─── price-pin overlay ─── */

/* ─── sidebar listing card ─── */

function SidebarCard({item,isSelected,onClick,t}: {item:PublicListingDto;isSelected:boolean;onClick:()=>void;t:TFunction}) {
  return <button type="button" onClick={onClick} aria-pressed={isSelected} className={`w-full rounded-xl border p-4 text-left transition-colors ${isSelected ? "border-[#005089] bg-[#fbfbfb]" : "border-[#e9e9e9] bg-white hover:border-[#005089]"}`}>
    <h3 className="break-words font-[Poppins] text-lg font-medium leading-[26px] text-[#232323]">{item.title}</h3>
    <p className="mt-0.5 break-words text-sm leading-5 text-[#6c6c6c]">{item.location}</p>
    <p className="mt-3 font-[Poppins] text-lg font-medium leading-[26px] text-[#005089]">{listingDisplayPrice(item,t)}</p>
    <p className="mt-1 text-sm leading-5 text-[#6c6c6c]">{[formatBeds(item.bedrooms,t),formatBaths(item.bathrooms,t),formatArea(item.totalAreaM2)].filter(Boolean).join(" · ")}</p>
  </button>;
}

/* ─── on-map property card (shown when a price pin is clicked) ─── */

function MapPropertyCard({ item, position }: { item: PublicListingDto; position: { x:number; y:number }; onUnauth: () => void; t: TFunction }) {
  const below = position.y < 390;
  return <div className="absolute z-10 w-[318px] max-w-[calc(100%-24px)] shadow-xl rounded-2xl" style={{ left:position.x, top:position.y, transform:below ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))" }} onMouseDown={e => e.stopPropagation()}><PropertyCard property={item} compact /></div>;
}

/* ─── close icon ─── */

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M5 5L17 17" stroke="#0d2138" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M17 5L5 17" stroke="#0d2138" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

/* ─── main component ─── */

export function PropertyMapModal({
  listings,
  onClose,
}: {
  listings: PublicListingDto[];
  onClose: () => void;
}) {
  const { t } = useTranslation("listings");
  const dialogRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<{ slug: string; listing: PublicListingDto; overlay: PinOverlay }[]>([]);
  const activeShapeRef = useRef<google.maps.Circle | google.maps.Polygon | null>(null);
  const drawListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const boundsListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Mirrors selectedListing state — used in overlay callbacks to avoid stale closures.
  const selectedSlugRef = useRef<string | null>(null);

  const [selectedListing, setSelectedListing] = useState<PublicListingDto | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [sidebarListings, setSidebarListings] = useState<PublicListingDto[]>(listings);
  const [drawType, setDrawType] = useState<"circle" | "freehand" | null>(null);
  const [hasShape, setHasShape] = useState(false);
  const isDrawMode = drawType !== null;
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const geoListings = listings.filter((l) => l.latitude != null && l.longitude != null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (loginOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []).filter(item => item.getClientRects().length > 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, loginOpen]);

  // Initialize map once on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapContainerRef.current) {
      setMapFailed(true);
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return;

        const OverlayClass = buildOverlayClass();

        // Auto-center: single listing gets a fixed neighborhood zoom; none
        // falls back to Buenos Aires. Multiple listings use fitBounds so the
        // zoom always fits however far apart they are (a degree-spread
        // heuristic caps out at city-level zoom and strands pins off-screen
        // once listings are more than ~1° apart, e.g. different countries).
        const single = geoListings.length === 1;
        const center: google.maps.LatLngLiteral = single
          ? { lat: geoListings[0].latitude as number, lng: geoListings[0].longitude as number }
          : { lat: -34.6037, lng: -58.3816 };

        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: single ? 13 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        if (geoListings.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          for (const listing of geoListings) {
            bounds.extend({ lat: listing.latitude as number, lng: listing.longitude as number });
          }
          map.fitBounds(bounds, 48);
        }

        // Place price-pin overlays for listings that have coordinates
        const overlays: typeof overlaysRef.current = [];
        for (const listing of geoListings) {
          const overlay = new OverlayClass(
            { lat: listing.latitude as number, lng: listing.longitude as number },
            listingDisplayPrice(listing, t),
            () => handlePinClick(listing.slug),
          );
          overlay.setMap(map);
          overlays.push({ slug: listing.slug, listing, overlay });
        }
        overlaysRef.current = overlays;

        // Keep the popup card glued to its pin through every pan/zoom.
        boundsListenerRef.current = google.maps.event.addListener(map, "bounds_changed", () => {
          updateCardPosition();
        });

        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      for (const { overlay } of overlaysRef.current) overlay.setMap(null);
      overlaysRef.current = [];
      if (boundsListenerRef.current) {
        google.maps.event.removeListener(boundsListenerRef.current);
        boundsListenerRef.current = null;
      }
      stopDrawingListeners();
      removeActiveShape();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── pin selection ─── */

  /** Recomputes the on-map card's pixel position from the selected pin's
   *  current projection — call after selecting and on every pan/zoom. */
  function updateCardPosition() {
    const slug = selectedSlugRef.current;
    const entry = slug ? overlaysRef.current.find((o) => o.slug === slug) : undefined;
    const anchorRect = entry?.overlay.getAnchorRect();
    const wrapperRect = mapWrapperRef.current?.getBoundingClientRect();
    if (!anchorRect || !wrapperRect) {
      setCardPosition(null);
      return;
    }
    // Convert the pin's real on-screen position into coordinates local to
    // our own wrapper div, since the pin itself renders inside Google's
    // overlay pane (a different coordinate space — see getAnchorRect).
    setCardPosition({
      x: anchorRect.left + anchorRect.width / 2 - wrapperRect.left,
      y: anchorRect.bottom - wrapperRect.top,
    });
  }

  function handlePinClick(slug: string) {
    for (const { overlay } of overlaysRef.current) overlay.setSelected(false);
    if (selectedSlugRef.current === slug) {
      selectedSlugRef.current = null;
      setSelectedListing(null);
    } else {
      selectedSlugRef.current = slug;
      const entry = overlaysRef.current.find((o) => o.slug === slug);
      entry?.overlay.setSelected(true);
      setSelectedListing(entry?.listing ?? null);
    }
    updateCardPosition();
  }

  /* ─── shape management ─── */

  function removeActiveShape() {
    if (activeShapeRef.current) {
      activeShapeRef.current.setMap(null);
      activeShapeRef.current = null;
    }
  }

  function stopDrawingListeners() {
    for (const l of drawListenersRef.current) google.maps.event.removeListener(l);
    drawListenersRef.current = [];
  }

  /* ─── drawing helpers ─── */

  function stopAndResetDraw() {
    stopDrawingListeners();
    mapRef.current?.setOptions({ draggable: true, gestureHandling: "greedy" });
    setDrawType(null);
  }

  /* ─── circle drawing: click center → drag radius → release to finalise ─── */

  function startCircleDrawing() {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ draggable: false, gestureHandling: "none" });
    setDrawType("circle");

    let drawCenter: google.maps.LatLng | null = null;
    let previewCircle: google.maps.Circle | null = null;

    const l1 = google.maps.event.addListener(map, "mousedown", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      drawCenter = e.latLng;
      previewCircle?.setMap(null);
      previewCircle = new google.maps.Circle({
        map, center: drawCenter, radius: 1,
        fillColor: "#5fb6ff", fillOpacity: 0.18,
        strokeColor: "#2f7fc8", strokeOpacity: 0.55, strokeWeight: 2,
        clickable: false, editable: false,
      });
    });

    const l2 = google.maps.event.addListener(map, "mousemove", (e: google.maps.MapMouseEvent) => {
      if (!drawCenter || !previewCircle || !e.latLng) return;
      const r = distanceMeters(drawCenter.lat(), drawCenter.lng(), e.latLng.lat(), e.latLng.lng());
      if (r > 0) previewCircle.setRadius(r);
    });

    const l3 = google.maps.event.addListener(map, "mouseup", () => {
      if (!drawCenter || !previewCircle || previewCircle.getRadius() < 100) {
        previewCircle?.setMap(null);
        previewCircle = null;
        drawCenter = null;
        return;
      }
      const finalCircle = previewCircle;
      previewCircle = null;
      drawCenter = null;

      removeActiveShape();
      activeShapeRef.current = finalCircle;
      setHasShape(true);
      stopAndResetDraw();

      const cLat = finalCircle.getCenter()?.lat() ?? 0;
      const cLng = finalCircle.getCenter()?.lng() ?? 0;
      const radius = finalCircle.getRadius();
      setSidebarListings(
        overlaysRef.current
          .filter(({ listing: l }) =>
            distanceMeters(l.latitude as number, l.longitude as number, cLat, cLng) <= radius,
          )
          .map(({ listing: l }) => l),
      );
    });

    drawListenersRef.current = [l1, l2, l3];
  }

  /* ─── freehand drawing: hold & drag to trace any shape ─── */

  function startFreehandDrawing() {
    const map = mapRef.current;
    if (!map) return;
    map.setOptions({ draggable: false, gestureHandling: "none" });
    setDrawType("freehand");

    let isDown = false;
    let points: google.maps.LatLng[] = [];
    let previewPolyline: google.maps.Polyline | null = null;
    let lastPointTime = 0;
    const THROTTLE_MS = 25;

    const l1 = google.maps.event.addListener(map, "mousedown", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      isDown = true;
      points = [e.latLng];
      previewPolyline?.setMap(null);
      previewPolyline = new google.maps.Polyline({
        map, path: points,
        strokeColor: "#2f7fc8", strokeOpacity: 0.75, strokeWeight: 2.5,
        clickable: false,
        icons: [{ icon: { path: google.maps.SymbolPath.CIRCLE, scale: 3, fillOpacity: 1, fillColor: "#2f7fc8" }, offset: "0%" }],
      });
    });

    const l2 = google.maps.event.addListener(map, "mousemove", (e: google.maps.MapMouseEvent) => {
      if (!isDown || !e.latLng || !previewPolyline) return;
      const now = Date.now();
      if (now - lastPointTime < THROTTLE_MS) return;
      lastPointTime = now;
      points.push(e.latLng);
      previewPolyline.setPath(points);
    });

    const l3 = google.maps.event.addListener(map, "mouseup", () => {
      if (!isDown) return;
      isDown = false;
      if (points.length < 4) {
        previewPolyline?.setMap(null);
        previewPolyline = null;
        points = [];
        return;
      }
      previewPolyline?.setMap(null);
      previewPolyline = null;

      const finalPolygon = new google.maps.Polygon({
        map, paths: points,
        fillColor: "#5fb6ff", fillOpacity: 0.18,
        strokeColor: "#2f7fc8", strokeOpacity: 0.55, strokeWeight: 2,
        clickable: false, editable: false,
      });

      removeActiveShape();
      activeShapeRef.current = finalPolygon;
      setHasShape(true);
      stopAndResetDraw();

      const path = finalPolygon.getPath().getArray();
      setSidebarListings(
        overlaysRef.current
          .filter(({ listing: l }) =>
            pointInPolygon(l.latitude as number, l.longitude as number, path),
          )
          .map(({ listing: l }) => l),
      );
    });

    drawListenersRef.current = [l1, l2, l3];
  }

  function activateCircle() {
    if (drawType === "circle") { stopAndResetDraw(); return; }
    if (isDrawMode) stopAndResetDraw();
    startCircleDrawing();
  }

  function activateFreehand() {
    if (drawType === "freehand") { stopAndResetDraw(); return; }
    if (isDrawMode) stopAndResetDraw();
    startFreehandDrawing();
  }

  function clearShape() {
    stopAndResetDraw();
    removeActiveShape();
    setHasShape(false);
    setSidebarListings(listings);
    for (const { overlay } of overlaysRef.current) overlay.setSelected(false);
    selectedSlugRef.current = null;
    setSelectedListing(null);
    setCardPosition(null);
  }

  /* ─── render ─── */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2138]/60 px-2 py-3 sm:px-4 sm:py-8 backdrop-blur-[1px]"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-map-title"
      onMouseDown={onClose}
    >
      <div
        className="relative max-h-[calc(100vh-24px)] w-full max-w-[1030px] overflow-y-auto rounded-[10px] bg-white shadow-[0_20px_60px_rgba(13,33,56,0.22)] sm:max-h-[calc(100vh-32px)] sm:rounded-[12px]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[#e5e7eb] px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 pr-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:pr-0">
            <h2
              id="property-map-title"
              className="text-[20px] font-[500] leading-[26px] text-[#0d2138] sm:text-[26px] sm:leading-[32px] lg:text-[28px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("map.title")}
            </h2>

            <div className="flex flex-wrap gap-2">
              {/* Circle mode */}
              <button
                type="button"
                onClick={activateCircle}
                disabled={!mapReady}
                className={`flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px] leading-none text-white transition-colors sm:gap-2 sm:px-3 sm:text-[14px] disabled:opacity-40 ${
                  drawType === "circle" ? "bg-[#1a4878]" : "bg-[#285f9c]"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                </svg>
                {drawType === "circle" ? t("map.drawing") : t("map.circleButton")}
              </button>

              {/* Freehand mode */}
              <button
                type="button"
                onClick={activateFreehand}
                disabled={!mapReady}
                className={`flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px] leading-none text-white transition-colors sm:gap-2 sm:px-3 sm:text-[14px] disabled:opacity-40 ${
                  drawType === "freehand" ? "bg-[#1a4878]" : "bg-[#285f9c]"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {drawType === "freehand" ? t("map.drawing") : t("map.freehandButton")}
              </button>

              {hasShape ? (
                <button
                  type="button"
                  onClick={clearShape}
                  className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#4896b6] px-2.5 text-[12px] leading-none text-white sm:gap-2 sm:px-3 sm:text-[14px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <span className="text-[16px] leading-none">×</span>
                  {t("map.clearButton")}
                </button>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t("map.closeAriaLabel")}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f6f9] sm:right-5 sm:top-5 sm:h-9 sm:w-9 md:static"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[1fr_280px]">
          {/* Map */}
          <div className="relative min-w-0" ref={mapWrapperRef}>
            <div
              className="relative h-[270px] overflow-hidden rounded-[9px] bg-[#edf6ff] sm:h-[420px] sm:rounded-[10px] lg:h-[500px]"
              style={{ cursor: isDrawMode ? "crosshair" : undefined }}
            >
              {mapFailed ? (
                <div className="flex h-full items-center justify-center">
                  <p
                    className="text-[14px] text-[#6a7282]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {t("map.mapUnavailable")}
                  </p>
                </div>
              ) : (
                <div ref={mapContainerRef} className="h-full w-full" />
              )}
            </div>

            {/* On-map card for the clicked pin — rendered outside the map's
                own overflow-hidden so it never gets clipped near the edges.
                Same coordinate origin as the map div above (no offset between them). */}
            {selectedListing && cardPosition ? (
              <MapPropertyCard
                item={selectedListing}
                position={cardPosition}
                onUnauth={() => setLoginOpen(true)}
                t={t}
              />
            ) : null}

            <p
              className="mt-2 text-[12px] leading-[18px] text-[#6a7282] sm:mt-3 sm:text-[13px] sm:leading-[20px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {drawType === "circle"
                ? t("map.circleHint")
                : drawType === "freehand"
                  ? t("map.freehandHint")
                  : hasShape
                  ? t("map.areaResult", { count: sidebarListings.length })
                  : geoListings.length === 0
                    ? t("map.noCoordinates")
                    : t("map.defaultHint")}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="flex min-w-0 flex-col">
            <h3
              className="mb-3 text-[17px] font-medium leading-[22px] text-[#0d2138] sm:mb-4 sm:text-[18px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("map.listingsFound", { count: sidebarListings.length })}
            </h3>

            {sidebarListings.length === 0 ? (
              <p
                className="text-[13px] text-[#6a7282]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t("map.noListingsInArea")}
              </p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "420px" }}>
                {sidebarListings.slice(0, 20).map((item) => (
                  <SidebarCard
                    key={item.slug}
                    item={item}
                    isSelected={selectedListing?.slug === item.slug}
                    t={t}
                    onClick={() => {
                      const entry = overlaysRef.current.find((o) => o.slug === item.slug);
                      if (entry) {
                        handlePinClick(item.slug);
                        mapRef.current?.panTo({
                          lat: item.latitude as number,
                          lng: item.longitude as number,
                        });
                      } else {
                        // Listing without coords: select in sidebar only
                        const toggled =
                          selectedListing?.slug === item.slug ? null : item;
                        selectedSlugRef.current = toggled?.slug ?? null;
                        setSelectedListing(toggled);
                        setCardPosition(null);
                      }
                    }}
                  />
                ))}
                {sidebarListings.length > 20 ? (
                  <p
                    className="pt-1 text-center text-[12px] text-[#6a7282]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {t("map.moreListings", { count: sidebarListings.length - 20 })}
                  </p>
                ) : null}
              </div>
            )}

            {selectedListing ? (
              <Link
                href={`/listings/${selectedListing.slug}`}
                className="mt-4 block rounded-[8px] bg-[#1e4f86] px-4 py-2.5 text-center text-[13px] font-medium text-white hover:bg-[#17446f] transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t("map.viewListing")}
              </Link>
            ) : null}
          </aside>
        </div>
      </div>

      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
