"use client";

import { useState } from "react";
import { Search, Plus, Home, CheckCircle2, Eye, Star, ChevronDown, Filter, LayoutGrid, List } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import {
  MOCK_LISTINGS,
  type Listing,
  type ListingType,
  type ListingStatus,
} from "./listings-data";
import { ListingListView } from "./components/ListingListView";
import { ListingGridView } from "./components/ListingGridView";
import { ListingFilterModal } from "./components/ListingFilterModal";
import { UploadListingModal, type NewListing } from "./components/UploadListingModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type ViewMode = "list" | "grid";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  trendMuted,
  iconBg,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  trendMuted?: boolean;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[12px] p-[18px] flex flex-col gap-6">
      <div className="flex items-start justify-between gap-7">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</p>
        <p className={`text-[12px] font-medium ${trendMuted ? "text-[#6a7282]" : "text-[#00a63e]"}`} style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ListingsPageProps = {
  role: Role;
};

export function ListingsPage({ role }: ListingsPageProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [showUpload, setShowUpload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ListingType | "All">("All");
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);

  const canCreate = hasPermission(role, "listings:create");

  const filtered = listings.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.listingId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesType = typeFilter === "All" || l.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  function handleCreate(input: NewListing) {
    const price = input.salePrice || input.rentPrice || "0";
    const formatted = `$${Number(price || 0).toLocaleString("en-US")}`;
    setListings((prev) => [
      {
        id: Math.max(0, ...prev.map((l) => l.id)) + 1,
        listingId: `LST-${String(prev.length + 1).padStart(4, "0")}`,
        name: input.name || "Untitled Listing",
        location: input.location || "—",
        image: input.images[0] ?? "/assets/figma-temp/UserProfile/prop-0.png",
        type: input.type,
        price: formatted,
        bedrooms: Number(input.bedrooms) || 0,
        bathrooms: Number(input.bathrooms) || 0,
        area: Number(input.area) || 0,
        operation: input.operation,
        status: input.status,
        views: 0,
        featured: input.featured,
      },
      ...prev,
    ]);
    setShowUpload(false);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Listings</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage and upload property listings</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            Upload New Listing
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total Listings"  value={String(listings.length)} trend="↑ 2 new this month"        iconBg="#e0e7ff" icon={<Home size={18} className="text-[#6366f1]" />} />
        <StatCard label="Active Listings" value="108"   trend="↑ +12.5% from last month" iconBg="#d1fae5" icon={<CheckCircle2 size={18} className="text-[#10b981]" />} />
        <StatCard label="Total Views"     value="3,161" trend="↑ +18.2% from last month" iconBg="#fef3c7" icon={<Eye size={18} className="text-[#f59e0b]" />} />
        <StatCard label="Featured"        value="4.8"   trend="Premium listings" trendMuted iconBg="#e0e7ff" icon={<Star size={18} className="text-[#6366f1]" />} />
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] p-[17px] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[280px] max-w-full">
          <Search size={16} className="text-[#99a1af] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location...."
            className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
            style={mont}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilter(true)}
          className="size-9 flex items-center justify-center bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors"
          title="Filter"
        >
          <Filter size={16} />
        </button>
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#6a7282]" style={mont}>Status:</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ListingStatus | "All")}
              className="h-9 pl-3 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#2b3038] appearance-none outline-none cursor-pointer"
              style={mont}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Rented">Rented</option>
              <option value="Sold">Sold</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>
        {/* Type */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#6a7282]" style={mont}>Type:</span>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ListingType | "All")}
              className="h-9 pl-3 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#2b3038] appearance-none outline-none cursor-pointer"
              style={mont}
            >
              <option value="All">All</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setView("grid")}
            title="Grid view"
            className={`size-8 flex items-center justify-center rounded-[8px] border transition-colors ${
              view === "grid" ? "bg-[#1e4f86] border-[#1e4f86] text-white" : "bg-white border-[#e5e7eb] text-[#6a7282] hover:bg-[#f9fafb]"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            title="List view"
            className={`size-8 flex items-center justify-center rounded-[8px] border transition-colors ${
              view === "list" ? "bg-[#1e4f86] border-[#1e4f86] text-white" : "bg-white border-[#e5e7eb] text-[#6a7282] hover:bg-[#f9fafb]"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "list" ? (
        <ListingListView listings={filtered} onFilterClick={() => setShowFilter(true)} />
      ) : (
        <ListingGridView listings={filtered} />
      )}

      {showUpload && <UploadListingModal onClose={() => setShowUpload(false)} onCreate={handleCreate} />}
      {showFilter && (
        <ListingFilterModal
          resultCount={filtered.length}
          onApply={() => setShowFilter(false)}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
