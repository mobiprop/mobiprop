"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Building2, Users, Briefcase, Loader2,
} from "lucide-react";

import { queryKeys } from "@/lib/query-keys";
import type {
  GlobalSearchResults,
  SearchListingResult,
  SearchContactResult,
  SearchOpportunityResult,
} from "@/app/api/dashboard/search/route";

const mont = { fontFamily: "'Montserrat', sans-serif" };

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  ACTIVE:      { bg: "#dcfce7", text: "#008236" },
  PAUSED:      { bg: "#fef3c7", text: "#b45309" },
  DRAFT:       { bg: "#f3f4f6", text: "#6b7280" },
  INACTIVE:    { bg: "#f3f4f6", text: "#6b7280" },
  SOLD:        { bg: "#e0e7ff", text: "#4338ca" },
  RENTED:      { bg: "#e0e7ff", text: "#4338ca" },
  OPEN:        { bg: "#dbeafe", text: "#1e4f86" },
  CLOSED_WON:  { bg: "#dcfce7", text: "#16a34a" },
  CLOSED_LOST: { bg: "#fee2e2", text: "#dc2626" },
  PENDING:     { bg: "#fef3c7", text: "#e17100" },
  COMPLETED:   { bg: "#dff2fe", text: "#0069a8" },
  CANCELLED:   { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active", PAUSED: "Paused", DRAFT: "Draft", INACTIVE: "Inactive",
  SOLD: "Sold", RENTED: "Rented",
  OPEN: "Open", CLOSED_WON: "Won", CLOSED_LOST: "Lost",
  PENDING: "Pending", COMPLETED: "Completed", CANCELLED: "Cancelled",
  QUALIFICATION: "Qualification", VISITATION: "Visitation",
  OFFER: "Offer", NEGOTIATION: "Negotiation", CLOSING: "Closing",
};

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("dashboard");
  const c = STATUS_COLOURS[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: c.bg, color: c.text, ...mont }}>
      {t(`status.${status}`, { defaultValue: STATUS_LABEL[status] ?? status })}
    </span>
  );
}

function fmtMoney(n: number | null) {
  if (n === null) return null;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchSearch(q: string): Promise<GlobalSearchResults> {
  const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data as GlobalSearchResults;
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
      <span className="text-[#6a7282]">{icon}</span>
      <span className="text-[10px] font-semibold text-[#6a7282] uppercase tracking-widest" style={mont}>{label}</span>
    </div>
  );
}

// ── Row components ────────────────────────────────────────────────────────────

function ListingRow({ l, focused, onClick }: { l: SearchListingResult; focused: boolean; onClick: () => void }) {
  const { t } = useTranslation("dashboard");
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${focused ? "bg-[#f0f5ff]" : "hover:bg-[#f8fafc]"}`}>
      <div className="size-9 rounded-[8px] bg-[#e5e7eb] shrink-0 overflow-hidden">
        {l.coverImageUrl
          ? <img src={l.coverImageUrl} alt={l.title} className="size-full object-cover" />
          : <div className="size-full flex items-center justify-center"><Building2 size={14} className="text-[#9ca3af]" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#0d2138] truncate" style={mont}>{l.title}</p>
        <p className="text-[11px] text-[#6a7282] truncate" style={mont}>
          {l.listingId} · {l.location}
          {l.matchedVia === "contact" && l.matchedContactName && (
            <span className="text-[#1e4f86]"> · {t("globalSearch.via")} {l.matchedContactName}</span>
          )}
        </p>
      </div>
      <StatusChip status={l.status} />
    </button>
  );
}

function ContactRow({ c, focused, onClick }: { c: SearchContactResult; focused: boolean; onClick: () => void }) {
  const { t } = useTranslation("dashboard");
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${focused ? "bg-[#f0f5ff]" : "hover:bg-[#f8fafc]"}`}>
      <div className="size-9 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={mont}>
        {c.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#0d2138] truncate" style={mont}>{c.fullName}</p>
        <p className="text-[11px] text-[#6a7282] truncate" style={mont}>
          {c.contactId} · {c.email ?? c.phone ?? "—"} · {t("globalSearch.assignedListings", { count: c.assignedListings })}
        </p>
      </div>
      <StatusChip status={c.roles[0]} />
    </button>
  );
}

