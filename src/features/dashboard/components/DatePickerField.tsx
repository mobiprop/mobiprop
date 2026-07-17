"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon } from "lucide-react";

import { CalendarPanel } from "./CalendarPanel";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type DatePickerFieldProps = {
  /** ISO yyyy-mm-dd, matching native <input type="date"> value format. */
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
  placeholder?: string;
  /** Renders a zero-size native date input so the form's HTML5 constraint validation still catches an empty value on submit. */
  required?: boolean;
  className?: string;
};

type PanelPosition = { top: number; left: number };

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Themed date field reusing CalendarPanel (already used by ScheduleTourModal
 * and the Topbar) instead of the browser's native <input type="date"> picker
 * — keeps every date field in the dashboard visually consistent.
 *
 * The panel is portaled to <body> with fixed coords computed from the
 * trigger's rect, same as SearchableSelect/ListingPicker, since this lives
 * inside modals that scroll their own content.
 */
export function DatePickerField({
  value,
  onChange,
  minDate,
  placeholder,
  required = false,
  className = "",
}: DatePickerFieldProps) {
  const { t } = useTranslation("dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom, left: rect.left });
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

  const selectedDate = parseISODate(value);

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.stopPropagation();
            setIsOpen(false);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-white px-3 text-left text-[12px] outline-none transition-colors focus:border-[#1e4f86] ${
          isOpen ? "border-[#1e4f86]" : "border-[#e5e7eb]"
        }`}
        style={mont}
      >
        <span className={`truncate ${selectedDate ? "text-[#0d2138]" : "text-[#6a7282]"}`}>
          {selectedDate ? DATE_FMT.format(selectedDate) : (placeholder ?? t("common.selectDate"))}
        </span>

        <CalendarIcon size={15} className="shrink-0 text-[#6a7282]" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className="z-50"
          >
            <CalendarPanel
              inline
              align="left"
              value={selectedDate}
              minDate={minDate}
              onSelect={(date) => {
                onChange(toISODate(date));
                setIsOpen(false);
              }}
              onClose={() => setIsOpen(false)}
            />
          </div>,
          document.body,
        )}

      {required && (
        <input
          type="date"
          required
          readOnly
          aria-hidden="true"
          tabIndex={-1}
          value={value}
          onChange={() => undefined}
          className="absolute h-0 w-0 overflow-hidden opacity-0"
        />
      )}
    </div>
  );
}
