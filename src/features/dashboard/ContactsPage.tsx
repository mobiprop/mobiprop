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
        <p className="text-[14px] font-medium text-[#00c950]" style={mont}>{trend}</p>
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
      className="inline-flex items-center justify-center w-[76px] px-3 py-1 rounded-[6px] text-[14px] font-medium"
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
  <div className="px-4 py-4 flex flex-col gap-4 sm:px-5 sm:py-5 sm:gap-5 lg:px-6">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1
          className="text-[18px] font-medium text-[#0d2138] leading-7 sm:text-[20px] sm:leading-[32px]"
          style={poppins}
        >
          Contacts
        </h1>

        <p
          className="text-[14px] font-medium text-[#6a7282] leading-5 sm:text-[14px]"
          style={mont}
        >
          Manage your clients and prospects database
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
        <button
          type="button"
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#99a1af] transition-colors hover:bg-[#f9fafb] sm:px-4 sm:text-[14px]"
          style={mont}
        >
          <Upload size={16} className="shrink-0" />
          <span className="truncate">Import</span>
        </button>

        <button
          type="button"
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#99a1af] transition-colors hover:bg-[#f9fafb] sm:px-4 sm:text-[14px]"
          style={mont}
        >
          <Share2 size={16} className="shrink-0" />
          <span className="truncate">Export</span>
        </button>

        {canCreate && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="col-span-2 flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-span-1 sm:px-4 sm:text-[14px]"
            style={mont}
          >
            <Plus size={16} className="shrink-0" />
            <span className="truncate">Add Contact</span>
          </button>
        )}
      </div>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
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
    <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
      {/* Table header / controls */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2
          className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          All Contacts
        </h2>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div className="col-span-2 flex h-9 min-w-0 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 sm:col-span-1 sm:w-[204px] sm:px-4">
            <Search size={16} className="shrink-0 text-[#99a1af]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contacts..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[14px]"
              style={mont}
            />
          </div>

          {/* Sort By */}
          <div className="relative min-w-0">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as typeof sortBy)
              }
              className="h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] pl-3 pr-8 text-[14px] font-medium text-[#99a1af] outline-none sm:w-auto sm:pl-4 sm:pr-9 sm:text-[14px]"
              style={mont}
            >
              <option value="default">Sort By</option>
              <option value="name">Name (A–Z)</option>
              <option value="listings">Assigned Listings</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
            />
          </div>

          {/* Contact Type */}
          <div className="relative min-w-0">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as ContactType | "All",
                )
              }
              className="h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] pl-3 pr-8 text-[14px] font-medium text-[#99a1af] outline-none sm:w-auto sm:pl-4 sm:pr-9 sm:text-[14px]"
              style={mont}
            >
              <option value="All">Contact Type</option>
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
            />
          </div>

          {/* Status */}
          <div className="relative col-span-2 min-w-0 sm:col-span-1">
            <select
              className="h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] pl-3 pr-8 text-[14px] font-medium text-[#99a1af] outline-none sm:w-auto sm:pl-4 sm:pr-9 sm:text-[14px]"
              style={mont}
              defaultValue="All"
            >
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
            />
          </div>
        </div>
      </div>

      {/* Tablet and desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th
                className="w-[240px] px-6 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Contact Name
              </th>

              <th
                className="w-[224px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Contact Information
              </th>

              <th
                className="w-[200px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Location
              </th>

              <th
                className="w-[156px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Assigned Listings
              </th>

              <th
                className="w-[160px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Contact ID
              </th>

              <th
                className="w-[120px] px-4 py-[10px] text-center text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Contact Type
              </th>

              <th className="w-[55px]" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-b-0 hover:bg-[#fcfcfd]"
              >
                {/* Name */}
                <td className="w-[240px] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                      style={mont}
                    >
                      {contact.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <span
                      className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86] lg:text-[14px]"
                      style={mont}
                    >
                      {contact.name}
                    </span>
                  </div>
                </td>

                {/* Contact Information */}
                <td className="w-[224px] px-4 py-[14px]">
                  <div className="flex flex-col gap-1">
                    <span
                      className="whitespace-nowrap text-[14px] font-medium text-[#0d2138] lg:text-[14px]"
                      style={mont}
                    >
                      {contact.email}
                    </span>

                    <span
                      className="whitespace-nowrap text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {contact.phone}
                    </span>
                  </div>
                </td>

                {/* Location */}
                <td className="w-[200px] px-4 py-[18px]">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                    style={mont}
                  >
                    {contact.location}
                  </span>
                </td>

                {/* Assigned Listings */}
                <td className="w-[156px] px-4 py-[18px]">
                  <span
                    className="text-[14px] font-semibold text-[#4896b6] lg:text-[14px]"
                    style={mont}
                  >
                    {contact.assignedListings}
                  </span>
                </td>

                {/* Contact ID */}
                <td className="w-[160px] px-4 py-6">
                  <span
                    className="text-[14px] font-semibold text-[#4896b6] lg:text-[14px]"
                    style={mont}
                  >
                    {contact.contactId}
                  </span>
                </td>

                {/* Contact Type */}
                <td className="w-[120px] px-4 py-4 text-center">
                  <TypeBadge type={contact.type} />
                </td>

                {/* Actions */}
                <td className="w-[55px] px-4 py-4 text-center">
                  <button
                    type="button"
                    title="Actions"
                    aria-label={`Actions for ${contact.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile contact cards */}
      <div className="flex flex-col md:hidden">
        {filtered.map((contact) => (
          <div
            key={contact.id}
            className="border-t border-[#e5e7eb] p-4 first:border-t-0"
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                  style={mont}
                >
                  {contact.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div className="min-w-0">
                  <p
                    className="truncate text-[14px] font-medium text-[#1e4f86]"
                    style={mont}
                  >
                    {contact.name}
                  </p>

                  <p
                    className="mt-0.5 truncate text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {contact.contactId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                title="Actions"
                aria-label={`Actions for ${contact.name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Contact details */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 min-w-0">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Contact Information
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {contact.email}
                </p>

                <p
                  className="mt-0.5 truncate text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {contact.phone}
                </p>
              </div>

              <div className="min-w-0">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Location
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#6a7282]"
                  style={mont}
                >
                  {contact.location}
                </p>
              </div>

              <div>
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Assigned Listings
                </p>

                <p
                  className="mt-1 text-[14px] font-semibold text-[#4896b6]"
                  style={mont}
                >
                  {contact.assignedListings}
                </p>
              </div>
            </div>

            {/* Contact type */}
            <div className="mt-4 flex items-center justify-between border-t border-[#f3f4f6] pt-3">
              <span
                className="text-[14px] text-[#99a1af]"
                style={mont}
              >
                Contact Type
              </span>

              <TypeBadge type={contact.type} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="border-t border-[#e5e7eb] px-4 py-10">
            <p
              className="text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              No contacts found.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#f3f4f6] px-4 py-3 sm:px-5">
        <span
          className="text-[14px] font-medium text-[#6a7282] sm:text-[14px]"
          style={mont}
        >
          Showing {filtered.length} of {contacts.length} contacts
        </span>
      </div>
    </div>

    {showModal && (
      <AddContactModal
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    )}
  </div>
);
}
