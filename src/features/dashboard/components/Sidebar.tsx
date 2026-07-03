"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_NAV } from "@/config/dashboard-nav";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { useUnreadMessageCountQuery } from "@/hooks/queries/useMessagesQuery";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
  USER: "Client",
};

type SidebarProps = {
  role: Role;
  fullName: string;
  email: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: unreadMessageCount = 0 } = useUnreadMessageCountQuery();

  const initials = (fullName || email || "ST").trim().slice(0, 2).toUpperCase();

  // Sign out the browser-side Supabase client first: it's a singleton (shared
  // with NotificationRealtime) that keeps its own session + auto-refresh timer
  // independent of the server cookies `logoutAction` clears. Skipping this step
  // is what let a stale session survive a same-tab account switch.
  async function handleLogout() {
    await createClient().auth.signOut();
    await logoutAction();
  }

  // Route change par sidebar close
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Sidebar open ho to body scroll disable
  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // Escape key par sidebar close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      {/* Mobile and tablet menu button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen}
        aria-controls="dashboard-sidebar"
        className="
          fixed left-4 top-3 z-30
          flex size-10 items-center justify-center
          rounded-[10px]
          border border-[#e5e7eb]
          bg-white text-[#1e4f86]
          shadow-sm
          transition-colors
          hover:bg-[#f8fafc]
          lg:hidden
        "
      >
        <Menu size={22} strokeWidth={1.8} />
      </button>

      {/* Mobile and tablet overlay */}
      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
        tabIndex={sidebarOpen ? 0 : -1}
        className={`
          fixed inset-0 z-40
          bg-black/35 backdrop-blur-[1px]
          transition-opacity duration-300
          lg:hidden
          ${
            sidebarOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-full w-[280px] max-w-[86vw]
          shrink-0 flex-col
          border-r border-[#e5e7eb]
          bg-white shadow-xl
          transition-transform duration-300 ease-in-out

          lg:sticky lg:top-0 lg:z-auto
          lg:h-screen lg:w-[240px] lg:max-w-none
          lg:translate-x-0 lg:shadow-none

          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4 sm:px-5">
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="flex min-w-0 items-center"
          >
            <img
              src="/logo.svg"
              alt="Ulrich Propiedades"
              className="h-8 w-auto max-w-[190px] object-contain sm:h-9 lg:max-w-full"
            />
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              flex size-9 shrink-0 items-center justify-center
              rounded-[9px]
              text-[#6a7282]
              transition-colors
              hover:bg-[#f3f4f6]
              hover:text-[#0d2138]
              lg:hidden
            "
          >
            <X size={21} strokeWidth={1.8} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {DASHBOARD_NAV.map((section) => {
            const items = section.items.filter(
              (item) =>
                !item.permission || hasPermission(role, item.permission),
            );

            if (items.length === 0) {
              return null;
            }

            return (
              <div key={section.title} className="flex flex-col gap-1">
                {section.title && (
                  <p
                    className="mb-1 px-2 text-[12px] text-[#8490a3]"
                    style={mont}
                  >
                    {section.title}
                  </p>
                )}

                {items.map((item) => {
                  const active = isActive(pathname, item.href);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex min-h-[44px] items-center gap-3
                        rounded-[10px] border
                        px-3 text-[14px] font-medium
                        transition-colors

                        ${
                          active
                            ? "border-[#b9c8d9] bg-[#eff6ff] text-[#1e4f86]"
                            : "border-transparent text-[#343a40] hover:bg-[#f9fafb]"
                        }
                      `}
                      style={mont}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.8}
                        className={`shrink-0 ${
                          active ? "text-[#1e4f86]" : "text-[#343a40]"
                        }`}
                      />

                      <span className="min-w-0 flex-1 truncate">{item.label}</span>

                      {item.href === "/dashboard/messages" && unreadMessageCount > 0 && (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] px-1.5 text-[11px] font-semibold text-white"
                          style={mont}
                        >
                          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Profile footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-[#e5e7eb] px-3 py-3">
          <div
            className="
              flex size-10 shrink-0 items-center justify-center
              rounded-full bg-[#1e4f86]
              text-[12px] font-semibold text-white
              lg:size-9
            "
            style={mont}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[14px] font-medium text-[#0d2138]"
              style={mont}
            >
              {fullName || "Staff"}
            </p>

            <p className="truncate text-[12px] text-[#6a7282]" style={mont}>
              {ROLE_LABELS[role]}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="
              flex size-9 shrink-0 items-center justify-center
              rounded-[9px]
              text-[#6a7282]
              transition-colors
              hover:bg-red-50
              hover:text-[#e7000b]
            "
          >
            <LogOut size={19} strokeWidth={1.8} />
          </button>
        </div>
      </aside>
    </>
  );
}
