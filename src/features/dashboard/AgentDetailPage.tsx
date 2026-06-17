"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  DollarSign,
  Eye,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Search,
} from "lucide-react";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const poppins = {
  fontFamily: "'Poppins', sans-serif",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type PropertyType =
  | "Apartment"
  | "House"
  | "Commercial"
  | "Villa";

type PropertyStatus =
  | "Active"
  | "Inactive"
  | "Paused"
  | "Rented";

type AssignedProperty = {
  id: string;
  name: string;
  type: PropertyType;
  location: string;
  price: string;
  status: PropertyStatus;
};

type AgentDetail = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Inactive";
  email: string;
  phone: string;
  location: string;
  avatar?: string | null;
  totalListings: number;
  totalRevenue: string;
  agentEarnings: string;
  earningsTrend: string;
  totalDeals: number;
  openDeals: number;
  properties: AssignedProperty[];
};

type AgentDetailPageProps = {
  agentId: number;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_AGENTS: Record<number, AgentDetail> = {
  1: {
    id: 1,
    name: "Michael Rodriguez",
    role: "Agent",
    status: "Active",
    email: "michael.r@ulrich.com",
    phone: "+54 11 4567-8901",
    location: "La Plata, Argentina",
    avatar: null,
    totalListings: 45,
    totalRevenue: "$485K",
    agentEarnings: "$4K",
    earningsTrend: "+18%",
    totalDeals: 23,
    openDeals: 8,
    properties: [
      {
        id: "LST-0001",
        name: "Modern Downtown Apartment",
        type: "Apartment",
        location: "Buenos Aires",
        price: "$450,000",
        status: "Active",
      },
      {
        id: "LST-0002",
        name: "Family House with Garden",
        type: "House",
        location: "La Plata",
        price: "$620,000",
        status: "Active",
      },
      {
        id: "LST-0003",
        name: "Luxury Penthouse",
        type: "Apartment",
        location: "Buenos Aires",
        price: "$890,000",
        status: "Inactive",
      },
      {
        id: "LST-0004",
        name: "Commercial Office Space",
        type: "Commercial",
        location: "Córdoba",
        price: "$3,500/mo",
        status: "Paused",
      },
      {
        id: "LST-0005",
        name: "Beachfront Villa",
        type: "House",
        location: "Mar del Plata",
        price: "$1,200,000",
        status: "Rented",
      },
    ],
  },
};

const DEFAULT_AGENT: AgentDetail = {
  id: 0,
  name: "Thomas Fletcher",
  role: "Property Specialist",
  status: "Active",
  email: "thomas.f@ulrich.com",
  phone: "+54 11 4567-8901",
  location: "La Plata, Argentina",
  avatar: null,
  totalListings: 45,
  totalRevenue: "$485K",
  agentEarnings: "$4K",
  earningsTrend: "+18%",
  totalDeals: 23,
  openDeals: 8,
  properties: [
    {
      id: "LST-0001",
      name: "Modern Downtown Apartment",
      type: "Apartment",
      location: "Buenos Aires",
      price: "$450,000",
      status: "Active",
    },
    {
      id: "LST-0002",
      name: "Family House with Garden",
      type: "House",
      location: "La Plata",
      price: "$620,000",
      status: "Active",
    },
    {
      id: "LST-0003",
      name: "Luxury Penthouse",
      type: "Apartment",
      location: "Buenos Aires",
      price: "$890,000",
      status: "Inactive",
    },
    {
      id: "LST-0004",
      name: "Commercial Office Space",
      type: "Commercial",
      location: "Córdoba",
      price: "$3,500/mo",
      status: "Paused",
    },
    {
      id: "LST-0005",
      name: "Beachfront Villa",
      type: "House",
      location: "Mar del Plata",
      price: "$1,200,000",
      status: "Rented",
    },
  ],
};

// ── Badge styles ──────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<
  PropertyType,
  { background: string; text: string }
> = {
  Apartment: {
    background: "#ffedd4",
    text: "#bb4d00",
  },
  House: {
    background: "#dff2fe",
    text: "#0069a8",
  },
  Commercial: {
    background: "#dcfce7",
    text: "#00786f",
  },
  Villa: {
    background: "#ede9fe",
    text: "#6d28d9",
  },
};

const STATUS_STYLE: Record<
  PropertyStatus,
  { background: string; text: string }
> = {
  Active: {
    background: "#ecfdf5",
    text: "#00a63e",
  },
  Inactive: {
    background: "#ffc9c9",
    text: "#e7000b",
  },
  Paused: {
    background: "#fef3c6",
    text: "#e17100",
  },
  Rented: {
    background: "#f1f5f9",
    text: "#1e4f86",
  },
};

// ── Badge components ──────────────────────────────────────────────────────────

function TypeBadge({
  type,
}: {
  type: PropertyType;
}) {
  const badgeStyle = TYPE_STYLE[type];

  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[6px] px-3 py-1 text-[12px] font-medium"
      style={{
        backgroundColor: badgeStyle.background,
        color: badgeStyle.text,
        ...mont,
      }}
    >
      {type}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: PropertyStatus;
}) {
  const badgeStyle = STATUS_STYLE[status];

  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[6px] px-3 py-1 text-[12px] font-medium"
      style={{
        backgroundColor: badgeStyle.background,
        color: badgeStyle.text,
        ...mont,
      }}
    >
      {status}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  iconBackground: string;
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: string;
};

