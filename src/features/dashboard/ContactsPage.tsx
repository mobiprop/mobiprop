"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Users,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronDown,
  Upload,
  Share2,
  MoreVertical,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { AddContactModal, type NewContact } from "./components/AddContactModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContactType = "Buyer" | "Seller";

type MockContact = {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  assignedListings: number;
  contactId: string;
  type: ContactType;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONTACTS: MockContact[] = [
  { id: 1, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Seller" },
  { id: 2, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Buyer"  },
  { id: 3, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Buyer"  },
  { id: 4, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Buyer"  },
  { id: 5, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Seller" },
  { id: 6, name: "Thomas Fletcher", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata, Argentina", assignedListings: 23, contactId: "#1234", type: "Seller" },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, trend, iconBg, icon }: StatCardProps) {
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
        <p className="text-[12px] font-medium text-[#00c950]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Contact type badge ────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ContactType, { bg: string; text: string }> = {
  Seller: { bg: "#b8e6fe", text: "#0069a8" },
  Buyer:  { bg: "#dcfce7", text: "#008236" },
};

function TypeBadge({ type }: { type: ContactType }) {
  const s = TYPE_STYLE[type];
  return (
    <span
      className="inline-flex items-center justify-center w-[76px] px-3 py-1 rounded-[6px] text-[12px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {type}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ContactsPageProps = {
  role: Role;
};

export function ContactsPage({ role }: ContactsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "All">("All");
  const [sortBy, setSortBy] = useState<"default" | "name" | "listings">("default");
  const [contacts, setContacts] = useState<MockContact[]>(MOCK_CONTACTS);

  const canCreate = hasPermission(role, "contacts:create");

  const filtered = contacts
    .filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || c.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "listings") return b.assignedListings - a.assignedListings;
      return 0;
    });

  function handleCreate(input: NewContact) {
    setContacts((prev) => [
      {
        id: Math.max(0, ...prev.map((c) => c.id)) + 1,
        name: `${input.firstName} ${input.lastName}`.trim(),
        email: input.email,
        phone: input.phone,
        location: input.location || "—",
        assignedListings: input.properties?.filter(Boolean).length ?? 0,
        contactId: `#${1000 + prev.length + 1}`,
        type: input.contactType,
      },
      ...prev,
    ]);
    setShowModal(false);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Contacts</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage your clients and prospects database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f9fafb] transition-colors"
            style={mont}
          >
            <Upload size={16} />
            Import
          </button>
          <button
            type="button"
            className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f9fafb] transition-colors"
            style={mont}
          >
            <Share2 size={16} />
            Export
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              <Plus size={16} />
              Add Contact
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard
          label="Total Contacts"
          value={String(contacts.length)}
          trend="↑ 2 new this month"
          iconBg="#e0e7ff"
          icon={<Users size={18} className="text-[#6366f1]" />}
        />
        <StatCard
          label="Active Deals"
          value="108"
          trend="↑ +12.5% from last month"
          iconBg="#d1fae5"
          icon={<TrendingUp size={18} className="text-[#10b981]" />}
        />
        <StatCard
          label="Total Revenue"
          value="$2.21M"
          trend="↑ +18.2% from last month"
          iconBg="#fef3c7"
          icon={<DollarSign size={18} className="text-[#f59e0b]" />}
        />
        <StatCard
          label="Contacts in Opportunities"
          value="54%"
          trend="↑ +0.3 from last month"
          iconBg="#fee2e2"
          icon={<Briefcase size={18} className="text-[#ef4444]" />}
        />
      </div>

      {/* Contacts table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Table header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Contacts</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="default">Sort By</option>
                <option value="name">Name (A–Z)</option>
                <option value="listings">Assigned Listings</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            {/* Contact Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ContactType | "All")}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="All">Contact Type</option>
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            {/* Status */}
            <div className="relative">
              <select
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
                defaultValue="All"
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <th className="px-6 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[240px]" style={mont}>Contact Name</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[224px]" style={mont}>Contact Information</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[200px]" style={mont}>Location</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[156px]" style={mont}>Assigned Listings</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[160px]" style={mont}>Contact ID</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-center w-[120px]" style={mont}>Contact Type</th>
                <th className="w-[55px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id} className="border-b border-[#e5e7eb] last:border-b-0">
                  {/* Name */}
                  <td className="px-6 py-4 w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={mont}>
                        {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>
                        {contact.name}
                      </span>
                    </div>
                  </td>
                  {/* Contact Information */}
                  <td className="px-4 py-[14px] w-[224px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{contact.email}</span>
                      <span className="text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>{contact.phone}</span>
                    </div>
                  </td>
                  {/* Location */}
                  <td className="px-4 py-[18px] w-[200px]">
                    <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>{contact.location}</span>
                  </td>
                  {/* Assigned Listings */}
                  <td className="px-4 py-[18px] w-[156px]">
                    <span className="text-[14px] font-semibold text-[#4896b6]" style={mont}>{contact.assignedListings}</span>
                  </td>
                  {/* Contact ID */}
                  <td className="px-4 py-6 w-[160px]">
                    <span className="text-[14px] font-semibold text-[#4896b6]" style={mont}>{contact.contactId}</span>
                  </td>
                  {/* Contact Type */}
                  <td className="px-4 py-4 w-[120px] text-center">
                    <TypeBadge type={contact.type} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4 w-[55px] text-center">
                    <button
                      type="button"
                      title="Actions"
                      className="inline-flex items-center justify-center text-[#6a7282] hover:text-[#0d2138] transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {contacts.length} contacts
          </span>
        </div>
      </div>

      {showModal && (
        <AddContactModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
