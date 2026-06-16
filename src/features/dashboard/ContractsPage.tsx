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
        <p className="text-[14px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
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
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[14px] font-medium whitespace-nowrap"
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
  <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1
          className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px] sm:leading-[32px]"
          style={poppins}
        >
          Contracts
        </h1>

        <p
          className="text-[14px] font-medium leading-5 text-[#6a7282] sm:text-[14px]"
          style={mont}
        >
          Manage and track all property contracts
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
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
            className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:px-4 sm:text-[14px]"
            style={mont}
          >
            <Plus size={16} className="shrink-0" />
            <span className="truncate">Add Contract</span>
          </button>
        )}
      </div>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
      <StatCard
        label="Total Contracts"
        value={String(contracts.length)}
        trend="↑ 2 new this month"
        iconBg="#e0e7ff"
        icon={<FileText size={18} className="text-[#6366f1]" />}
      />

      <StatCard
        label="Active"
        value={String(
          contracts.filter((contract) => contract.status === "Active").length,
        )}
        trend="↑ +12.5% from last month"
        iconBg="#d1fae5"
        icon={<CheckCircle2 size={18} className="text-[#10b981]" />}
      />

      <StatCard
        label="Pending"
        value={String(
          contracts.filter((contract) => contract.status === "Pending").length,
        )}
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
    <div className="overflow-hidden rounded-[14px] border border-[#f3f4f6] bg-white">
      {/* Table header / controls */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2
          className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          All Contracts List
        </h2>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
          {/* Search */}
          <div className="col-span-2 flex h-9 min-w-0 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 sm:col-span-1 sm:w-[204px]">
            <Search size={16} className="shrink-0 text-[#99a1af]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contracts..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[14px]"
              style={mont}
            />
          </div>

          {/* Status */}
          <div className="relative min-w-0">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ContractStatus | "All",
                )
              }
              className="h-9 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] pl-3 pr-8 text-[14px] font-medium text-[#99a1af] outline-none sm:w-auto sm:pl-4 sm:pr-9 sm:text-[14px]"
              style={mont}
            >
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af]"
            />
          </div>

          {/* Filter */}
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setShowFilter((value) => !value)}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] font-medium text-[#99a1af] transition-colors hover:bg-[#f3f4f6] sm:w-auto sm:px-4 sm:text-[14px]"
              style={mont}
            >
              Filter
              <Filter size={16} className="shrink-0" />
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

      {/* Tablet and desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th
                className="w-[204px] px-6 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Contract ID
              </th>

              <th
                className="w-[232px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Property
              </th>

              <th
                className="w-[209px] px-5 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Customer
              </th>

              <th
                className="w-[118px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Type
              </th>

              <th
                className="w-[146px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Value
              </th>

              <th
                className="w-[159px] px-4 py-[10px] text-center text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                style={mont}
              >
                Status
              </th>

              <th className="w-[62px]" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((contract) => (
              <tr
                key={contract.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-b-0 hover:bg-[#fcfcfd]"
              >
                {/* Contract ID */}
                <td className="w-[204px] px-6 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86] lg:text-[14px]"
                    style={mont}
                  >
                    {contract.contractId}
                  </span>
                </td>

                {/* Property */}
                <td className="w-[232px] px-4 py-[18px]">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                    style={mont}
                  >
                    {contract.property}
                  </span>
                </td>

                {/* Customer */}
                <td className="w-[209px] px-5 py-4">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#0d2138] lg:text-[14px]"
                    style={mont}
                  >
                    {contract.customer}
                  </span>
                </td>

                {/* Type */}
                <td className="w-[118px] px-4 py-[18px]">
                  <Badge
                    label={contract.type}
                    style={TYPE_STYLE[contract.type]}
                  />
                </td>

                {/* Value */}
                <td className="w-[146px] px-4 py-6">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282] lg:text-[14px]"
                    style={mont}
                  >
                    {contract.value}
                  </span>
                </td>

                {/* Status */}
                <td className="w-[159px] px-4 py-4 text-center">
                  <Badge
                    label={contract.status}
                    style={STATUS_STYLE[contract.status]}
                  />
                </td>

                {/* Actions */}
                <td className="w-[62px] px-4 py-4 text-center">
                  <button
                    type="button"
                    title="Actions"
                    aria-label={`Actions for ${contract.contractId}`}
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
                  No contracts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile contract cards */}
      <div className="flex flex-col md:hidden">
        {filtered.map((contract) => (
          <div
            key={contract.id}
            className="border-t border-[#e5e7eb] p-4 first:border-t-0"
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Contract ID
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#1e4f86]"
                  style={mont}
                >
                  {contract.contractId}
                </p>
              </div>

              <button
                type="button"
                title="Actions"
                aria-label={`Actions for ${contract.contractId}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Contract details */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 min-w-0">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Property
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#6a7282]"
                  style={mont}
                >
                  {contract.property}
                </p>
              </div>

              <div className="col-span-2 min-w-0">
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Customer
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#0d2138]"
                  style={mont}
                >
                  {contract.customer}
                </p>
              </div>

              <div>
                <p
                  className="mb-1.5 text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Type
                </p>

                <Badge
                  label={contract.type}
                  style={TYPE_STYLE[contract.type]}
                />
              </div>

              <div>
                <p
                  className="text-[14px] text-[#99a1af]"
                  style={mont}
                >
                  Value
                </p>

                <p
                  className="mt-1 text-[14px] font-medium text-[#6a7282]"
                  style={mont}
                >
                  {contract.value}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center justify-between border-t border-[#f3f4f6] pt-3">
              <span
                className="text-[14px] text-[#99a1af]"
                style={mont}
              >
                Status
              </span>

              <Badge
                label={contract.status}
                style={STATUS_STYLE[contract.status]}
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="border-t border-[#e5e7eb] px-4 py-10">
            <p
              className="text-center text-[14px] text-[#6a7282]"
              style={mont}
            >
              No contracts found.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#f3f4f6] px-4 py-3 sm:px-5">
        <span
          className="text-[14px] font-medium text-[#6a7282] sm:text-[12px]"
          style={mont}
        >
          Showing {filtered.length} of {contracts.length} contracts
        </span>
      </div>
    </div>

    {showModal && (
      <AddContractModal
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    )}
  </div>
);
}
