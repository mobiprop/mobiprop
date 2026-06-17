"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ContactType } from "@/generated/prisma/enums";
import type { ContactDto } from "@/features/crm/types/crm-dto";
import { useDashboardContactsQuery } from "@/hooks/queries/useDashboardContactsQuery";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "@/hooks/mutations/useCrmMutations";
import { AddContactModal, type NewContact } from "./components/AddContactModal";
import { EditContactModal, type EditContactInput } from "./components/EditContactModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

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

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  BUYER:  { bg: "#dcfce7", text: "#008236" },
  SELLER: { bg: "#b8e6fe", text: "#0069a8" },
  BOTH:   { bg: "#fef3c7", text: "#b45309" },
};

const TYPE_LABEL: Record<string, string> = {
  BUYER: "Buyer", SELLER: "Seller", BOTH: "Both",
};

function TypeBadge({ type }: { type: ContactType }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.BUYER;
  return (
    <span
      className="inline-flex items-center justify-center w-[76px] px-3 py-1 rounded-[6px] text-[12px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

// ── Row action menu ───────────────────────────────────────────────────────────

type RowMenuProps = {
  contact: ContactDto;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function RowMenu({ contact, canEdit, canDelete, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!canEdit && !canDelete) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center text-[#6a7282] hover:text-[#0d2138] transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-white border border-[#e5e7eb] rounded-[12px] shadow-lg w-[160px] py-1.5 overflow-hidden">
          {canEdit && (
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#0d2138] hover:bg-[#f8fafc] transition-colors"
              style={mont}
            >
              <Pencil size={14} className="text-[#1e4f86]" />
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#fb2c36] hover:bg-[#fff1f2] transition-colors"
              style={mont}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

type DeleteConfirmProps = {
  contact: ContactDto;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConfirmModal({ contact, isDeleting, onCancel, onConfirm }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[420px] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="size-12 rounded-full bg-[#fff1f2] flex items-center justify-center">
            <AlertTriangle size={22} className="text-[#fb2c36]" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Delete Contact</p>
            <p className="text-[13px] text-[#6a7282] leading-5" style={mont}>
              <span className="font-semibold text-[#0d2138]">{contact.fullName}</span> will be marked as deleted
              and removed from all lists. This can be restored by an administrator.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 border border-[#e5e7eb] rounded-[10px] text-[13px] font-medium text-[#6b7280] bg-[#f8fafc] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex-1 h-10 bg-[#fb2c36] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#e0262f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ContactsPageProps = {
  role: Role;
};

export function ContactsPage({ role }: ContactsPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDto | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactDto | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "All">("All");
  const [sortBy, setSortBy] = useState<"default" | "name" | "listings">("default");

  const { data, isLoading, isError } = useDashboardContactsQuery();
  const createMutation = useCreateContactMutation();
  const updateMutation = useUpdateContactMutation();
  const deleteMutation = useDeleteContactMutation();

  const canCreate = hasPermission(role, "contacts:create");
  const canEdit   = hasPermission(role, "contacts:update");
  const canDelete = hasPermission(role, "contacts:delete");

  const contacts = useMemo(() => data?.contacts ?? [], [data]);
  const metrics = data?.metrics;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts
      .filter((c) => {
        const matchesSearch =
          !q ||
          c.fullName.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.location ?? "").toLowerCase().includes(q) ||
          c.contactId.toLowerCase().includes(q);
        const matchesType = typeFilter === "All" || c.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
        if (sortBy === "listings") return b.properties.length - a.properties.length;
        return 0;
      });
  }, [contacts, search, typeFilter, sortBy]);

  async function handleCreate(input: NewContact) {
    try {
      await createMutation.mutateAsync({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        type: input.contactType === "Seller" ? ContactType.SELLER : ContactType.BUYER,
        location: input.location,
        address: input.address,
        notes: input.notes,
      });
      toast.success("Contact created");
      setShowAddModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  async function handleUpdate(id: string, input: EditContactInput) {
    try {
      await updateMutation.mutateAsync({ id, body: input });
      toast.success("Contact updated");
      setEditingContact(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update contact");
    }
  }

  async function handleDelete() {
    if (!deletingContact) return;
    try {
      await deleteMutation.mutateAsync(deletingContact.id);
      toast.success("Contact deleted");
      setDeletingContact(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact");
    }
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
              onClick={() => setShowAddModal(true)}
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
          value={isLoading ? "—" : String(metrics?.total ?? 0)}
          trend="Live from database"
          iconBg="#e0e7ff"
          icon={<Users size={18} className="text-[#6366f1]" />}
        />
        <StatCard
          label="Buyers"
          value={isLoading ? "—" : String(metrics?.buyers ?? 0)}
          trend="Contacts looking to purchase"
          iconBg="#d1fae5"
          icon={<TrendingUp size={18} className="text-[#10b981]" />}
        />
        <StatCard
          label="Sellers"
          value={isLoading ? "—" : String(metrics?.sellers ?? 0)}
          trend="Contacts with properties"
          iconBg="#fef3c7"
          icon={<DollarSign size={18} className="text-[#f59e0b]" />}
        />
        <StatCard
          label="With Listings"
          value={isLoading ? "—" : String(metrics?.withListings ?? 0)}
          trend="Contacts linked to properties"
          iconBg="#fee2e2"
          icon={<Briefcase size={18} className="text-[#ef4444]" />}
        />
      </div>

      {/* Contacts table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Table controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={mont}>All Contacts</h2>
          <div className="flex items-center gap-3">
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
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ContactType | "All")}
                className="h-9 pl-4 pr-9 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] text-[14px] font-medium text-[#99a1af] appearance-none outline-none cursor-pointer"
                style={mont}
              >
                <option value="All">Contact Type</option>
                <option value={ContactType.BUYER}>Buyer</option>
                <option value={ContactType.SELLER}>Seller</option>
                <option value={ContactType.BOTH}>Both</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading / error / table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[#6a7282]">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[14px]" style={mont}>Loading contacts…</span>
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-[14px] text-red-500" style={mont}>
            Failed to load contacts.
          </div>
        ) : (
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
                {filtered.map((contact: ContactDto) => (
                  <tr key={contact.id} className="border-b border-[#e5e7eb] last:border-b-0">
                    <td className="px-6 py-4 w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={mont}>
                          {contact.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-medium text-[#1e4f86] whitespace-nowrap" style={mont}>
                          {contact.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-[14px] w-[224px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>
                          {contact.email ?? "—"}
                        </span>
                        <span className="text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>
                          {contact.phone ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-[18px] w-[200px]">
                      <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>
                        {contact.location ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-[18px] w-[156px]">
                      <span className="text-[14px] font-semibold text-[#4896b6]" style={mont}>
                        {contact.properties.length}
                      </span>
                    </td>
                    <td className="px-4 py-6 w-[160px]">
                      <span className="text-[14px] font-semibold text-[#4896b6]" style={mont}>
                        {contact.contactId}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-[120px] text-center">
                      <TypeBadge type={contact.type} />
                    </td>
                    <td className="px-4 py-4 w-[55px] text-center">
                      <RowMenu
                        contact={contact}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onEdit={() => setEditingContact(contact)}
                        onDelete={() => setDeletingContact(contact)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                      {contacts.length === 0 ? "No contacts yet — add your first contact." : "No contacts match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Showing {filtered.length} of {contacts.length} contacts
          </span>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
          isSaving={createMutation.isPending}
        />
      )}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleUpdate}
          isSaving={updateMutation.isPending}
        />
      )}
      {deletingContact && (
        <DeleteConfirmModal
          contact={deletingContact}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeletingContact(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
