"use client";

import { useState, useEffect, useCallback } from "react";
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
import type { AgentDto, AgentMetrics } from "@/features/agents/agent-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentStatus = "Approved" | "Pending" | "Denied";

function mapStatus(status: AgentDto["status"]): AgentStatus {
  if (status === "ACTIVE") return "Approved";
  if (status === "PENDING" || status === "INVITED") return "Pending";
  return "Denied";
}

function mapRole(role: AgentDto["role"]): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "MANAGER") return "Manager";
  return "Property Specialist";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const canInvite = hasPermission(role, "agents:invite");
  const canApprove = hasPermission(role, "agents:update");
  const canViewInvitations = hasPermission(role, "invitations:view");

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
        setMetrics(data.metrics);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function handleApprove(agentId: string) {
    setActioningId(agentId);
    await fetch(`/api/dashboard/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    await fetchAgents();
    setActioningId(null);
  }

  async function handleDeny(agentId: string) {
    setActioningId(agentId);
    await fetch(`/api/dashboard/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INACTIVE" }),
    });
    await fetchAgents();
    setActioningId(null);
  }

  const filtered = agents.filter((a) => {
    const mapped = mapStatus(a.status);
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.city ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || mapped === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px]" style={poppins}>Agents</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage your team of property agents</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          {canViewInvitations && (
            <Link
              href="/dashboard/agents/invitations"
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f8fafc] sm:px-4"
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
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:px-4"
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
          value={metrics ? String(metrics.total) : "—"}
          trend={metrics ? `${metrics.active} active` : "Loading…"}
          iconBg="#e0e7ff"
          icon={<Users size={16} className="text-[#6366f1]" />}
        />
        <StatCard
          label="Pending Approval"
          value={metrics ? String(metrics.pending) : "—"}
          trend={metrics ? `${metrics.total - metrics.pending} already reviewed` : "Loading…"}
          iconBg="#ecfdf5"
          icon={<Briefcase size={18} className="text-[#10b981]" />}
        />
        <StatCard
          label="Active Agents"
          value={metrics ? String(metrics.active) : "—"}
          trend={metrics ? `${metrics.inactive} inactive` : "Loading…"}
          iconBg="#fef3c7"
          icon={<DollarSign size={18} className="text-[#f59e0b]" />}
        />
        <StatCard
          label="Total Staff"
          value={metrics ? String(metrics.total) : "—"}
          trend="Agents + Managers + Admins"
          iconBg="#fff7ed"
          icon={<Building2 size={18} className="text-[#f97316]" />}
        />
      </div>

      {/* Agents table */}
     <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
  {/* Header and controls */}
  <div className="border-b border-[#f3f4f6] p-4 sm:p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <h2
        className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
        style={mont}
      >
        Approve Agents
      </h2>

      <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
        {/* Search */}
        <div className="col-span-2 flex h-11 min-w-0 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 focus-within:border-[#1e4f86] sm:h-9 sm:w-[200px]">
          <Search
            size={16}
            className="shrink-0 text-[#99a1af]"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[12px]"
            style={mont}
          />
        </div>

        {/* Status filter */}
        <div className="relative min-w-0">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AgentStatus | "All")
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] pl-3 pr-9 text-[14px] font-medium text-[#6a7282] outline-none sm:h-9 sm:min-w-[120px] sm:text-[12px]"
            style={mont}
          >
            <option value="All">All</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Denied">Denied</option>
          </select>

          <Filter
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
          />
        </div>

        {/* Period */}
        <button
          type="button"
          className="flex h-11 min-w-0 items-center justify-between gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] font-medium text-[#6a7282] sm:h-9 sm:text-[12px]"
          style={mont}
        >
          <span className="truncate">Last Month</span>
          <ChevronDown
            size={16}
            className="shrink-0 text-[#99a1af]"
          />
        </button>
      </div>
    </div>
  </div>

  {/* Desktop and tablet table */}
  <div className="hidden overflow-x-auto sm:block">
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
              className={`px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] ${
                heading === "Status" || heading === "Actions"
                  ? "text-center"
                  : ""
              }`}
              style={mont}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              Loading agents…
            </td>
          </tr>
        ) : (
          filtered.map((agent) => {
            const mappedStatus = mapStatus(agent.status);
            const isActioned =
              mappedStatus === "Approved" || mappedStatus === "Denied";
            const isActioning = actioningId === agent.id;

            return (
              <tr
                key={agent.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-b-0 hover:bg-[#fcfcfd]"
              >
                <td className="w-[220px] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white"
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
                      className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86] hover:underline"
                      style={mont}
                    >
                      {agent.name}
                    </Link>
                  </div>
                </td>

                <td className="w-[172px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    {mapRole(agent.role)}
                  </span>
                </td>

                <td className="w-[200px] px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className="whitespace-nowrap text-[14px] text-[#0d2138]"
                      style={mont}
                    >
                      {agent.email}
                    </span>

                    <span
                      className="whitespace-nowrap text-[12px] text-[#6a7282]"
                      style={mont}
                    >
                      {agent.phone ?? "—"}
                    </span>
                  </div>
                </td>

                <td className="w-[136px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {agent.city ?? "—"}
                  </span>
                </td>

                <td className="w-[144px] px-4 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {formatDate(agent.createdAt)}
                  </span>
                </td>

                <td className="w-[144px] px-4 py-4 text-center">
                  <StatusBadge status={mappedStatus} />
                </td>

                <td className="w-[134px] px-4 py-4 text-center">
                  {isActioning ? (
                    <span
                      className="text-[14px] text-[#99a1af]"
                      style={mont}
                    >
                      Updating…
                    </span>
                  ) : isActioned ? (
                    <span
                      className="text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {mappedStatus}
                    </span>
                  ) : canApprove ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Approve"
                        aria-label={`Approve ${agent.name}`}
                        onClick={() => handleApprove(agent.id)}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#7bf1a8] bg-white transition-colors hover:bg-[#f5fffa]"
                      >
                        <Check size={14} className="text-[#00aa4f]" />
                      </button>

                      <button
                        type="button"
                        title="Deny"
                        aria-label={`Deny ${agent.name}`}
                        onClick={() => handleDeny(agent.id)}
                        className="flex size-8 items-center justify-center rounded-[8px] border border-[#ffa2a2] bg-white transition-colors hover:bg-[#fff5f5]"
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
          })
        )}

        {!loading && filtered.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              No agents found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile cards */}
  <div className="bg-[#f8fafc] p-3 sm:hidden">
    {loading ? (
      <div
        className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
        style={mont}
      >
        Loading agents…
      </div>
    ) : filtered.length === 0 ? (
      <div
        className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
        style={mont}
      >
        No agents found.
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        {filtered.map((agent) => {
          const mappedStatus = mapStatus(agent.status);
          const isActioned =
            mappedStatus === "Approved" || mappedStatus === "Denied";
          const isActioning = actioningId === agent.id;

          return (
            <article
              key={agent.id}
              className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              {/* Agent top details */}
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
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
                      className="block truncate text-[14px] font-semibold text-[#1e4f86] hover:underline"
                      style={mont}
                    >
                      {agent.name}
                    </Link>

                    <p
                      className="mt-1 truncate text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {mapRole(agent.role)}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={mappedStatus} />
                </div>
              </div>

              {/* Contact */}
              <div className="mx-4 rounded-[10px] bg-[#f8fafc] p-3">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Contact
                </p>

                <p
                  className="mt-1.5 break-all text-[14px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {agent.email}
                </p>

                <p
                  className="mt-1.5 text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {agent.phone ?? "Phone not available"}
                </p>
              </div>

              {/* Other details */}
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="min-w-0">
                  <p
                    className="text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    Location
                  </p>

                  <p
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {agent.city ?? "—"}
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
                    className="mt-1.5 truncate text-[14px] font-medium text-[#4b5563]"
                    style={mont}
                  >
                    {formatDate(agent.createdAt)}
                  </p>
                </div>
              </div>

              {/* Mobile actions */}
              <div className="border-t border-[#f3f4f6] p-4">
                {isActioning ? (
                  <div
                    className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    Updating…
                  </div>
                ) : isActioned ? (
                  <div
                    className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    Agent {mappedStatus}
                  </div>
                ) : canApprove ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(agent.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#7bf1a8] bg-[#f5fffa] text-[14px] font-semibold text-[#00aa4f] transition-colors active:scale-[0.99]"
                      style={mont}
                    >
                      <Check size={17} />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeny(agent.id)}
                      className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#ffa2a2] bg-[#fff5f5] text-[14px] font-semibold text-[#fb2c36] transition-colors active:scale-[0.99]"
                      style={mont}
                    >
                      <X size={17} />
                      Deny
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex h-11 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[14px] text-[#99a1af]"
                    style={mont}
                  >
                    No actions available
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    )}
  </div>

  {/* Footer */}
  <div className="border-t border-[#f3f4f6] bg-white px-4 py-4 sm:px-5 sm:py-3">
    <p
      className="text-center text-[14px] font-medium text-[#6a7282] sm:text-left sm:text-[12px]"
      style={mont}
    >
      Showing {filtered.length} of {agents.length} agents
    </p>
  </div>
</div>

      {showModal && <AddAgentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
