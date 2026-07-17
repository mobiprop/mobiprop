"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const ROW_HEIGHT_PX = 40;
const PANEL_GAP_PX = 4;
const VISIBLE_ROWS = 4.5;
const SEARCH_DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 8;

export type ListingOption = { id: string; listingId: string; title: string };

type ListingPickerProps = {
  /** Selected listing id, or "" for none. */
  value: string;
  /** Display label for `value` — the caller knows this from wherever the id came from. */
  label: string;
  onSelect: (id: string, label: string) => void;
  /** Listing ids already taken by sibling rows — hidden from the results. */
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** "listing" is the blue-tinted look used in Contacts' linked-listings card; "neutral" matches plain form fields. */
  tone?: "listing" | "neutral";
};

type PanelPosition = { top: number; left: number; width: number };

const TONE_STYLES = {
  listing: "h-9 border-[1.5px] border-[#c2dcff]",
  neutral: "h-10 border border-[#e5e7eb]",
} as const;

export function formatListingLabel(listing: ListingOption) {
  return `${listing.listingId} — ${listing.title}`;
}

/**
 * Listing picker backed by live server search (GET /api/dashboard/listings
 * ?search=&limit=) instead of a client-side list — the dashboard can have
 * far more listings than are worth shipping to the browser up front.
 *
 * Same portal + fixed-position panel approach as SearchableSelect: this
 * lives inside modals that scroll their own content, and an in-flow
 * `absolute` panel would get clipped by that ancestor's overflow.
 */
export function ListingPicker({
  value,
  label,
  onSelect,
  excludeIds = [],
  placeholder,
  disabled = false,
  className = "",
  tone = "listing",
}: ListingPickerProps) {
  const { t } = useTranslation("dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + PANEL_GAP_PX,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Fires immediately when the panel opens (to show a default top-N list),
  // then debounces on every subsequent keystroke while it stays open.
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    const requestId = ++requestIdRef.current;

    const timeoutId = setTimeout(
      () => {
        setLoading(true);

        const params = new URLSearchParams({ limit: String(RESULTS_LIMIT) });
        if (query.trim()) params.set("search", query.trim());

        fetch(`/api/dashboard/listings?${params}`)
          .then((res) => res.json())
          .then((json) => {
            if (requestId !== requestIdRef.current) return;
            const listings: ListingOption[] = (json.listings ?? []).map(
              (l: { id: string; listingId: string; title: string }) => ({
                id: l.id,
                listingId: l.listingId,
                title: l.title,
              }),
            );
            setResults(listings);
          })
          .catch(() => {
            if (requestId === requestIdRef.current) setResults([]);
          })
          .finally(() => {
            if (requestId === requestIdRef.current) setLoading(false);
          });
      },
      justOpened ? 0 : SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timeoutId);
  }, [isOpen, query]);

  const filtered = results.filter(
    (listing) => listing.id === value || !excludeIds.includes(listing.id),
  );

  function selectOption(listing: ListingOption) {
    onSelect(listing.id, formatListingLabel(listing));
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-[8px] bg-white px-3 text-left text-[12px] outline-none transition-colors focus:border-[#1e4f86] disabled:cursor-not-allowed disabled:opacity-60 ${TONE_STYLES[tone]}`}
        style={mont}
      >
        <span className={`truncate ${value ? "text-[#0d2138]" : "text-[#99a1af]"}`}>
          {value ? label : (placeholder ?? t("listingPicker.placeholder"))}
        </span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[#6a7282] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-50 overflow-hidden rounded-[10px] border border-[#d7dde5] bg-white shadow-lg"
          >
            <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-3 py-2">
              <Search size={15} className="shrink-0 text-[#9ca3af]" />

              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    setIsOpen(false);
                  }
                }}
                placeholder={t("listingPicker.searchPlaceholder")}
                autoComplete="off"
                className="h-7 w-full min-w-0 bg-transparent text-[14px] text-[#0d2138] outline-none placeholder:text-[#99a1af]"
                style={mont}
              />
            </div>

            <div
              className="overflow-y-auto py-1"
              style={{ maxHeight: `${ROW_HEIGHT_PX * VISIBLE_ROWS}px` }}
            >
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect("", "");
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center px-3.5 py-2.5 text-left text-[13px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6]"
                  style={mont}
                >
                  {t("listingPicker.clearSelection")}
                </button>
              )}

              {loading ? (
                <p
                  className="px-3.5 py-2.5 text-[13px] text-[#6a7282]"
                  style={mont}
                >
                  {t("listingPicker.loading")}
                </p>
              ) : filtered.length === 0 ? (
                <p
                  className="px-3.5 py-2.5 text-[13px] text-[#6a7282]"
                  style={mont}
                >
                  {t("listingPicker.emptyLabel")}
                </p>
              ) : (
                filtered.map((listing) => {
                  const isSelected = listing.id === value;

                  return (
                    <button
                      key={listing.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(listing)}
                      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-[#f3f4f6] ${
                        isSelected
                          ? "bg-[#eff6ff] font-medium text-[#1e4f86]"
                          : "text-[#0d2138]"
                      }`}
                      style={mont}
                    >
                      <span className="truncate">
                        {formatListingLabel(listing)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
