"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { loadGoogleMaps } from "@/lib/google-maps-loader";

type PlaceAutocompleteInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called once the selected prediction's full Place details have loaded. */
  onPlaceSelected: (place: google.maps.places.Place) => void;
  /** Place fields to fetch on selection, e.g. ["formattedAddress", "addressComponents"]. */
  fields: string[];
  placeholder?: string;
  className: string;
  style?: CSSProperties;
  required?: boolean;
};

/**
 * Free-text address input backed by the new Places API
 * (`google.maps.places.AutocompleteSuggestion`) — the classic
 * `google.maps.places.Autocomplete` widget requires the legacy Places API to
 * be enabled on the Cloud project, which this project doesn't have. The new
 * API is data-only (no built-in UI), so this renders its own dropdown,
 * matching every other custom combobox in this codebase.
 */
export function PlaceAutocompleteInput({
  id,
  value,
  onChange,
  onPlaceSelected,
  fields,
  placeholder,
  className,
  style,
  required,
}: PlaceAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced suggestion fetch as the user types.
  useEffect(() => {
    const query = value.trim();
    if (!query || !ready) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }
      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken: sessionTokenRef.current,
      })
        .then(({ suggestions: results }) => {
          if (cancelled) return;
          setSuggestions(
            results
              .map((s) => s.placePrediction)
              .filter((p): p is google.maps.places.PlacePrediction => p !== null),
          );
        })
        .catch(() => { if (!cancelled) setSuggestions([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value, ready]);

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  async function handleSelect(prediction: google.maps.places.PlacePrediction) {
    setIsOpen(false);
    setSuggestions([]);
    onChange(prediction.text.text);
    try {
      const { place } = await prediction.toPlace().fetchFields({ fields });
      onPlaceSelected(place);
    } catch {
      // Best-effort — the typed text from the prediction is already applied.
    } finally {
      // A session ends once fetchFields is called; start a fresh one next time.
      sessionTokenRef.current = null;
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        id={id}
        required={required}
        value={value}
        onChange={(event) => {
          setSuggestions([]);
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        style={style}
      />

      {isOpen && ready && value.trim() && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d7dde5] bg-white shadow-lg">
          {suggestions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="block w-full truncate px-3.5 py-2 text-left text-[14px] text-[#0d2138] transition-colors hover:bg-[#f3f4f6]"
              style={style}
            >
              {prediction.text.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
