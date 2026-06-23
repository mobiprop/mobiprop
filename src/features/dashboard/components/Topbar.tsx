"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Calendar } from "lucide-react";

import { NotificationsPanel } from "./NotificationsPanel";
import { CalendarPanel } from "./CalendarPanel";
import { GlobalSearch } from "./GlobalSearch";
import { useUnreadCountQuery } from "@/features/notifications/queries/use-notifications";

type Panel = "notifications" | "calendar" | null;

export function Topbar() {
  const [open, setOpen] = useState<Panel>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadCountQuery();

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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 pl-18 sm:px-5 sm:pl-16 lg:px-6 lg:pl-6">
      {/* Global search */}
      <GlobalSearch />

      {/* Right icons */}
      <div className="ml-3 flex shrink-0 items-center gap-1 sm:ml-4 sm:gap-2 lg:gap-6">
        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => toggle("notifications")}
            aria-label="Open notifications"
            aria-expanded={open === "notifications"}
            className={`relative flex size-9 items-center justify-center overflow-visible rounded-[9px] transition-colors ${
              open === "notifications"
                ? "bg-[#eff6ff] text-[#1e4f86]"
                : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            }`}
          >
            <Bell size={20} className="sm:size-[22px]" />

            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread notifications`}
                className="pointer-events-none absolute right-0 top-0 z-10 flex h-[17px] min-w-[17px] translate-x-[30%] -translate-y-[30%] items-center justify-center rounded-full border-2 border-white bg-[#fb2c36] px-[3px] text-[9px] font-bold leading-none text-white shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open === "notifications" && (
            <div className="fixed inset-x-3 top-[72px] z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[44px]">
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
            className={`flex size-9 items-center justify-center rounded-[9px] transition-colors ${
              open === "calendar"
                ? "bg-[#eff6ff] text-[#1e4f86]"
                : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
            }`}
          >
            <Calendar size={20} className="sm:size-[22px]" />
          </button>

          {open === "calendar" && (
            <div className="fixed inset-x-3 top-[72px] z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[44px]">
              <CalendarPanel onClose={() => setOpen(null)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
