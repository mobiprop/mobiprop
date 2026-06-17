"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Share2, FileText, CheckCircle2, Clock,
  DollarSign, ChevronDown, Filter, MoreVertical, Loader2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ContractType, ContractStatus } from "@/generated/prisma/enums";
import type { ContractDto } from "@/features/crm/types/crm-dto";
import { useDashboardContractsQuery } from "@/hooks/queries/useDashboardContractsQuery";
import { useCreateContractMutation } from "@/hooks/mutations/useCrmMutations";
import { AddContractModal, type NewContract } from "./components/AddContractModal";
import { ContractFilterPopover } from "./components/ContractFilterPopover";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Badges ────────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  SALE:          { bg: "#fef3c6", text: "#bb4d00" },
  RENT:          { bg: "#dff2fe", text: "#0069a8" },
  SALE_AND_RENT: { bg: "#f8fafc", text: "#4b729e" },
};

const TYPE_LABEL: Record<string, string> = {
  SALE: "Sale", RENT: "Rent", SALE_AND_RENT: "Sale & Rent",
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  ACTIVE:    { bg: "#dcfce7", text: "#008236" },
  PENDING:   { bg: "#fef3c6", text: "#e17100" },
  COMPLETED: { bg: "#dff2fe", text: "#0069a8" },
  DRAFT:     { bg: "#f3f4f6", text: "#6b7280" },
  CANCELLED: { bg: "#fee2e2", text: "#dc2626" },
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active", PENDING: "Pending", COMPLETED: "Completed",
  DRAFT: "Draft", CANCELLED: "Cancelled",
};

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      className="inline-flex items-center justify-center px-3 py-1 rounded-[6px] text-[12px] font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: text, ...mont }}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value, trend, iconBg, icon }: {
  label: string; value: string; trend: string; iconBg: string; icon: React.ReactNode;
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
        <p className="text-[12px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

function fmtValue(n: number | null) {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ContractsPage({ role }: { role: Role }) {
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "All">("All");

  const { data, isLoading, isError } = useDashboardContractsQuery();
  const createMutation = useCreateContractMutation();

  const canCreate = hasPermission(role, "contracts:create");

  const contracts = useMemo(() => data?.contracts ?? [], [data]);
  const metrics = data?.metrics;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter((c) => {
      const matchesSearch =
        !q ||
        c.contractId.toLowerCase().includes(q) ||
        (c.propertyTitle ?? "").toLowerCase().includes(q) ||
        (c.contactName ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  async function handleCreate(input: NewContract) {
    const typeMap: Record<string, ContractType> = {
      Sale: ContractType.SALE,
      Rent: ContractType.RENT,
      "Sale & Rent": ContractType.SALE_AND_RENT,
    };
    const statusMap: Record<string, ContractStatus> = {
      Active: ContractStatus.ACTIVE,
      Pending: ContractStatus.PENDING,
      Completed: ContractStatus.COMPLETED,
    };

    try {
      await createMutation.mutateAsync({
        title: input.title || "Untitled Contract",
        type: typeMap[input.type] ?? ContractType.SALE,
        status: statusMap[input.status] ?? ContractStatus.ACTIVE,
        terms: input.terms || undefined,
      });
      toast.success("Contract created");
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contract");
    }
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
          <button type="button" className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f9fafb] transition-colors" style={mont}>
            <Share2 size={16} /> Export
          </button>
          {canCreate && (
            <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors" style={mont}>
              <Plus size={16} /> Add Contract
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total Contracts" value={isLoading ? "—" : String(metrics?.total ?? 0)} trend="Live from database" iconBg="#e0e7ff" icon={<FileText size={18} className="text-[#6366f1]" />} />
        <StatCard label="Active" value={isLoading ? "—" : String(metrics?.active ?? 0)} trend="Currently active" iconBg="#d1fae5" icon={<CheckCircle2 size={18} className="text-[#10b981]" />} />
        <StatCard label="Pending" value={isLoading ? "—" : String(metrics?.pending ?? 0)} trend="Awaiting signature" iconBg="#fef3c7" icon={<Clock size={18} className="text-[#f59e0b]" />} />
        <StatCard label="Total Value" value={isLoading ? "—" : fmtValue(metrics?.totalValue ?? null)} trend="Sum of all contracts" iconBg="#fff7ed" icon={<DollarSign size={18} className="text-[#f97316]" />} />
      </div>

      {/* Contracts table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Contracts List</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contracts..." className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full" style={mont} />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "All")}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="All">Status</option>
                <option value={ContractStatus.ACTIVE}>Active</option>
                <option value={ContractStatus.PENDING}>Pending</option>
                <option value={ContractStatus.COMPLETED}>Completed</option>
                <option value={ContractStatus.DRAFT}>Draft</option>
                <option value={ContractStatus.CANCELLED}>Cancelled</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowFilter((v) => !v)} className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors" style={mont}>
                Filter <Filter size={16} />
              </button>
              {showFilter && (
                <ContractFilterPopover resultCount={filtered.length} onApply={() => setShowFilter(false)} onClose={() => setShowFilter(false)} />
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[14px]" style={mont}>Loading contracts…</span>
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-[14px] text-red-500" style={mont}>Failed to load contracts.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <th className="px-6 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Contract ID</th>
                  <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Title</th>
                  <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Property</th>
                  <th className="px-5 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Contact</th>
                  <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Type</th>
                  <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left" style={mont}>Value</th>
                  <th className="px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-center" style={mont}>Status</th>
                  <th className="w-[62px]" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((contract: ContractDto) => {
                  const typeStyle = TYPE_STYLE[contract.type] ?? TYPE_STYLE.SALE;
                  const statusStyle = STATUS_STYLE[contract.status] ?? STATUS_STYLE.DRAFT;
                  return (
                    <tr key={contract.id} className="border-b border-[#e5e7eb] last:border-b-0">
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>{contract.contractId}</span>
                      </td>
                      <td className="px-4 py-[18px]">
                        <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{contract.title}</span>
                      </td>
                      <td className="px-4 py-[18px]">
                        <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{contract.propertyTitle ?? "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{contract.contactName ?? "—"}</span>
                      </td>
                      <td className="px-4 py-[18px]">
                        <Badge label={TYPE_LABEL[contract.type] ?? contract.type} bg={typeStyle.bg} text={typeStyle.text} />
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>{fmtValue(contract.value)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge label={STATUS_LABEL[contract.status] ?? contract.status} bg={statusStyle.bg} text={statusStyle.text} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button type="button" title="Actions" className="inline-flex items-center justify-center text-[#6a7282] hover:text-[#0d2138] transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                      {contracts.length === 0 ? "No contracts yet — add your first contract." : "No contracts match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {contracts.length} contracts
          </span>
        </div>
      </div>

      {showModal && (
        <AddContractModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          isSaving={createMutation.isPending}
        />
      )}
    </div>
  );
}
