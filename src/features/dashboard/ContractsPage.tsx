"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Plus, Share2, Building2, TrendingUp, DollarSign, Banknote,
  Filter, MoreVertical, Pencil, Trash2, Loader2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ContractStatus } from "@/generated/prisma/enums";
import type { ContractDto } from "@/features/crm/types/crm-dto";
import type { ContractDraft } from "@/features/crm/opportunity-actions";
import { useDashboardContractsQuery } from "@/hooks/queries/useDashboardContractsQuery";
import {
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
  useCreateContractFromOpportunityMutation,
} from "@/hooks/mutations/useCrmMutations";
import { AddContractModal, type ContractFormValues } from "./components/AddContractModal";
import { ContractFilterPopover } from "./components/ContractFilterPopover";
import { SearchableSelect } from "./components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

/** Display label for the participants column/search — joins every named party. */
function participantsLabel(c: ContractDto): string {
  const names = c.participants.map((p) => p.contactName ?? p.companyName).filter((n): n is string => Boolean(n));
  return names.length ? names.join(", ") : "—";
}

/** Display label for the property column/search — joins every linked listing's title. */
function listingsLabel(c: ContractDto): string {
  const titles = c.listings.map((l) => l.propertyTitle).filter(Boolean);
  return titles.length ? titles.join(", ") : "—";
}

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
    <div className="flex-1 min-w-0 bg-white border border-[#f3f4f6] rounded-[14px] p-[18px] flex flex-col gap-6">
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

function fmtValue(n: number | null) {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US")}`;
}

// ── Row actions menu ──────────────────────────────────────────────────────────
// Rendered in a portal so it can't be clipped by the table's overflow-hidden /
// overflow-x-auto wrappers (which otherwise cut off the menu on the last row).
// Flips above the trigger when it would run past the bottom of the viewport.

