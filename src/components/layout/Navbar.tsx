"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1" aria-label="Ulrich Propiedades home">
      <Image
        src="/logo.svg"
        alt="Ulrich Propiedades"
        width={59}
        height={40}
        priority
        className="h-9 w-auto object-contain"
      />
    </Link>
  );
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Listings", href: "/listings" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-[#f9fafb] border-b border-[#c2c7d3]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-[70px] flex items-center justify-between">
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
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Contact Button */}
        <div className="hidden md:block">
          <button
            className="bg-white border border-[#e5e7eb] rounded-[36px] px-5 py-[10px] text-[14px] font-medium text-[#0d2138] hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Contact us
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="#0d2138" strokeWidth="2" strokeLinecap="round">
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
        <div className="md:hidden bg-white border-t border-[#e5e7eb] px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-[14px] font-medium py-1 ${
                isActive(link.href) ? "text-[#232323]" : "text-[#5e5e5e]"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {link.label}
            </Link>
          ))}
          <button
            className="mt-2 bg-white border border-[#e5e7eb] rounded-[36px] px-5 py-2 text-[14px] font-medium text-[#0d2138] w-fit"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Contact us
          </button>
        </div>
      )}
    </header>
  );
}
