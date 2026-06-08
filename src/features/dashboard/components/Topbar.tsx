"use client";

import { Bell, Calendar, Search } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export function Topbar() {
  return (
    <header className="h-16 shrink-0 sticky top-0 z-20 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-2 w-[256px] h-10 px-3 border border-[#e5e7eb] rounded-[10px] bg-white">
        <Search size={16} className="text-[#6a7282] shrink-0" />
        <input
          placeholder="Search..."
          className="flex-1 min-w-0 text-[12px] text-[#2b3038] placeholder:text-[#6a7282] bg-transparent outline-none"
          style={mont}
        />
        <kbd className="shrink-0 text-[10px] text-[#6a7282] border border-[#e5e7eb] rounded-[5px] px-1.5 py-0.5" style={mont}>
          ⌘K
        </kbd>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-6">
        <button type="button" className="relative text-[#6a7282] hover:text-[#0d2138] transition-colors">
          <Bell size={22} />
          <span className="absolute top-0 right-0 size-2 rounded-full bg-[#fb2c36] border-2 border-white" />
        </button>
        <button type="button" className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
          <Calendar size={22} />
        </button>
      </div>
    </header>
  );
}
