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
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[12px] p-[18px] flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[14px] font-medium text-[#6a7282] max-w-[178px]" style={mont}>{label}</p>
        <span className="size-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px]" style={poppins}>{value}</p>
        <p className="text-[12px] font-medium text-[#00c950] mt-1" style={mont}>{trend}</p>
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
      className="inline-flex items-center px-3 py-[7px] rounded-[8px] text-[12px]"
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
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-[#0d2138]" style={poppins}>Agents</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage your team of property agents</p>
        </div>
        <div className="flex items-center gap-3">
          {canViewInvitations && (
            <Link
              href="/dashboard/agents/invitations"
              className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e5e7eb] text-[#1e4f86] rounded-[10px] text-[14px] font-medium hover:bg-[#f8fafc] transition-colors"
              style={mont}
            >
              <Mail size={16} />
              Invitations
            </Link>
          )}
          {canInvite && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              <Plus size={16} />
              Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
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

      {/* Agents table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Table header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-medium text-[#0d2138]" style={mont}>Approve Agents</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px]">
              <Search size={14} className="text-[#6a7282] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="text-[12px] text-[#2b3038] placeholder:text-[#6a7282] bg-transparent outline-none w-[160px]"
                style={mont}
              />
            </div>
            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AgentStatus | "All")}
                className="h-9 pl-3 pr-8 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="All">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Denied">Denied</option>
              </select>
              <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            {/* Period */}
            <button
              type="button"
              className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af]"
              style={mont}
            >
              Last Month <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                {["Agents", "Role", "Contact", "Location", "Sign Up Date", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left ${h === "Status" || h === "Actions" ? "text-center" : ""}`}
                    style={mont}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => {
                const isActioned = agent.status === "Approved" || agent.status === "Denied";
                return (
                  <tr key={agent.id} className="border-b border-[#e5e7eb] last:border-b-0">
                    {/* Name */}
                    <td className="px-4 py-4 w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={mont}>
                          {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap hover:underline"
                          style={mont}
                        >
                          {agent.name}
                        </Link>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-4 w-[172px]">
                      <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>{agent.role}</span>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-4 w-[200px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] text-[#0d2138] whitespace-nowrap" style={mont}>{agent.email}</span>
                        <span className="text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>{agent.phone}</span>
                      </div>
                    </td>
                    {/* Location */}
                    <td className="px-4 py-4 w-[136px]">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{agent.location}</span>
                    </td>
                    {/* Sign Up Date */}
                    <td className="px-4 py-4 w-[144px]">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{agent.signUpDate}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4 w-[144px] text-center">
                      <StatusBadge status={agent.status} />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-4 w-[134px] text-center">
                      {isActioned ? (
                        <span className="text-[14px] text-[#6a7282]" style={mont}>{agent.status}</span>
                      ) : canApprove ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Approve"
                            className="size-8 flex items-center justify-center border border-[#7bf1a8] rounded-[8px] bg-white hover:bg-[#f5fffa] transition-colors"
                          >
                            <Check size={14} className="text-[#00aa4f]" />
                          </button>
                          <button
                            type="button"
                            title="Deny"
                            className="size-8 flex items-center justify-center border border-[#ffa2a2] rounded-[8px] bg-white hover:bg-[#fff5f5] transition-colors"
                          >
                            <X size={14} className="text-[#fb2c36]" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#99a1af]" style={mont}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {MOCK_AGENTS.length} agents
          </span>
        </div>
      </div>

      {showModal && <AddAgentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
