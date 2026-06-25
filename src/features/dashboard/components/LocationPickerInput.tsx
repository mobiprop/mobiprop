"use client";

import { useEffect, useRef, useState } from "react";

import { useLocationSuggestionsQuery } from "@/hooks/queries/useLocationSuggestionsQuery";

const mont = { fontFamily: "'Montserrat', sans-serif" };

function displayName(location: { name: string; region: string }) {
  return `${location.name}, ${location.region}`;
}

type LocationPickerInputProps = {
  id: string;
  value: string;
  onSelect: (locationId: string, displayName: string) => void;
  placeholder?: string;
  className: string;
};

/**
 * Strict picker for a listing's operational area — must resolve to a real
 * `Location` row (locationId), sourced from useLocationSuggestionsQuery().
 * Typing only filters the dropdown; the form value only changes when a
 * suggestion is clicked. If the area isn't listed yet, it needs to be added
 * from the dashboard's Locations page first (no inline create here).
 */
export function LocationPickerInput({
  id,
  value,
  onSelect,
  placeholder,
  className,
}: LocationPickerInputProps) {
  const { data, isLoading } = useLocationSuggestionsQuery();
  const locations = data?.locations ?? [];
  const selected = locations.find((loc) => loc.id === value) ?? null;

  const [query, setQuery] = useState(selected ? displayName(selected) : "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the displayed text in sync when the resolved selection changes —
  // either the locationId prop changed, or the suggestions list just
  // finished loading and resolved an id that was already set (edit mode).
  // Adjusted during render rather than an effect, per React's "adjusting
  // state when a prop changes" pattern.
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(selected?.id ?? null);
  if ((selected?.id ?? null) !== lastSelectedId) {
    setLastSelectedId(selected?.id ?? null);
    setQuery(selected ? displayName(selected) : "");
  }

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
      // Typing without selecting never changes the actual value — revert
      // the visible text to match it.
      setQuery(selected ? displayName(selected) : "");
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, selected]);

  const needle = query.trim().toLowerCase();
  const suggestions = locations
    .filter((loc) => !needle || displayName(loc).toLowerCase().includes(needle))
    .slice(0, 8);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        id={id}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        placeholder={isLoading ? "Loading locations..." : placeholder}
        autoComplete="off"
        className={className}
        style={mont}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-[#d7dde5] bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => {
                onSelect(suggestion.id, displayName(suggestion));
                setQuery(displayName(suggestion));
                setIsOpen(false);
              }}
              className="block w-full truncate px-3.5 py-2 text-left text-[14px] text-[#0d2138] transition-colors hover:bg-[#f3f4f6]"
              style={mont}
            >
              {suggestion.name}
              <span className="text-[#9ca3af]">, {suggestion.region}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && (
        <div
          className="absolute z-20 mt-1 w-full rounded-[10px] border border-[#d7dde5] bg-white px-3.5 py-2.5 text-[13px] text-[#6a7282] shadow-lg"
          style={mont}
        >
          No matching location. Add it from the Locations page first.
        </div>
      )}
    </div>
  );
}