function StatCard({
  iconBackground,
  icon,
  value,
  label,
  trend,
}: StatCardProps) {
  return (
    <article className="flex min-h-[138px] min-w-0 flex-col rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:p-5">
      <span
        className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px]"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </span>

      <div className="mt-3 min-w-0">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <p
            className="min-w-0 truncate text-[24px] font-semibold leading-8 text-[#0d2138]"
            style={poppins}
          >
            {value}
          </p>

          {trend && (
            <span
              className="shrink-0 text-[14px] font-medium text-[#00a63e]"
              style={mont}
            >
              {trend}
            </span>
          )}
        </div>

        <p
          className="mt-0.5 text-[14px] leading-5 text-[#6a7282]"
          style={mont}
        >
          {label}
        </p>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AgentDetailPage({
  agentId,
}: AgentDetailPageProps) {
  const agent =
    MOCK_AGENTS[agentId] ?? {
      ...DEFAULT_AGENT,
      id: agentId,
    };

  const [propertySearch, setPropertySearch] =
    useState("");

  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const normalizedSearch = propertySearch
    .trim()
    .toLowerCase();

  const filteredProperties =
    agent.properties.filter((property) => {
      if (!normalizedSearch) return true;

      return [
        property.id,
        property.name,
        property.type,
        property.location,
        property.price,
        property.status,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });

  const isAgentActive =
    agent.status === "Active";

  return (
    <main className="min-h-full bg-[#f8fafc] px-3 py-4 sm:px-4 sm:py-5 lg:px-5">
      <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-4">
        {/* Back link */}
        <Link
          href="/dashboard/agents"
          className="inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-[#6a7282] transition-colors hover:text-[#0d2138]"
          style={mont}
        >
          <ArrowLeft
            size={16}
            className="shrink-0"
          />

          <span>Back to Agents</span>
        </Link>

        {/* Agent header */}
        <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Agent information */}
            <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
              {/* Avatar */}
              <div
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e7eb] bg-[#1e4f86] text-[18px] font-semibold text-white sm:size-[70px] sm:text-[20px]"
                style={mont}
              >
                {agent.avatar ? (
                  <img
                    src={agent.avatar}
                    alt={`${agent.name} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              {/* Name and details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="break-words text-[18px] font-semibold leading-6 text-[#0d2138] sm:text-[20px]"
                    style={poppins}
                  >
                    {agent.name}
                  </h1>

                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium ${
                      isAgentActive
                        ? "border-[#86efac] bg-[#dcfce7] text-[#008236]"
                        : "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
                    }`}
                    style={mont}
                  >
                    <span
                      className={`mr-1 size-1.5 rounded-full ${
                        isAgentActive
                          ? "bg-[#00c950]"
                          : "bg-[#ef4444]"
                      }`}
                    />

                    {agent.status}
                  </span>
                </div>

                <p
                  className="mt-1 text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {agent.role}
                </p>

                {/* Contact information */}
                <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
                  <span
                    className="flex min-w-0 items-start gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <Mail
                      size={15}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <span className="break-all">
                      {agent.email}
                    </span>
                  </span>

                  <span
                    className="flex items-center gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <Phone
                      size={15}
                      className="shrink-0 text-[#6a7282]"
                    />

                    <span>
                      {agent.phone || "—"}
                    </span>
                  </span>

                  <span
                    className="flex min-w-0 items-start gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <span className="break-words">
                      {agent.location || "—"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Period selector */}
            <button
              type="button"
              aria-label="Select reporting period"
              className="flex h-11 w-full shrink-0 items-center justify-between gap-2 rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#183f6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 lg:h-10 lg:w-auto lg:justify-center"
              style={mont}
            >
              <span>Current Month</span>

              <ChevronDown
                size={16}
                className="shrink-0"
              />
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            iconBackground="#e4e7ff"
            icon={
              <Building2
                size={20}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
            value={agent.totalListings}
            label="Total Listings"
          />

          <StatCard
            iconBackground="#d1fae5"
            icon={
              <DollarSign
                size={21}
                strokeWidth={1.8}
                className="text-[#10b981]"
              />
            }
            value={agent.totalRevenue}
            label="Total Revenue"
          />

          <StatCard
            iconBackground="#fef3c7"
            icon={
              <Handshake
                size={20}
                strokeWidth={1.8}
                className="text-[#f59e0b]"
              />
            }
            value={agent.agentEarnings}
            label="Agent Earnings"
            trend={agent.earningsTrend}
          />

          <StatCard
            iconBackground="#e4e7ff"
            icon={
              <Building2
                size={20}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
            value={agent.openDeals}
            label="Open Deals"
          />
        </section>

        {/* Properties assigned */}
        <section className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
          {/* Properties header */}
          <div className="flex flex-col gap-4 border-b border-[#e5e7eb] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className="text-[16px] font-semibold leading-6 text-[#0d2138]"
                style={mont}
              >
                Properties Assigned
              </h2>

              <p
                className="mt-0.5 text-[14px] text-[#6a7282]"
                style={mont}
              >
                {agent.properties.length} total properties
              </p>
            </div>

            {/* Search */}
            <div className="flex h-11 w-full items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3 transition-colors focus-within:border-[#1e4f86] focus-within:ring-2 focus-within:ring-[#1e4f86]/10 sm:h-10 sm:w-[230px]">
              <Search
                size={16}
                className="shrink-0 text-[#99a1af]"
              />

              <input
                type="search"
                value={propertySearch}
                onChange={(event) =>
                  setPropertySearch(event.target.value)
                }
                placeholder="Search properties..."
                aria-label="Search assigned properties"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af]"
                style={mont}
              />
            </div>
          </div>

          {/* Tablet and desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfc]">
                  {[
                    "LISTING ID",
                    "PROPERTY NAME",
                    "TYPE",
                    "LOCATION",
                    "PRICE",
                    "STATUS",
                    "",
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap px-4 py-3 text-left text-[12px] font-medium tracking-wide text-[#99a1af]"
                      style={mont}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredProperties.map(
                  (property) => (
                    <tr
                      key={property.id}
                      className="border-t border-[#edf0f3] transition-colors hover:bg-[#fafbfc]"
                    >
                      <td className="px-4 py-3.5">
                        <span
                          className="whitespace-nowrap text-[14px] font-semibold text-[#1e4f86]"
                          style={mont}
                        >
                          {property.id}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="whitespace-nowrap text-[14px] font-medium text-[#2b3038]"
                          style={mont}
                        >
                          {property.name}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <TypeBadge
                          type={property.type}
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="flex items-center gap-1.5 whitespace-nowrap text-[14px] text-[#6a7282]"
                          style={mont}
                        >
                          <MapPin
                            size={14}
                            className="shrink-0 text-[#7b8493]"
                          />

                          {property.location}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="whitespace-nowrap text-[14px] font-medium text-[#0d2138]"
                          style={mont}
                        >
                          {property.price}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={property.status}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          aria-label={`View ${property.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-[8px] text-[#99a1af] transition-colors hover:bg-[#f3f4f6] hover:text-[#1e4f86]"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}

                {filteredProperties.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      No properties found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile property cards */}
          <div className="flex flex-col gap-3 bg-[#f8fafc] p-3 md:hidden">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <article
                  key={property.id}
                  className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                >
                  {/* Property heading */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-semibold text-[#1e4f86]"
                        style={mont}
                      >
                        {property.id}
                      </p>

                      <h3
                        className="mt-1.5 break-words text-[14px] font-semibold leading-5 text-[#0d2138]"
                        style={mont}
                      >
                        {property.name}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge
                        status={property.status}
                      />
                    </div>
                  </div>

                  {/* Property details */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        Type
                      </p>

                      <div className="mt-2">
                        <TypeBadge
                          type={property.type}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        Price
                      </p>

                      <p
                        className="mt-2 truncate text-[14px] font-semibold text-[#0d2138]"
                        style={mont}
                      >
                        {property.price}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#f8fafc] p-3">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <div className="min-w-0">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        Location
                      </p>

                      <p
                        className="mt-1 break-words text-[14px] font-medium text-[#6a7282]"
                        style={mont}
                      >
                        {property.location}
                      </p>
                    </div>
                  </div>

                  {/* View button */}
                  <button
                    type="button"
                    aria-label={`View ${property.name}`}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#dbe3ec] bg-white text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f8fafc]"
                    style={mont}
                  >
                    <Eye
                      size={16}
                      className="shrink-0"
                    />

                    View Property
                  </button>
                </article>
              ))
            ) : (
              <div
                className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
                style={mont}
              >
                No properties found.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}