"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar } from "lucide-react";

import { NotificationsPanel } from "./NotificationsPanel";
import { CalendarPanel } from "./CalendarPanel";
import { GlobalSearch } from "./GlobalSearch";

type Panel = "notifications" | "calendar" | null;

export function Topbar() {
  const [open, setOpen] = useState<Panel>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  function toggle(panel: Panel) {
    setOpen((prev) => (prev === panel ? null : panel));
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideBell = bellRef.current?.contains(target);
      const insideCal = calRef.current?.contains(target);
      if (!insideBell && !insideCal) setOpen(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-16 shrink-0 sticky top-0 z-20 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6">
      {/* Global search */}
      <GlobalSearch />

      {/* Right icons */}
      <div className="flex items-center gap-6">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => toggle("notifications")}
            className={`relative transition-colors ${open === "notifications" ? "text-[#1e4f86]" : "text-[#6a7282] hover:text-[#0d2138]"}`}
          >
            <Bell size={22} />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#fb2c36] border-2 border-white" />
          </button>
          {open === "notifications" && (
            <NotificationsPanel onClose={() => setOpen(null)} />
          )}
        </div>

        {/* Calendar */}
        <div ref={calRef} className="relative">
          <button
            type="button"
            onClick={() => toggle("calendar")}
            className={`transition-colors ${open === "calendar" ? "text-[#1e4f86]" : "text-[#6a7282] hover:text-[#0d2138]"}`}
          >
            <Calendar size={22} />
          </button>
          {open === "calendar" && (
            <CalendarPanel onClose={() => setOpen(null)} />
          )}
        </div>
      </div>
    </header>
  );
}
