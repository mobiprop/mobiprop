import { afterEach, describe, expect, it, vi } from "vitest";
import { transitionMapLocation } from "./map-location-transition";

function camera() {
  let zoom = 15;
  let position = { lat: -34.45, lng: -58.84 };
  let drag = () => {};
  const events: string[] = [];
  return {
    events,
    drag: () => drag(),
    map: {
      getZoom: () => zoom,
      getCenter: () => ({ lat: () => position.lat, lng: () => position.lng }) as google.maps.LatLng,
      setZoom: (value: number) => { zoom = value; events.push(`zoom:${value}`); },
      setCenter: (value: google.maps.LatLngLiteral | google.maps.LatLng) => { position = value as typeof position; events.push("center"); },
      panTo: (value: google.maps.LatLngLiteral | google.maps.LatLng) => { position = value as typeof position; events.push("pan"); },
      addListener: (_: string, fn: () => void) => { drag = fn; return { remove: () => { drag = () => {}; } }; },
    },
  };
}

afterEach(() => vi.useRealTimers());
describe("listing camera transition", () => {
  it("zooms out before traveling and reaches the destination zoom", () => {
    vi.useFakeTimers();
    const { map, events } = camera();
    const finish = vi.fn();
    const destination = { lat: -34.39, lng: -58.7 };
    const cancel = transitionMapLocation(map, destination, 17, { switchingLocation: true, reducedMotion: false, onFinish: finish });
    expect(events[0]).toBe("zoom:14");
    expect(events).not.toContain("pan");
    vi.runAllTimers();
    const travel = events.indexOf("pan");
    expect(travel).toBeGreaterThan(0);
    expect(events.slice(0, travel)).not.toContain("zoom:17");
    expect(events.at(-1)).toBe("zoom:17");
    expect(map.getCenter().lat()).toBe(destination.lat);
    expect(finish).toHaveBeenCalledTimes(1);
    cancel();
  });
  it("cancels stale flights when the selection changes", () => {
    vi.useFakeTimers();
    const { map, events } = camera();
    const finish = vi.fn();
    const cancel = transitionMapLocation(map, { lat: -34.4, lng: -58.7 }, 15, { switchingLocation: true, reducedMotion: false, onFinish: finish });
    cancel();
    const count = events.length;
    vi.runAllTimers();
    expect(events).toHaveLength(count);
    expect(finish).not.toHaveBeenCalled();
  });
  it("lets manual map dragging stop the flight", () => {
    vi.useFakeTimers();
    const { map, events, drag } = camera();
    const finish = vi.fn();
    transitionMapLocation(map, { lat: -34.4, lng: -58.7 }, 15, { switchingLocation: true, reducedMotion: false, onFinish: finish });
    drag();
    const count = events.length;
    vi.runAllTimers();
    expect(events).toHaveLength(count);
    expect(finish).toHaveBeenCalledTimes(1);
  });
  it("respects reduced motion without scheduling a flight", () => {
    vi.useFakeTimers();
    const { map, events } = camera();
    const cancel = transitionMapLocation(map, { lat: -34.4, lng: -58.7 }, 15, { switchingLocation: true, reducedMotion: true, onFinish: vi.fn() });
    expect(events).toEqual(["center", "zoom:15"]);
    expect(vi.getTimerCount()).toBe(0);
    cancel();
  });
  it("does not zoom out for a first selection or a shared location", () => {
    vi.useFakeTimers();
    const { map, events } = camera();
    const cancel = transitionMapLocation(map, { lat: -34.45, lng: -58.84 }, 15, { switchingLocation: false, reducedMotion: false, onFinish: vi.fn() });
    vi.runAllTimers();
    expect(events).toEqual(["pan", "zoom:15"]);
    cancel();
  });
});