function RowMenu({
  label,
  canDelete,
  onEdit,
  onDelete,
}: {
  label: string;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = canDelete ? 92 : 48;
    const gap = 6;
    const padding = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
    if (top + menuHeight > window.innerHeight - padding) top = rect.top - menuHeight - gap;
    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canDelete]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Actions"
        aria-label={`Open actions for ${label}`}
        aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen((v) => !v); }}
        className={`inline-flex size-8 items-center justify-center rounded-[8px] transition-colors ${
          open ? "bg-[#eff6ff] text-[#1e4f86]" : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        }`}
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] w-[160px] overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#0d2138] transition-colors hover:bg-[#f8fafc]"
              style={mont}
            >
              <Pencil size={14} className="text-[#1e4f86]" /> Edit
            </button>
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onDelete(); }}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#fb2c36] transition-colors hover:bg-[#fff1f2]"
                style={mont}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ContractsPage({
  role,
  currentUserId,
  currentUserName,
}: {
  role: Role;
  currentUserId: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState<ContractDto | "new" | null>(null);
  const [draft, setDraft] = useState<ContractDraft | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterPosition, setFilterPosition] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({
    left: 0, width: 520, maxHeight: 480,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "All">("All");

  // Popover is portaled + fixed-positioned (like RowMenu below) so the table
  // card's overflow-hidden can't clip it. Flips above the trigger when there
  // isn't enough room below.
  useLayoutEffect(() => {
    if (!showFilter) return;
    const updatePosition = () => {
      const button = filterButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const gap = 6;
      const padding = 8;
      const width = Math.min(520, window.innerWidth - padding * 2);
      let left = rect.right - width;
      if (left < padding) left = padding;
      if (left + width > window.innerWidth - padding) left = window.innerWidth - width - padding;

      const spaceBelow = window.innerHeight - rect.bottom - gap - padding;
      const spaceAbove = rect.top - gap - padding;
      if (spaceBelow >= 320 || spaceBelow >= spaceAbove) {
        setFilterPosition({ top: rect.bottom + gap, left, width, maxHeight: Math.max(200, spaceBelow) });
      } else {
        setFilterPosition({ bottom: window.innerHeight - rect.top + gap, left, width, maxHeight: Math.max(200, spaceAbove) });
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showFilter]);

  const { data, isLoading, isError } = useDashboardContractsQuery();
  const createMutation = useCreateContractMutation();
  const updateMutation = useUpdateContractMutation();
  const deleteMutation = useDeleteContractMutation();
  const draftMutation = useCreateContractFromOpportunityMutation();

  const canCreate = hasPermission(role, "contracts:create");
  const canDelete = hasPermission(role, "contracts:delete");
  // Roles without agents:view (AGENT) can't pick another agent — their
  // contracts are always assigned to themselves (enforced server-side too).
  const lockedAgent = hasPermission(role, "agents:view")
    ? null
    : { id: currentUserId, name: currentUserName };

  const contracts = useMemo(() => data?.contracts ?? [], [data]);
  const metrics = data?.metrics;

  // "Create Contract from Won Opportunity" deep link — fetch the pre-fill
  // draft, open the create modal with it, then strip the query param.
  useEffect(() => {
    const opportunityId = searchParams.get("fromOpportunity");
    if (!opportunityId) return;

    draftMutation.mutate(opportunityId, {
      onSuccess: (result) => {
        setDraft(result.draft);
        setEditing("new");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to prepare contract draft");
      },
      onSettled: () => router.replace("/dashboard/contracts"),
    });
    // Only run once per ?fromOpportunity= value — router.replace strips it after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter((c) => {
      const matchesSearch =
        !q ||
        c.contractId.toLowerCase().includes(q) ||
        listingsLabel(c).toLowerCase().includes(q) ||
        participantsLabel(c).toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  // Saves the contract and returns the persisted record so the modal can apply
  // its staged document uploads against the new id. The modal closes itself
  // after documents are handled (so files attach to a real contract, never an
  // orphan); returns null on failure to keep the modal open.
  async function handleSubmit(values: ContractFormValues): Promise<ContractDto | null> {
    const payload = {
      title: values.title || "Untitled Contract",
      type: values.type,
      status: values.status,
      participants: values.participants.map((row) =>
        row.role === "AGENCY"
          ? { role: row.role, companyName: row.companyName }
          : { role: row.role, contactId: row.contactId },
      ),
      propertyIds: values.propertyIds,
      assignedAgentId: values.assignedAgentId || undefined,
      opportunityId: values.opportunityId || undefined,
      value: values.value ? Number(values.value) : undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      terms: values.terms || undefined,
      notes: values.notes || undefined,
    };

    try {
      if (editing && editing !== "new") {
        const { contract } = await updateMutation.mutateAsync({ id: editing.id, body: payload });
        toast.success("Contract updated");
        return contract;
      }
      const { contract } = await createMutation.mutateAsync(payload);
      toast.success("Contract created");
      return contract;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save contract");
      return null;
    }
  }

  async function handleDelete(contract: ContractDto) {
    if (!confirm(`Delete contract "${contract.title}"? This can't be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(contract.id);
      toast.success("Contract deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contract");
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px]" style={poppins}>Contracts</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Manage and track all property contracts</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <button type="button" className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#99a1af] transition-colors hover:bg-[#f9fafb] sm:px-4" style={mont}>
            <Share2 size={16} className="shrink-0" /><span className="truncate">Export</span>
          </button>
          {canCreate && (
            <button type="button" onClick={() => { setDraft(undefined); setEditing("new"); }} className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:px-4" style={mont}>
              <Plus size={16} className="shrink-0" /><span className="truncate">Add Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 xl:grid-cols-4">
        <StatCard label="Total Contracts" value={isLoading ? "—" : String(metrics?.total ?? 0)} trend="Live from database" iconBg="#e0e7ff" icon={<Building2 size={18} strokeWidth={1.8} className="text-[#6366f1]" />} />
        <StatCard label="Active" value={isLoading ? "—" : String(metrics?.active ?? 0)} trend="Currently active" iconBg="#d1fae5" icon={<TrendingUp size={18} strokeWidth={1.8} className="text-[#10b981]" />} />
        <StatCard label="Pending" value={isLoading ? "—" : String(metrics?.pending ?? 0)} trend="Awaiting signature" iconBg="#fef3c7" icon={<DollarSign size={18} strokeWidth={1.8} className="text-[#f59e0b]" />} />
        <StatCard label="Total Value" value={isLoading ? "—" : fmtValue(metrics?.totalValue ?? null)} trend="Sum of all contracts" iconBg="#fff7ed" icon={<Banknote size={18} strokeWidth={1.8} className="text-[#f97316]" />} />
      </div>

      {/* Contracts table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]" style={mont}>All Contracts List</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] w-[204px]">
              <Search size={16} className="text-[#99a1af] shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contracts..." className="text-[14px] text-[#2b3038] placeholder:text-[#99a1af] bg-transparent outline-none w-full" style={mont} />
            </div>
            <SearchableSelect
              size="sm"
              searchable={false}
              value={statusFilter}
              onChange={(next) => setStatusFilter(next as ContractStatus | "All")}
              options={[
                { value: "All", label: "Status" },
                { value: ContractStatus.ACTIVE, label: "Active" },
                { value: ContractStatus.PENDING, label: "Pending" },
                { value: ContractStatus.COMPLETED, label: "Completed" },
                { value: ContractStatus.DRAFT, label: "Draft" },
                { value: ContractStatus.CANCELLED, label: "Cancelled" },
              ]}
              placeholder="Status"
              ariaLabel="Filter by status"
            />
            <div className="relative">
              <button ref={filterButtonRef} type="button" onClick={() => setShowFilter((v) => !v)} className="flex items-center gap-2 h-9 px-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] hover:bg-[#f3f4f6] transition-colors" style={mont}>
                Filter <Filter size={16} />
              </button>
              {showFilter &&
                createPortal(
                  <ContractFilterPopover
                    resultCount={filtered.length}
                    position={filterPosition}
                    onApply={() => setShowFilter(false)}
                    onClose={() => setShowFilter(false)}
                  />,
                  document.body,
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
                        <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{listingsLabel(contract)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{participantsLabel(contract)}</span>
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
                        <RowMenu
                          label={contract.title}
                          canDelete={canDelete}
                          onEdit={() => { setDraft(undefined); setEditing(contract); }}
                          onDelete={() => handleDelete(contract)}
                        />
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

      {editing && (
        <AddContractModal
          mode={editing === "new" ? "create" : "edit"}
          initial={editing === "new" ? undefined : editing}
          draft={editing === "new" ? draft : undefined}
          onClose={() => { setEditing(null); setDraft(undefined); }}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          lockedAgent={lockedAgent}
        />
      )}
    </div>
  );
}
