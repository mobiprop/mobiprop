type Position = { lat: number; lng: number };
type Camera = Pick<google.maps.Map, "getZoom" | "getCenter" | "setZoom" | "setCenter" | "panTo" | "addListener">;

/** A cancellable flight: widen the view, travel, then approach the new listing. */
export function transitionMapLocation(
  map: Camera,
  destination: Position,
  zoom: number,
  options: { switchingLocation: boolean; reducedMotion: boolean; onFinish: () => void },
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  const later = (next: () => void, delay = 160) => {
    timer = setTimeout(() => { if (!cancelled) next(); }, delay);
  };
  const finish = () => { if (!cancelled) options.onFinish(); };
  const stepZoom = (target: number, next: () => void) => {
    const current = map.getZoom() ?? target;
    if (Math.abs(current - target) < 0.01) { next(); return; }
    map.setZoom(current + Math.sign(target - current) * Math.min(1, Math.abs(target - current)));
    later(() => stepZoom(target, next));
  };
  const cancel = () => { cancelled = true; clearTimeout(timer); drag.remove(); };
  const drag = map.addListener("dragstart", () => { cancel(); options.onFinish(); });

  if (options.reducedMotion) {
    map.setCenter(destination);
    map.setZoom(zoom);
    finish();
  } else if (!options.switchingLocation) {
    map.panTo(destination);
    map.setZoom(zoom);
    later(finish, 400);
  } else {
    const center = map.getCenter();
    const span = center ? Math.max(Math.abs(center.lat() - destination.lat), Math.abs(center.lng() - destination.lng)) : 0.1;
    // Keep the travel leg short enough to pan smoothly, even between distant zones.
    const overview = Math.max(3, Math.min((map.getZoom() ?? zoom) - 2, zoom - 2, Math.floor(Math.log2(180 / Math.max(span, 0.001)))));
    stepZoom(overview, () => {
      map.panTo(destination);
      later(() => stepZoom(zoom, finish), 450);
    });
  }
  return cancel;
}
