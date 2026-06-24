"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CalendarPanelProps = {
  onClose: () => void;
  /** Controlled selected date. When provided, the panel reflects this value. */
  value?: Date | null;
  /** Called with the full Date when a day is picked. */
  onSelect?: (date: Date) => void;
  /** Days before this date are disabled. */
  minDate?: Date;
  /** Horizontal anchor of the popover relative to its trigger. */
  align?: "left" | "right";
  /** Render in normal flow (expands below the trigger) instead of a floating popover. */
  inline?: boolean;
};

export function CalendarPanel({
  onClose: _,
  value,
  onSelect,
  minDate,
  align = "right",
  inline = false,
}: CalendarPanelProps) {
  const today = new Date();
  const initial = value ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  // Uncontrolled fallback (e.g. the Topbar calendar), kept in sync when controlled.
  const [internalSelected, setInternalSelected] = useState<Date>(value ?? today);
  const selectedDate = value !== undefined ? value : internalSelected;
  const minTime = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime()
    : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build a 6-row × 7-col grid (null = empty cell)
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const positionCls = inline
    ? "relative mt-2"
    : `absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+8px)]`;

  return (
    <div
      className={`${positionCls} w-[280px] bg-white border border-[#dfe1e7] rounded-[12px] shadow-[0px_16px_32px_-1px_rgba(128,136,151,0.2)] z-50 overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#e6e6e6]">
        {/* Prev */}
        <button
          type="button"
          onClick={prevMonth}
          className="size-7 flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#eff6ff] hover:text-[#1e4f86] transition-colors shrink-0"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Month / Year selects */}
        <div className="flex flex-1 items-center gap-1.5">
          {/* Month */}
          <div className="relative flex-1">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="w-full h-8 pl-2.5 pr-6 rounded-full text-[12px] font-medium text-[#0d2138] bg-white appearance-none outline-none cursor-pointer"
              style={mont}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
          {/* Year */}
          <div className="relative w-[76px]">
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="w-full h-8 pl-2.5 pr-6 rounded-full text-[12px] font-medium text-[#0d2138] bg-white appearance-none outline-none cursor-pointer"
              style={mont}
            >
              {Array.from({ length: 10 }, (_, i) => today.getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={nextMonth}
          className="size-7 flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#eff6ff] hover:text-[#1e4f86] transition-colors shrink-0"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-2.5">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="flex items-center justify-center size-9">
              <span className="text-[12px] text-[#232323]" style={mont}>{d}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="size-9" />;
            }

            const cellDate = new Date(viewYear, viewMonth, day);
            const isToday = sameDay(cellDate, today);
            const isSelected = selectedDate != null && sameDay(cellDate, selectedDate);
            const disabled = minTime != null && cellDate.getTime() < minTime;

            const handlePick = () => {
              if (disabled) return;
              if (onSelect) onSelect(cellDate);
              else setInternalSelected(cellDate);
            };

            let cls: string;
            if (isSelected) cls = "bg-[#1e4f86] text-white font-medium";
            else if (disabled) cls = "text-[#cbd5e1] cursor-not-allowed";
            else if (isToday) cls = "text-[#1e4f86] font-medium hover:bg-[#eff6ff]";
            else cls = "text-[#737373] hover:bg-[#eff6ff] hover:text-[#1e4f86]";

            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={handlePick}
                className={`size-9 flex items-center justify-center rounded-full text-[12px] transition-colors ${cls}`}
                style={mont}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
