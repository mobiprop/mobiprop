"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar, Search } from "lucide-react";

import { NotificationsPanel } from "./NotificationsPanel";
import { CalendarPanel } from "./CalendarPanel";

const mont = { fontFamily: "'Montserrat', sans-serif" };

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
    <header
  className="
    sticky top-0 z-20
    flex h-16 shrink-0 items-center justify-between
    border-b border-[#e5e7eb] bg-white
    px-4 pl-16
    sm:px-5 sm:pl-16
    lg:px-6 lg:pl-6
  "
>
  {/* Search */}
  <div
    className="
      flex h-9 min-w-0 flex-1 items-center gap-2
      rounded-[10px] border border-[#e5e7eb]
      bg-[#f8fafc] px-3

      sm:max-w-[320px]
      lg:w-[256px] lg:flex-none
    "
  >
    <Search
      size={16}
      className="shrink-0 text-[#6a7282]"
    />

    <input
      type="search"
      placeholder="Search..."
      aria-label="Search"
      className="
        min-w-0 flex-1 bg-transparent
        text-[12px] text-[#2b3038]
        outline-none
        placeholder:text-[rgba(10,10,10,0.5)]
        sm:text-[13px]
      "
      style={mont}
    />

    <kbd
      className="
        hidden shrink-0 rounded-[5px]
        bg-[#e5e7eb] px-1.5 py-0.5
        text-[10px] text-[#6b7280]
        md:inline-flex
      "
      style={mont}
    >
      ⌘K
    </kbd>
  </div>

  {/* Right icons */}
  <div className="ml-3 flex shrink-0 items-center gap-1 sm:ml-4 sm:gap-2 lg:gap-6">
    {/* Bell */}
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => toggle("notifications")}
        aria-label="Open notifications"
        aria-expanded={open === "notifications"}
        className={`
          relative flex size-9 items-center justify-center
          rounded-[9px] transition-colors

          ${
            open === "notifications"
              ? "bg-[#eff6ff] text-[#1e4f86]"
              : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          }
        `}
      >
        <Bell size={20} className="sm:size-[22px]" />

        <span
          className="
            absolute right-[7px] top-[6px]
            size-2 rounded-full
            border-2 border-white bg-[#fb2c36]
          "
        />
      </button>

      {open === "notifications" && (
        <div
          className="
            fixed inset-x-3 top-[72px] z-50
            sm:absolute sm:inset-x-auto sm:right-0 sm:top-[44px]
          "
        >
          <NotificationsPanel onClose={() => setOpen(null)} />
        </div>
      )}
    </div>

    {/* Calendar */}
    <div ref={calRef} className="relative">
      <button
        type="button"
        onClick={() => toggle("calendar")}
        aria-label="Open calendar"
        aria-expanded={open === "calendar"}
        className={`
          flex size-9 items-center justify-center
          rounded-[9px] transition-colors

          ${
            open === "calendar"
              ? "bg-[#eff6ff] text-[#1e4f86]"
              : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          }
        `}
      >
        <Calendar size={20} className="sm:size-[22px]" />
      </button>

      {open === "calendar" && (
        <div
          className="
            fixed inset-x-3 top-[72px] z-50
            sm:absolute sm:inset-x-auto sm:right-0 sm:top-[44px]
          "
        >
          <CalendarPanel onClose={() => setOpen(null)} />
        </div>
      )}
    </div>
  </div>
</header>
  );
}
