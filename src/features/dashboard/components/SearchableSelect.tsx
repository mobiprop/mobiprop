"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const ROW_HEIGHT_PX = 40;
const PANEL_GAP_PX = 4;

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id?: string;
  /** Accessible name for the trigger button — needed when there's no visible
   * <label> pointing at `id` (e.g. compact toolbar filters). */
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** True while `options` is still being fetched — shows a loading row instead of "no results". */
  loading?: boolean;
  loadingLabel?: string;
  /** Shows a filter input above the list. Defaults on; pass false for short, fixed lists. */
  searchable?: boolean;
  /** Roughly how many rows are visible before the list scrolls. */
  visibleRows?: number;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  /** "default" matches the listing modal's inputs; "sm" matches the more compact contact/opportunity modals. */
  size?: "default" | "sm";
};

const SIZE_STYLES = {
  default: {
    trigger: "h-11 px-3.5 text-[14px] bg-[#fafbfc]",
    border: "border-[#d7dde5]",
    search: "text-[14px]",
    option: "text-[14px]",
  },
  sm: {
    trigger: "h-10 px-3 text-[12px] bg-white",
    border: "border-[#e5e7eb]",
    search: "text-[12px]",
    option: "text-[12px]",
  },
} as const;

type PanelPosition = { top: number; left: number; width: number };

/**
 * Themed replacement for a native <select> — the browser renders a native
 * select's open listbox itself, so it can't be restyled to match the app.
 * This renders the closed control and the open panel entirely in our own
 * markup, with an optional search filter for long option lists.
 *
 * The open panel is portaled to <body> and positioned with `fixed` coords
 * computed from the trigger's rect — it commonly sits inside a scrollable
 * modal body, and an in-flow `absolute` panel would get clipped by that
 * ancestor's overflow instead of floating above it.
 */
export function SearchableSelect({
  id,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyLabel = "No results found.",
  loading = false,
  loadingLabel = "Loading...",
  searchable = true,
  visibleRows = 4.5,
  disabled = false,
  hasError = false,
  className = "",
  size = "default",
}: SearchableSelectProps) {
  const sizeStyles = SIZE_STYLES[size];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

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
    // capture: true catches scroll on any scrollable ancestor, not just window
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
      setQuery("");
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus();
  }, [isOpen, searchable]);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        aria-label={ariaLabel}
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
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border text-left outline-none transition-all focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#6a7282] ${sizeStyles.trigger} ${
          hasError ? "border-[#e7000b]" : sizeStyles.border
        }`}
        style={mont}
      >
        <span
          className={`truncate ${selected ? "text-[#0d2138]" : "text-[#99a1af]"}`}
        >
          {selected ? selected.label : placeholder}
        </span>

        <ChevronDown
          size={18}
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
            {searchable && (
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
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className={`h-7 w-full min-w-0 bg-transparent text-[#0d2138] outline-none placeholder:text-[#99a1af] ${sizeStyles.search}`}
                  style={mont}
                />
              </div>
            )}

            <div
              className="overflow-y-auto py-1"
              style={{ maxHeight: `${ROW_HEIGHT_PX * visibleRows}px` }}
            >
              {loading ? (
                <p
                  className="px-3.5 py-2.5 text-[13px] text-[#6a7282]"
                  style={mont}
                >
                  {loadingLabel}
                </p>
              ) : filtered.length === 0 ? (
                <p
                  className="px-3.5 py-2.5 text-[13px] text-[#6a7282]"
                  style={mont}
                >
                  {emptyLabel}
                </p>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(option.value)}
                      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f3f4f6] ${sizeStyles.option} ${
                        isSelected
                          ? "bg-[#eff6ff] font-medium text-[#1e4f86]"
                          : "text-[#0d2138]"
                      }`}
                      style={mont}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check size={15} className="shrink-0 text-[#1e4f86]" />
                      )}
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