function OpportunityRow({ o, focused, onClick }: { o: SearchOpportunityResult; focused: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${focused ? "bg-[#f0f5ff]" : "hover:bg-[#f8fafc]"}`}>
      <div className="size-9 rounded-[8px] bg-[#e0e7ff] shrink-0 flex items-center justify-center">
        <Briefcase size={14} className="text-[#6366f1]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#0d2138] truncate" style={mont}>{o.title}</p>
        <p className="text-[11px] text-[#6a7282] truncate" style={mont}>
          {o.opportunityId}
          {o.contactName && ` · ${o.contactName}`}
          {o.dealSize !== null && ` · ${fmtMoney(o.dealSize)}`}
        </p>
      </div>
      <StatusChip status={o.status} />
    </button>
  );
}

// ── Flat result list for keyboard nav ─────────────────────────────────────────

type NavItem =
  | { kind: "listing"; item: SearchListingResult }
  | { kind: "contact"; item: SearchContactResult }
  | { kind: "opportunity"; item: SearchOpportunityResult };

// ── Main component ────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.dashboardSearch(debouncedQ),
    queryFn: () => fetchSearch(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  const listings = data?.listings ?? [];
  const contacts = data?.contacts ?? [];
  const opportunities = data?.opportunities ?? [];

  const navItems: NavItem[] = [
    ...listings.map((item) => ({ kind: "listing" as const, item })),
    ...contacts.map((item) => ({ kind: "contact" as const, item })),
    ...opportunities.map((item) => ({ kind: "opportunity" as const, item })),
  ];

  const hasResults = navItems.length > 0;

  const navigate = useCallback((nav: NavItem) => {
    setOpen(false);
    setQuery("");
    switch (nav.kind) {
      case "listing":    return router.push(`/dashboard/listings?highlight=${nav.item.slug}`);
      case "contact":    return router.push(`/dashboard/contacts`);
      case "opportunity": return router.push(`/dashboard/opportunities`);
    }
  }, [router]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open || !hasResults) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      const hit = navItems[focusedIdx];
      if (hit) navigate(hit);
    }
  }

  // Resetting keyboard focus when the debounced query (an external input) changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFocusedIdx(-1), [debouncedQ]);

  // Running index across all sections for keyboard focus
  let cursor = 0;

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className="relative w-[200px] sm:w-[256px]">
      <div className={`flex items-center gap-2 h-9 px-3 border rounded-[10px] bg-[#f8fafc] transition-colors ${open ? "border-[#1e4f86]" : "border-[#e5e7eb]"}`}>
        {isFetching && query.length >= 2
          ? <Loader2 size={15} className="text-[#6a7282] shrink-0 animate-spin" />
          : <Search size={16} className="text-[#6a7282] shrink-0" />}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("globalSearch.placeholder")}
          className="flex-1 min-w-0 text-[13px] text-[#2b3038] placeholder:text-[rgba(10,10,10,0.5)] bg-transparent outline-none"
          style={mont}
        />
        {!open && (
          <kbd className="shrink-0 text-[10px] text-[#6b7280] bg-[#e5e7eb] rounded-[5px] px-1.5 py-0.5" style={mont}>⌘K</kbd>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-[440px] bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
          {isFetching && !hasResults ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[#6a7282]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]" style={mont}>{t("globalSearch.searching")}</span>
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                {t("globalSearch.noResultsFor")} <strong className="text-[#0d2138]">&ldquo;{query}&rdquo;</strong>
              </p>
            </div>
          ) : (
            <div className="py-2 max-h-[480px] overflow-y-auto">
              {/* Listings */}
              {listings.length > 0 && (
                <div>
                  <SectionHeader icon={<Building2 size={12} />} label={t("globalSearch.sections.listings")} />
                  {listings.map((l) => {
                    const idx = cursor++;
                    return <ListingRow key={l.id} l={l} focused={focusedIdx === idx} onClick={() => navigate({ kind: "listing", item: l })} />;
                  })}
                </div>
              )}

              {/* Contacts */}
              {contacts.length > 0 && (
                <div className={listings.length > 0 ? "border-t border-[#f3f4f6] mt-1 pt-0" : ""}>
                  <SectionHeader icon={<Users size={12} />} label={t("globalSearch.sections.contacts")} />
                  {contacts.map((c) => {
                    const idx = cursor++;
                    return <ContactRow key={c.id} c={c} focused={focusedIdx === idx} onClick={() => navigate({ kind: "contact", item: c })} />;
                  })}
                </div>
              )}

              {/* Opportunities */}
              {opportunities.length > 0 && (
                <div className={(listings.length + contacts.length) > 0 ? "border-t border-[#f3f4f6] mt-1 pt-0" : ""}>
                  <SectionHeader icon={<Briefcase size={12} />} label={t("globalSearch.sections.opportunities")} />
                  {opportunities.map((o) => {
                    const idx = cursor++;
                    return <OpportunityRow key={o.id} o={o} focused={focusedIdx === idx} onClick={() => navigate({ kind: "opportunity", item: o })} />;
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-[#f3f4f6] px-4 py-2.5 flex items-center gap-4 mt-1">
                <span className="text-[11px] text-[#9ca3af]" style={mont}><kbd className="bg-[#f3f4f6] rounded px-1 mr-0.5">↑↓</kbd>{t("globalSearch.hints.navigate")}</span>
                <span className="text-[11px] text-[#9ca3af]" style={mont}><kbd className="bg-[#f3f4f6] rounded px-1 mr-0.5">↵</kbd>{t("globalSearch.hints.open")}</span>
                <span className="text-[11px] text-[#9ca3af]" style={mont}><kbd className="bg-[#f3f4f6] rounded px-1 mr-0.5">Esc</kbd>{t("globalSearch.hints.close")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
