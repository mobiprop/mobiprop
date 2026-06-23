"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import type { PublicListingDto } from "@/features/listings/types/listing-dto";
import {
  listingDisplayPrice,
  listingTags,
  formatBeds,
  formatBaths,
  formatArea,
} from "@/features/listings/utils/format";

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

type PinOverlay = google.maps.OverlayView & {
  setSelected(v: boolean): void;
  getAnchorRect(): DOMRect | null;
};
type PinOverlayCtor = new (
  pos: google.maps.LatLngLiteral,
  label: string,
  onClick: () => void,
) => PinOverlay;

function buildOverlayClass(): PinOverlayCtor {
  class PricePinOverlay extends google.maps.OverlayView {
    private el: HTMLDivElement | null = null;
    private _selected = false;

    constructor(
      private pos: google.maps.LatLngLiteral,
      private label: string,
      private handleClick: () => void,
    ) {
      super();
    }

    onAdd() {
      this.el = document.createElement("div");
      this.el.style.position = "absolute";
      this.el.style.cursor = "pointer";
      this.el.style.userSelect = "none";
      this.render();
      this.el.addEventListener("click", this.handleClick);
      this.getPanes()?.overlayMouseTarget.appendChild(this.el);
    }

    setSelected(v: boolean) {
      this._selected = v;
      this.render();
    }

    private render() {
      if (!this.el) return;
      const bg = this._selected ? "#285f9c" : "#4896b6";
      this.el.innerHTML = `
        <div style="position:relative;transform:translate(-50%,-100%);padding-bottom:6px">
          <div style="
            background:${bg};color:white;padding:3px 9px;border-radius:6px;
            font-size:12px;font-family:Montserrat,sans-serif;font-weight:500;
            white-space:nowrap;box-shadow:0 2px 8px rgba(13,33,56,0.22);
          ">${this.label}</div>
          <div style="
            position:absolute;bottom:1px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:5px solid ${bg};
          "></div>
        </div>`;
    }

    draw() {
      const proj = this.getProjection();
      const pt = proj?.fromLatLngToDivPixel(new google.maps.LatLng(this.pos));
      if (pt && this.el) {
        this.el.style.left = `${pt.x}px`;
        this.el.style.top = `${pt.y}px`;
      }
    }

    /**
     * Real on-screen position of the rendered bubble, post-transform. Used
     * to anchor the React-rendered popup card, which lives outside Google's
     * own overlay pane (so `fromLatLngToDivPixel` alone isn't enough — that
     * pane carries its own CSS transform that this sidesteps entirely by
     * reading the already-correct rendered position directly).
     */
    getAnchorRect(): DOMRect | null {
      return this.el?.getBoundingClientRect() ?? null;
    }

    onRemove() {
      if (this.el) {
        this.el.removeEventListener("click", this.handleClick);
        this.el.remove();
        this.el = null;
      }
    }
  }

  return PricePinOverlay as unknown as PinOverlayCtor;
}

/* ─── sidebar listing card ─── */

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-1.webp";

