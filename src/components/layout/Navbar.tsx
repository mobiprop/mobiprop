"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { signOut } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client";
import type { NavUser } from "@/lib/nav-user";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const poppins = { fontFamily: "Poppins, sans-serif" };

function Avatar({ user, size }: { user: NavUser; size: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "size-8 text-[12px]" : "size-9 text-[13px]";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <span className={`${sizeClass} rounded-full bg-[#1f5b97] text-white flex items-center justify-center font-semibold shrink-0`} style={poppins}>
      {initialsOf(user.name)}
    </span>
  );
}

function ProfileMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    // Sign out the browser-side Supabase client first: it's a singleton
    // (shared with useSavedListings) that keeps its own session + auto-refresh
    // timer independent of the server cookies `signOut` clears. Skipping this
    // step is what lets a stale session survive a same-tab account switch.
    await createClient().auth.signOut();
    await signOut();
    setOpen(false);
    // Hard navigation instead of router.push+refresh: refresh() targets
    // whatever route is "current" at dispatch time, which can still be the
    // pre-navigation page since push() hasn't committed yet — so the "/"
    // landing can render from the stale (still-authenticated) Router Cache
    // entry until a manual reload. A full navigation sidesteps that cache.
    window.location.href = "/";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-[36px] pl-1.5 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
      >
        <Avatar user={user} size="sm" />
        <span className="max-w-[120px] truncate text-[14px] font-medium text-[#0d2138]" style={poppins}>
          {user.name}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[220px] bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0px_16px_40px_-8px_rgba(88,92,95,0.16)] py-2 z-50">
          <div className="px-4 py-2 border-b border-[#f3f4f6]">
            <p className="text-[14px] font-medium text-[#0d2138] truncate" style={poppins}>{user.name}</p>
            <p className="text-[12px] text-[#6a7282] truncate" style={poppins}>{user.email}</p>
            {user.phone && (
              <p className="text-[12px] text-[#6a7282] truncate" style={poppins}>{user.phone}</p>
            )}
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] text-[#2b3038] hover:bg-[#f9fafb] transition-colors" style={poppins}>
            My Profile
          </Link>
          {user.canAccessDashboard && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] text-[#2b3038] hover:bg-[#f9fafb] transition-colors" style={poppins}>
              Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-[14px] text-[#e7000b] hover:bg-[#fef2f2] transition-colors"
            style={poppins}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1" aria-label="Ulrich Propiedades home">
      <Image
        src="/logo.svg"
        alt="Ulrich Propiedades"
        width={59}
        height={40}
        priority
        className="h-9 object-contain"
        style={{ width: "auto" }}
      />
    </Link>
  );
}

const navLinks = [
  { key: "home", href: "/" },
  { key: "listings", href: "/listings" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

export function Navbar({ initialUser = null }: { initialUser?: NavUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation("navigation");
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const user = initialUser;

  return (
    <header className="sticky top-0 z-50 bg-[#f9fafb] border-b border-[#c2c7d3]">
  <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto h-[70px] flex items-center justify-between">
    {/* Logo */}
    <div className="flex-shrink-0">
      <Logo />
    </div>

    {/* Desktop Menu */}
    <nav className="hidden md:flex items-center gap-8 bg-white border border-[#e5e7eb] rounded-[41px] px-7 py-3 shadow-[0px_-2px_12.5px_rgba(0,0,0,0.03)]">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-[14px] font-medium leading-5 transition-colors ${
            isActive(link.href)
              ? "text-[#232323]"
              : "text-[#5e5e5e] hover:text-[#232323]"
          }`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>

    {/* Desktop Buttons */}
    <div className="hidden md:flex items-center gap-3">
      <LanguageSwitcher />
      {user ? (
        <ProfileMenu user={user} />
      ) : (
        <>
          <Link
            href="/login"
            className="bg-white border border-[#e5e7eb] rounded-[36px] px-5 py-[10px] text-[14px] font-medium text-[#0d2138] hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("login")}
          </Link>

          <Link
            href="/register"
            className="bg-[#1f5b97] border border-[#1f5b97] rounded-[36px] px-5 py-[10px] text-[14px] font-medium text-white hover:bg-[#174a7d] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("signup")}
          </Link>
        </>
      )}
    </div>

    {/* Mobile Hamburger */}
    <button
      className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Toggle menu"
    >
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="#0d2138"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {menuOpen ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="14" x2="20" y2="14" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </>
        )}
      </svg>
    </button>
  </div>

  {/* Mobile Menu Dropdown */}
  {menuOpen && (
    <div className="md:hidden bg-white border-t border-[#e5e7eb] px-4 sm:px-6 py-5 shadow-lg">
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className={`rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
              isActive(link.href)
                ? "bg-[#f1f5f9] text-[#232323]"
                : "text-[#5e5e5e] hover:bg-[#f9fafb] hover:text-[#232323]"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>

      <div className="mt-4 px-4">
        <LanguageSwitcher />
      </div>

      {user ? (
        <div className="mt-5 flex flex-col gap-2 border-t border-[#e5e7eb] pt-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#0d2138] truncate" style={poppins}>{user.name}</p>
              <p className="text-[12px] text-[#6a7282] truncate" style={poppins}>{user.email}</p>
              {user.phone && (
                <p className="text-[12px] text-[#6a7282] truncate" style={poppins}>{user.phone}</p>
              )}
            </div>
          </div>
          <Link href="/profile" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[15px] font-medium text-[#5e5e5e] hover:bg-[#f9fafb] hover:text-[#232323] transition-colors" style={poppins}>
            My Profile
          </Link>
          {user.canAccessDashboard && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[15px] font-medium text-[#5e5e5e] hover:bg-[#f9fafb] hover:text-[#232323] transition-colors" style={poppins}>
              Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await createClient().auth.signOut();
              await signOut();
              setMenuOpen(false);
              // See ProfileMenu.handleLogout: hard navigation avoids landing
              // on a stale, still-authenticated Router Cache entry for "/".
              window.location.href = "/";
            }}
            className="text-left rounded-xl px-4 py-3 text-[15px] font-medium text-[#e7000b] hover:bg-[#fef2f2] transition-colors"
            style={poppins}
          >
            Log Out
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="text-center bg-white border border-[#e5e7eb] rounded-[36px] px-5 py-[11px] text-[14px] font-medium text-[#0d2138] hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("login")}
          </Link>

          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="text-center bg-[#1f5b97] border border-[#1f5b97] rounded-[36px] px-5 py-[11px] text-[14px] font-medium text-white hover:bg-[#174a7d] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("signup")}
          </Link>
        </div>
      )}
    </div>
  )}
</header>
  );
}
