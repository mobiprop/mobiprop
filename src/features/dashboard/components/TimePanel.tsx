"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59
const PERIODS = ["AM", "PM"] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(value: string) {
  if (!value) return { hour12: 12, minute: 0, period: "AM" as const };
  const [h, m] = value.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, period };
}

function toTimeString(hour12: number, minute: number, period: "AM" | "PM") {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${pad(h)}:${pad(minute)}`;
}

function Column<T extends string | number>({
  items,
  selected,
  onPick,
  format,
}: {
  items: T[];
  selected: T;
  onPick: (item: T) => void;
  format: (item: T) => string;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll to the selected item only when the column first mounts (panel opens).
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="flex-1 max-h-[160px] overflow-y-auto py-1 scroll-smooth">
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <button
            key={item}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onPick(item)}
            className={`w-full text-center py-1.5 text-[12px] rounded-[8px] transition-colors ${
              isSelected
                ? "bg-[#1e4f86] text-white font-medium"
                : "text-[#737373] hover:bg-[#eff6ff] hover:text-[#1e4f86]"
            }`}
            style={mont}
          >
            {format(item)}
          </button>
        );
      })}
    </div>
  );
}

type TimePanelProps = {
  /** 24-hour "HH:mm" string. */
  value: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  align?: "left" | "right";
  inline?: boolean;
};

export function TimePanel({ value, onSelect, onClose, align = "left", inline = false }: TimePanelProps) {
  const { t } = useTranslation("dashboard");
  const { hour12, minute, period } = parseTime(value);

  function update(next: Partial<{ hour12: number; minute: number; period: "AM" | "PM" }>) {
    onSelect(toTimeString(next.hour12 ?? hour12, next.minute ?? minute, next.period ?? period));
  }

  const positionCls = inline
    ? "relative mt-2"
    : `absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+8px)]`;

  return (
    <div
      className={`${positionCls} w-[180px] bg-white border border-[#dfe1e7] rounded-[12px] shadow-[0px_16px_32px_-1px_rgba(128,136,151,0.2)] z-50 overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-[#e6e6e6]">
        <span className="text-[12px] font-medium text-[#0d2138]" style={mont}>{t("timePanel.selectTime")}</span>
      </div>
      <div className="flex gap-1 px-2 py-1.5">
        <Column items={HOURS} selected={hour12} onPick={(h) => update({ hour12: h })} format={pad} />
        <Column items={MINUTES} selected={minute} onPick={(m) => update({ minute: m })} format={pad} />
        <Column items={[...PERIODS]} selected={period} onPick={(p) => update({ period: p })} format={(p) => t(`timePanel.period.${p.toLowerCase()}`)} />
      </div>
      <div className="flex justify-end px-3 py-2 border-t border-[#e6e6e6]">
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] font-semibold text-white bg-[#0d2138] px-3 py-1 rounded-[6px] hover:bg-[#1a3a5c] transition-colors"
          style={mont}
        >
          {t("timePanel.done")}
        </button>
      </div>
    </div>
  );
}
