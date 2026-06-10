"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Share2,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronDown,
  Filter,
  MoreVertical,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import {
  AddContractModal,
  type NewContract,
  type ContractType,
  type ContractStatus,
} from "./components/AddContractModal";
import { ContractFilterPopover } from "./components/ContractFilterPopover";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Types ─────────────────────────────────────────────────────────────────────

type MockContract = {
  id: number;
  contractId: string;
  property: string;
  customer: string;
  type: ContractType;
  value: string;
  status: ContractStatus;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONTRACTS: MockContract[] = [
  { id: 1, contractId: "CON-2025-001", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale",        value: "$625,000", status: "Active"    },
  { id: 2, contractId: "CON-2025-002", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Rent",        value: "$625,000", status: "Pending"   },
  { id: 3, contractId: "CON-2025-003", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale",        value: "$625,000", status: "Completed" },
  { id: 4, contractId: "CON-2025-004", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale",        value: "$625,000", status: "Active"    },
  { id: 5, contractId: "CON-2025-005", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale & Rent", value: "$625,000", status: "Pending"   },
  { id: 6, contractId: "CON-2025-006", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale",        value: "$625,000", status: "Active"    },
  { id: 7, contractId: "CON-2025-007", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Rent",        value: "$625,000", status: "Completed" },
  { id: 8, contractId: "CON-2025-008", property: "Sierra Lakeview Estate", customer: "Robert Johnson", type: "Sale",        value: "$625,000", status: "Active"    },
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
        <p className="text-[12px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ContractType, { bg: string; text: string }> = {
  Sale:          { bg: "#fef3c6", text: "#bb4d00" },
  Rent:          { bg: "#dff2fe", text: "#0069a8" },
  "Sale & Rent": { bg: "#f8fafc", text: "#4b729e" },
};

const STATUS_STYLE: Record<ContractStatus, { bg: string; text: string }> = {
  Active:    { bg: "#dcfce7", text: "#008236" },
  Pending:   { bg: "#fef3c6", text: "#e17100" },
  Completed: { bg: "#dff2fe", text: "#0069a8" },
};

function Badge({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text, ...mont }}
    >
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ContractsPageProps = {
  role: Role;
};

export function ContractsPage({ role }: ContractsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "All">("All");
  const [contracts, setContracts] = useState<MockContract[]>(MOCK_CONTRACTS);

  const canCreate = hasPermission(role, "contracts:create");

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      !search ||
      c.contractId.toLowerCase().includes(search.toLowerCase()) ||
      c.property.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleCreate(input: NewContract) {
    setContracts((prev) => [
      {
        id: Math.max(0, ...prev.map((c) => c.id)) + 1,
        contractId: `CON-2025-${String(prev.length + 1).padStart(3, "0")}`,
        property: input.listing || input.title || "—",
        customer: input.participants[0]?.name ?? "—",
        type: input.type,
        value: "$0",
        status: input.status,
      },
      ...prev,
    ]);
    setShowModal(false);
  }

  function handleApplyFilters() {
    // Filters are UI-only for now; wire to the query layer when /api/contracts exists.
    setShowFilter(false);
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-medium text-[#0d2138] leading-[32px]" style={poppins}>Contracts</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage and track all property contracts</p>
        </div>
        <div className="flex items-center gap-3">
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
              Add Contract
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard
          label="Total Contracts"
          value={String(contracts.length)}
          trend="↑ 2 new this month"
          iconBg="#e0e7ff"
          icon={<FileText size={18} className="text-[#6366f1]" />}
        />
        <StatCard
          label="Active"
          value={String(contracts.filter((c) => c.status === "Active").length)}
          trend="↑ +12.5% from last month"
          iconBg="#d1fae5"
          icon={<CheckCircle2 size={18} className="text-[#10b981]" />}
        />
        <StatCard
          label="Pending"
          value={String(contracts.filter((c) => c.status === "Pending").length)}
          trend="↑ +18.2% from last month"
          iconBg="#fef3c7"
          icon={<Clock size={18} className="text-[#f59e0b]" />}
        />
        <StatCard
          label="Total Value"
          value="$4.5M"
          trend="↑ +0.3 from last month"
          iconBg="#fff7ed"
          icon={<DollarSign size={18} className="text-[#f97316]" />}
        />
      </div>

      {/* Contracts table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Table header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Contracts List</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contracts..."
                className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full"
                style={mont}
              />
            </div>
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "All")}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            {/* Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
                style={mont}
              >
                Filter
                <Filter size={16} />
              </button>
              {showFilter && (
                <ContractFilterPopover
                  resultCount={filtered.length}
                  onApply={handleApplyFilters}
                  onClose={() => setShowFilter(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <th className="px-6 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[204px]" style={mont}>Contract ID</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[232px]" style={mont}>Property</th>
                <th className="px-5 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[209px]" style={mont}>Customer</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[118px]" style={mont}>Type</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left w-[146px]" style={mont}>Value</th>
                <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-center w-[159px]" style={mont}>Status</th>
                <th className="w-[62px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contract) => (
                <tr key={contract.id} className="border-b border-[#e5e7eb] last:border-b-0">
                  {/* Contract ID */}
                  <td className="px-6 py-4 w-[204px]">
                    <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{contract.contractId}</span>
                  </td>
                  {/* Property */}
                  <td className="px-4 py-[18px] w-[232px]">
                    <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>{contract.property}</span>
                  </td>
                  {/* Customer */}
                  <td className="px-5 py-4 w-[209px]">
                    <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{contract.customer}</span>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-[18px] w-[118px]">
                    <Badge label={contract.type} style={TYPE_STYLE[contract.type]} />
                  </td>
                  {/* Value */}
                  <td className="px-4 py-6 w-[146px]">
                    <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>{contract.value}</span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4 w-[159px] text-center">
                    <Badge label={contract.status} style={STATUS_STYLE[contract.status]} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-4 w-[62px] text-center">
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
                    No contracts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {contracts.length} contracts
          </span>
        </div>
      </div>

      {showModal && (
        <AddContractModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
