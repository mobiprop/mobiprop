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

type CalendarPanelProps = {
  onClose: () => void;
};

export function CalendarPanel({ onClose: _ }: CalendarPanelProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<number | null>(today.getDate());

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

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div
      className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white border border-[#dfe1e7] rounded-[12px] shadow-[0px_16px_32px_-1px_rgba(128,136,151,0.2)] z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e6e6e6]">
        {/* Prev */}
        <button
          type="button"
          onClick={prevMonth}
          className="size-9 flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#eff6ff] hover:text-[#1e4f86] transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Month / Year selects */}
        <div className="flex flex-1 items-center gap-2">
          {/* Month */}
          <div className="relative flex-1">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="w-full h-10 pl-3 pr-7 rounded-full text-[14px] font-medium text-[#0d2138] bg-white appearance-none outline-none cursor-pointer"
              style={mont}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
          {/* Year */}
          <div className="relative w-[96px]">
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="w-full h-10 pl-3 pr-7 rounded-full text-[14px] font-medium text-[#0d2138] bg-white appearance-none outline-none cursor-pointer"
              style={mont}
            >
              {Array.from({ length: 10 }, (_, i) => today.getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={nextMonth}
          className="size-9 flex items-center justify-center rounded-full bg-[#f8fafc] border border-[#e5e7eb] text-[#6a7282] hover:bg-[#eff6ff] hover:text-[#1e4f86] transition-colors shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="flex items-center justify-center size-10">
              <span className="text-[14px] text-[#232323]" style={mont}>{d}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="size-10" />;
            }

            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = isCurrentMonth && day === selected;
            const highlight = isSelected || isToday;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                className={`size-10 flex items-center justify-center rounded-full text-[14px] transition-colors ${
                  highlight
                    ? "bg-[#1e4f86] text-white font-medium"
                    : "text-[#737373] hover:bg-[#eff6ff] hover:text-[#1e4f86]"
                }`}
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
