"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { DASHBOARD_NAV } from "@/config/dashboard-nav";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
  CLIENT: "Client",
};

type SidebarProps = {
  role: Role;
  fullName: string;
  email: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const initials = (fullName || email).slice(0, 2).toUpperCase();

  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#e5e7eb] flex flex-col">
      {/* Logo header */}
      <div className="h-16 shrink-0 border-b border-[#e5e7eb] flex items-center gap-2 px-5">
        <div className="size-[30px] rounded-[8px] bg-[#1e4f86] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 7l6-4.5L14 7v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="leading-none">
          <p className="text-[13px] font-semibold text-[#0d2138] tracking-wide" style={mont}>ULRICH</p>
          <p className="text-[9px] text-[#6a7282] tracking-[0.18em]" style={mont}>PROPIEDADES</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {DASHBOARD_NAV.map((section) => {
          const items = section.items.filter(
            (item) => !item.permission || hasPermission(role, item.permission),
          );
          if (items.length === 0) return null;

          return (
            <div key={section.title} className="flex flex-col gap-1">
              <p className="px-2 mb-1 text-[12px] text-[#99a1af]" style={mont}>{section.title}</p>
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 h-[35px] px-2 rounded-[10px] text-[14px] transition-colors ${
                      active
                        ? "bg-[#eff6ff] border border-[#b9c8d9] text-[#1e4f86] font-medium"
                        : "text-[#2b3038] hover:bg-[#f9fafb] font-medium border border-transparent"
                    }`}
                    style={mont}
                  >
                    <Icon size={18} strokeWidth={1.75} className={active ? "text-[#1e4f86]" : "text-[#6a7282]"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div className="shrink-0 border-t border-[#e5e7eb] px-3 py-3 flex items-center gap-3">
        <div className="size-9 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[12px] font-semibold shrink-0" style={mont}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-[#0d2138] truncate" style={mont}>{fullName || "Staff"}</p>
          <p className="text-[12px] text-[#6a7282] truncate" style={mont}>{ROLE_LABELS[role]}</p>
        </div>
        <button type="button" className="shrink-0 text-[#6a7282] hover:text-[#0d2138]">
          <MoreVertical size={20} />
        </button>
      </div>
    </aside>
  );
}
