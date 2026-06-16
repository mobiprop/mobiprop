"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  Briefcase,
  DollarSign,
  Building2,
  ChevronDown,
  Filter,
  Check,
  X,
  Mail,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { AddAgentModal } from "./components/AddAgentModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentStatus = "Approved" | "Pending" | "Denied";

type MockAgent = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  signUpDate: string;
  status: AgentStatus;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_AGENTS: MockAgent[] = [
  { id: 1, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "La Plata",  signUpDate: "May 5th, 2026", status: "Approved" },
  { id: 2, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Córdoba",   signUpDate: "May 5th, 2026", status: "Pending"  },
  { id: 3, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Rosario",   signUpDate: "May 5th, 2026", status: "Pending"  },
  { id: 4, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Ushuaia",   signUpDate: "May 5th, 2026", status: "Pending"  },
  { id: 5, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Bariloche", signUpDate: "May 5th, 2026", status: "Denied"   },
  { id: 6, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Rosario",   signUpDate: "May 5th, 2026", status: "Approved" },
  { id: 7, name: "Thomas Fletcher", role: "Property Specialist", email: "michael.r@ulrich.com", phone: "+54 11 4567-8901", location: "Córdoba",   signUpDate: "May 5th, 2026", status: "Approved" },
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
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[14px] p-[18px] flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</p>
        <p className="text-[14px] font-medium text-[#00c950] mt-1" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<AgentStatus, { bg: string; border: string; text: string }> = {
  Approved: { bg: "#f5fffa", border: "#89d8a9", text: "#00aa4f" },
  Pending:  { bg: "#fffcf5", border: "#ffd384", text: "#ffa80a" },
  Denied:   { bg: "#fff5f5", border: "#f49e9e", text: "#fb2c36" },
};

function StatusBadge({ status }: { status: AgentStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center px-3 py-[7px] rounded-[8px] text-[14px]"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text, ...mont }}
    >
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type AgentsPageProps = {
  role: Role;
};

export function AgentsPage({ role }: AgentsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "All">("All");
  const canInvite = hasPermission(role, "agents:invite");
  const canApprove = hasPermission(role, "agents:update");
  const canViewInvitations = hasPermission(role, "invitations:view");

  const filtered = MOCK_AGENTS.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

return (
  <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1
          className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px]"
          style={poppins}
        >
          Agents
        </h1>

        <p
          className="text-[14px] font-medium leading-5 text-[#6a7282] sm:text-[14px]"
          style={mont}
        >
          Manage your team of property agents
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
        {canViewInvitations && (
          <Link
            href="/dashboard/agents/invitations"
            className="
              flex h-10 min-w-0 items-center justify-center gap-2
              rounded-[10px] border border-[#e5e7eb]
              bg-white px-3
              text-[14px] font-medium text-[#1e4f86]
              transition-colors hover:bg-[#f8fafc]
              sm:px-4 sm:text-[14px]
            "
            style={mont}
          >
            <Mail size={16} className="shrink-0" />
            <span className="truncate">Invitations</span>
          </Link>
        )}

        {canInvite && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`
              flex h-10 min-w-0 items-center justify-center gap-2
              rounded-[10px] bg-[#1e4f86]
              px-3 text-[14px] font-medium text-white
              transition-colors hover:bg-[#1b487a]
              sm:px-4 sm:text-[14px]

              ${!canViewInvitations ? "col-span-2" : ""}
            `}
            style={mont}
          >
            <Plus size={16} className="shrink-0" />
            <span className="truncate">Add Agent</span>
          </button>
        )}
      </div>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
      <StatCard
        label="Total Agents"
        value="6"
        trend="↑ 2 new this month"
        iconBg="#e0e7ff"
        icon={<Users size={16} className="text-[#6366f1]" />}
      />

      <StatCard
        label="Active Deals"
        value="108"
        trend="↑ +12.5% from last month"
        iconBg="#ecfdf5"
        icon={<Briefcase size={18} className="text-[#10b981]" />}
      />

      <StatCard
        label="Total Revenue"
        value="$2.21M"
        trend="↑ +18.2% from last month"
        iconBg="#fef3c7"
        icon={<DollarSign size={18} className="text-[#f59e0b]" />}
      />

      <StatCard
        label="Total Listings"
        value="19"
        trend="↑ +0.3 from last month"
        iconBg="#fff7ed"
        icon={<Building2 size={18} className="text-[#f97316]" />}
      />
    </div>

    {/* Agents section */}
    <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
      {/* Header and controls */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2
          className="text-[14px] font-medium text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          Approve Agents
        </h2>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div
            className="
              col-span-2 flex h-9 min-w-0 items-center gap-2
              rounded-[10px] border border-[#e5e7eb]
              bg-[#f8fafc] px-3
              sm:col-span-1 sm:w-[200px]
            "
          >
            <Search size={14} className="shrink-0 text-[#6a7282]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agents..."
              className="
                min-w-0 flex-1 bg-transparent
                text-[14px] text-[#2b3038]
                outline-none placeholder:text-[#6a7282]
              "
              style={mont}
            />
          </div>

          {/* Status filter */}
          <div className="relative min-w-0">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as AgentStatus | "All",
                )
              }
              className="
                h-9 w-full cursor-pointer appearance-none
                rounded-[10px] border border-[#e5e7eb]
                bg-[#f8fafc]
                pl-3 pr-8
                text-[14px] font-medium text-[#99a1af]
                outline-none
                sm:w-auto sm:text-[14px]
              "
              style={mont}
            >
              <option value="All">All</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Denied">Denied</option>
            </select>

            <Filter
              size={14}
              className="
                pointer-events-none absolute
                right-2.5 top-1/2
                -translate-y-1/2 text-[#99a1af]
              "
            />
          </div>

          {/* Period */}
          <button
            type="button"
            className="
              flex h-9 min-w-0 items-center justify-center gap-2
              rounded-[10px] border border-[#e5e7eb]
              bg-[#f8fafc] px-3
              text-[14px] font-medium text-[#99a1af]
              sm:text-[14px]
            "
            style={mont}
          >
            <span className="truncate">Last Month</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>
        </div>
      </div>

      {/* Tablet and desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              {[
                "Agents",
                "Role",
                "Contact",
                "Location",
                "Sign Up Date",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className={`
                    px-4 py-[10px]
                    text-left text-[14px] font-medium
                    text-[#6a7282]
                    lg:text-[14px]

                    ${
                      heading === "Status" || heading === "Actions"
                        ? "text-center"
                        : ""
                    }
                  `}
                  style={mont}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((agent) => {
              const isActioned =
                agent.status === "Approved" ||
                agent.status === "Denied";

              return (
                <tr
                  key={agent.id}
                  className="
                    border-b border-[#e5e7eb]
                    transition-colors
                    last:border-b-0
                    hover:bg-[#fcfcfd]
                  "
                >
                  {/* Name */}
                  <td className="w-[220px] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex size-8 shrink-0
                          items-center justify-center
                          rounded-full bg-[#1e4f86]
                          text-[14px] font-semibold text-white
                        "
                        style={mont}
                      >
                        {agent.name
                          .split(" ")
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <Link
                        href={`/dashboard/agents/${agent.id}`}
                        className="
                          whitespace-nowrap
                          text-[14px] font-medium text-[#1e4f86]
                          hover:underline
                          lg:text-[14px]
                        "
                        style={mont}
                      >
                        {agent.name}
                      </Link>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="w-[172px] px-4 py-4">
                    <span
                      className="
                        whitespace-nowrap
                        text-[14px] font-medium text-[#6a7282]
                        lg:text-[14px]
                      "
                      style={mont}
                    >
                      {agent.role}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="w-[200px] px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className="
                          whitespace-nowrap
                          text-[14px] text-[#0d2138]
                          lg:text-[14px]
                        "
                        style={mont}
                      >
                        {agent.email}
                      </span>

                      <span
                        className="whitespace-nowrap text-[14px] text-[#6a7282]"
                        style={mont}
                      >
                        {agent.phone}
                      </span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="w-[136px] px-4 py-4">
                    <span
                      className="
                        whitespace-nowrap
                        text-[14px] text-[#6a7282]
                        lg:text-[14px]
                      "
                      style={mont}
                    >
                      {agent.location}
                    </span>
                  </td>

                  {/* Sign Up Date */}
                  <td className="w-[144px] px-4 py-4">
                    <span
                      className="
                        whitespace-nowrap
                        text-[14px] text-[#6a7282]
                        lg:text-[14px]
                      "
                      style={mont}
                    >
                      {agent.signUpDate}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="w-[144px] px-4 py-4 text-center">
                    <StatusBadge status={agent.status} />
                  </td>

                  {/* Actions */}
                  <td className="w-[134px] px-4 py-4 text-center">
                    {isActioned ? (
                      <span
                        className="text-[14px] text-[#6a7282] lg:text-[14px]"
                        style={mont}
                      >
                        {agent.status}
                      </span>
                    ) : canApprove ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Approve"
                          aria-label={`Approve ${agent.name}`}
                          className="
                            flex size-8 items-center justify-center
                            rounded-[8px] border border-[#7bf1a8]
                            bg-white transition-colors
                            hover:bg-[#f5fffa]
                          "
                        >
                          <Check size={14} className="text-[#00aa4f]" />
                        </button>

                        <button
                          type="button"
                          title="Deny"
                          aria-label={`Deny ${agent.name}`}
                          className="
                            flex size-8 items-center justify-center
                            rounded-[8px] border border-[#ffa2a2]
                            bg-white transition-colors
                            hover:bg-[#fff5f5]
                          "
                        >
                          <X size={14} className="text-[#fb2c36]" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="
                    px-4 py-10 text-center
                    text-[14px] text-[#6a7282]
                  "
                  style={mont}
                >
                  No agents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile agent cards */}
      <div className="flex flex-col md:hidden">
        {filtered.map((agent) => {
          const isActioned =
            agent.status === "Approved" ||
            agent.status === "Denied";

          return (
            <div
              key={agent.id}
              className="
                border-t border-[#e5e7eb]
                p-4 first:border-t-0
              "
            >
              {/* Agent top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="
                      flex size-10 shrink-0
                      items-center justify-center
                      rounded-full bg-[#1e4f86]
                      text-[14px] font-semibold text-white
                    "
                    style={mont}
                  >
                    {agent.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="
                        block truncate
                        text-[14px] font-medium text-[#1e4f86]
                        hover:underline
                      "
                      style={mont}
                    >
                      {agent.name}
                    </Link>

                    <p
                      className="mt-0.5 truncate text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {agent.role}
                    </p>
                  </div>
                </div>

                <StatusBadge status={agent.status} />
              </div>

              {/* Agent details */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2 min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Contact
                  </p>

                  <p
                    className="
                      mt-1 truncate
                      text-[14px] text-[#0d2138]
                    "
                    style={mont}
                  >
                    {agent.email}
                  </p>

                  <p
                    className="
                      mt-0.5 truncate
                      text-[14px] text-[#6a7282]
                    "
                    style={mont}
                  >
                    {agent.phone}
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
                    className="
                      mt-1 truncate
                      text-[14px] text-[#6a7282]
                    "
                    style={mont}
                  >
                    {agent.location}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Sign Up Date
                  </p>

                  <p
                    className="
                      mt-1 truncate
                      text-[14px] text-[#6a7282]
                    "
                    style={mont}
                  >
                    {agent.signUpDate}
                  </p>
                </div>
              </div>

              {/* Mobile actions */}
              <div className="mt-4 border-t border-[#f3f4f6] pt-3">
                {isActioned ? (
                  <p
                    className="text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    Agent {agent.status.toLowerCase()}
                  </p>
                ) : canApprove ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="
                        flex h-9 items-center justify-center gap-2
                        rounded-[8px]
                        border border-[#7bf1a8]
                        bg-white
                        text-[14px] font-medium text-[#00aa4f]
                        transition-colors
                        hover:bg-[#f5fffa]
                      "
                      style={mont}
                    >
                      <Check size={14} />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="
                        flex h-9 items-center justify-center gap-2
                        rounded-[8px]
                        border border-[#ffa2a2]
                        bg-white
                        text-[14px] font-medium text-[#fb2c36]
                        transition-colors
                        hover:bg-[#fff5f5]
                      "
                      style={mont}
                    >
                      <X size={14} />
                      Deny
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    No actions available
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="border-t border-[#e5e7eb] px-4 py-10">
            <p
              className="text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              No agents found.
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
          Showing {filtered.length} of {MOCK_AGENTS.length} agents
        </span>
      </div>
    </div>

    {showModal && (
      <AddAgentModal onClose={() => setShowModal(false)} />
    )}
  </div>
);
}