function SidebarCard({
  item,
  isSelected,
  onClick,
}: {
  item: PublicListingDto;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[12px] border p-3 transition-colors ${
        isSelected
          ? "border-[#285f9c] bg-[#f0f6ff]"
          : "border-[#d8dee8] bg-white hover:border-[#a0b4cc]"
      }`}
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[8px] bg-[#eef1f5]">
          <img
            src={item.coverImageUrl ?? fallbackImg}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex flex-col gap-[2px]">
          <p
            className="truncate text-[13px] font-medium text-[#0d2138] leading-[18px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {item.title}
          </p>
          <p
            className="truncate text-[12px] text-[#6a7282] leading-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {item.location}
          </p>
          <p
            className="text-[13px] font-semibold text-[#005ea4] leading-[18px] mt-0.5"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {listingDisplayPrice(item)}
          </p>
          <p
            className="text-[11px] text-[#6a7282] leading-[15px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {[formatBeds(item.bedrooms), formatBaths(item.bathrooms), formatArea(item.areaSqft)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ─── on-map property card (shown when a price pin is clicked) ─── */

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12Z"
        stroke="#0d2138"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="#0d2138" strokeWidth="1.6" />
    </svg>
  );
}

function MapCardHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill={filled ? "#ef4444" : "none"}>
      <path
        d="M13.6 2.9a3.8 3.8 0 0 0-5.38 0L8 3.12l-.22-.22a3.8 3.8 0 0 0-5.38 5.38L8 13.87l5.6-5.59a3.8 3.8 0 0 0 0-5.38Z"
        stroke={filled ? "#ef4444" : "#6a7282"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPropertyCard({
  item,
  position,
  onUnauth,
}: {
  item: PublicListingDto;
  position: { x: number; y: number };
  onUnauth: () => void;
}) {
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(item.listingId);

  // Anchored above the pin by default; flips below when the pin sits too
  // close to the top of the map for the card to fit (e.g. a wide fitBounds
  // view), so it never renders off-screen.
  const CARD_HEIGHT_ESTIMATE = 280;
  const placeBelow = position.y < CARD_HEIGHT_ESTIMATE;
  const transform = placeBelow ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))";

  return (
    <div
      className="absolute z-10 w-[220px] max-w-[calc(100%-16px)] sm:w-[260px]"
      style={{ left: position.x, top: position.y, transform }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Link
        href={`/listings/${item.slug}`}
        className="block overflow-hidden rounded-[12px] bg-white shadow-[0_12px_28px_rgba(13,33,56,0.3)]"
      >
        <div className="relative h-[110px] w-full sm:h-[140px]">
          <img
            src={item.coverImageUrl ?? fallbackImg}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute left-2 top-2 flex gap-1">
            {listingTags(item).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/90 px-2 py-[2px] text-[10px] font-medium text-[#0d2138]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {tag}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(item.listingId, onUnauth);
            }}
            aria-label={saved ? "Remove from saved" : "Save property"}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <MapCardHeartIcon filled={saved} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p
              className="min-w-0 truncate text-[13px] font-medium text-[#0d2138]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {item.title}
            </p>
            <p
              className="shrink-0 text-[13px] font-medium text-[#0d2138]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {listingDisplayPrice(item)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <MapPinIcon />
            <p
              className="min-w-0 truncate text-[12px] text-[#0d2138]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {item.location}
            </p>
          </div>

          <p className="text-[12px] text-[#2b3038]" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {[formatArea(item.areaSqft), formatBeds(item.bedrooms), formatBaths(item.bathrooms)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </Link>
    </div>
  );
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

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
            listingDisplayPrice(listing),
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
              Property Map
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
                {drawType === "circle" ? "Drawing…" : "Circle"}
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
                {drawType === "freehand" ? "Drawing…" : "Freehand"}
              </button>

              {hasShape ? (
                <button
                  type="button"
                  onClick={clearShape}
                  className="flex h-8 items-center gap-1.5 rounded-[7px] bg-[#4896b6] px-2.5 text-[12px] leading-none text-white sm:gap-2 sm:px-3 sm:text-[14px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <span className="text-[16px] leading-none">×</span>
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close property map"
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
                    Map unavailable
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
              />
            ) : null}

            <p
              className="mt-2 text-[12px] leading-[18px] text-[#6a7282] sm:mt-3 sm:text-[13px] sm:leading-[20px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {drawType === "circle"
                ? "Click to set the center, then drag to grow the radius — release to filter"
                : drawType === "freehand"
                  ? "Hold and drag to trace any shape — release to filter listings inside it"
                  : hasShape
                  ? `${sidebarListings.length} listing${sidebarListings.length !== 1 ? "s" : ""} found in selected area`
                  : geoListings.length === 0
                    ? "No listings have map coordinates yet"
                    : "Click a pin to see details · Enable Drawing to filter by area"}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="flex min-w-0 flex-col">
            <h3
              className="mb-3 text-[17px] font-medium leading-[22px] text-[#0d2138] sm:mb-4 sm:text-[18px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {sidebarListings.length}{" "}
              {sidebarListings.length === 1 ? "Listing" : "Listings"} Found
            </h3>

            {sidebarListings.length === 0 ? (
              <p
                className="text-[13px] text-[#6a7282]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                No listings in this area
              </p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "420px" }}>
                {sidebarListings.slice(0, 20).map((item) => (
                  <SidebarCard
                    key={item.slug}
                    item={item}
                    isSelected={selectedListing?.slug === item.slug}
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
                    +{sidebarListings.length - 20} more — narrow your search area
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
                View Listing →
              </Link>
            ) : null}
          </aside>
        </div>
      </div>

      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
