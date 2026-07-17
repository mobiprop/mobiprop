"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
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
import { useDashboardOpportunitiesQuery } from "@/hooks/queries/useDashboardOpportunitiesQuery";
import { useLeadMetricsQuery } from "@/hooks/queries/useDashboardLeadsQuery";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useImportContactsMutation,
  ContactConflictError,
} from "@/hooks/mutations/useCrmMutations";
import { AddContactModal, type NewContact } from "./components/AddContactModal";
import { EditContactModal, type EditContactInput } from "./components/EditContactModal";
import { SearchableSelect } from "./components/SearchableSelect";
import { toCsv, downloadCsv, parseCsv, csvRowsToObjects } from "@/lib/csv";

const CONTACT_TYPE_MAP: Record<NewContact["contactType"], ContactType> = {
  Buyer: ContactType.BUYER,
  Seller: ContactType.SELLER,
  Both: ContactType.BOTH,
};

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  /** Positive-trend callout (green, with an up arrow). Omit when there's no real trend to show. */
  trend?: string;
  /** Plain explanatory subtext, shown when `trend` isn't provided. */
  note?: string;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, trend, note, iconBg, icon }: StatCardProps) {
  return (
    <article className="flex min-h-[154px] min-w-0 flex-col justify-between rounded-[14px] border border-[#edf0f4] bg-white p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="flex items-start justify-between gap-5">
        <p
          className="max-w-[180px] text-[15px] font-medium leading-5 text-[#6a7282]"
          style={mont}
        >
          {label}
        </p>

        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-[11px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p
          className="text-[25px] font-semibold leading-[30px] tracking-[-0.35px] text-[#0d2138]"
          style={poppins}
        >
          {value}
        </p>

        {trend ? (
          <p
            className="flex items-center gap-1 text-[13px] font-medium leading-5 text-[#00c950]"
            style={mont}
          >
            <span aria-hidden="true">↑</span>
            <span>{trend}</span>
          </p>
        ) : note ? (
          <p className="text-[13px] font-medium leading-5 text-[#6a7282]" style={mont}>
            {note}
          </p>
        ) : null}
      </div>
    </article>
  );
}

// ── Contact type badge ────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  BUYER:  { bg: "#dcfce7", text: "#008236" },
  SELLER: { bg: "#b8e6fe", text: "#0069a8" },
  BOTH:   { bg: "#fef3c7", text: "#b45309" },
};

// English labels kept for CSV export (see handleExport) — exported file
// content stays untranslated regardless of UI language.
const TYPE_LABEL: Record<string, string> = {
  BUYER: "Buyer", SELLER: "Seller", BOTH: "Both",
};

const TYPE_I18N_KEY: Record<string, string> = {
  BUYER: "type.buyer", SELLER: "type.seller", BOTH: "type.both",
};

function TypeBadge({ type, t }: { type: ContactType; t: (key: string) => string }) {
  const s = TYPE_STYLE[type] ?? TYPE_STYLE.BUYER;
  return (
    <span
      className="inline-flex items-center justify-center w-[76px] px-3 py-1 rounded-[6px] text-[14px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {TYPE_I18N_KEY[type] ? t(TYPE_I18N_KEY[type]) : type}
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
  t: (key: string, opts?: Record<string, unknown>) => string;
};

function RowMenu({
  contact,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  t,
}: RowMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = canEdit && canDelete ? 92 : 48;
    const gap = 6;
    const padding = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    if (left < padding) {
      left = padding;
    }

    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }

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
  }, [open, canEdit, canDelete]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={t("rowMenu.actionsTitle")}
        aria-label={t("rowMenu.openActionsAria", { name: contact.fullName })}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={`inline-flex size-8 items-center justify-center rounded-[8px] transition-colors ${
          open
            ? "bg-[#eff6ff] text-[#1e4f86]"
            : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        }`}
      >
        <MoreVertical size={17} strokeWidth={1.8} />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] w-[160px] overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {canEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#0d2138] transition-colors hover:bg-[#f8fafc]"
                style={mont}
              >
                <Pencil size={14} className="text-[#1e4f86]" />
                {t("rowMenu.edit")}
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#fb2c36] transition-colors hover:bg-[#fff1f2]"
                style={mont}
              >
                <Trash2 size={14} />
                {t("rowMenu.delete")}
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

type DeleteConfirmProps = {
  contact: ContactDto;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

function DeleteConfirmModal({ contact, isDeleting, onCancel, onConfirm, t }: DeleteConfirmProps) {
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
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>{t("deleteModal.title")}</p>
            <p className="text-[13px] text-[#6a7282] leading-5" style={mont}>
              {(() => {
                const body = t("deleteModal.body", { name: contact.fullName });
                const idx = body.indexOf(contact.fullName);
                if (idx === -1) return body;
                return (
                  <>
                    {body.slice(0, idx)}
                    <span className="font-semibold text-[#0d2138]">{contact.fullName}</span>
                    {body.slice(idx + contact.fullName.length)}
                  </>
                );
              })()}
            </p>
          </div>
          <div className="flex gap-3 w-full pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 border border-[#e5e7eb] rounded-[10px] text-[13px] font-medium text-[#6b7280] bg-[#f8fafc] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              {t("deleteModal.cancel")}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex-1 h-10 bg-[#fb2c36] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#e0262f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isDeleting ? t("deleteModal.deleting") : t("deleteModal.delete")}
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

type ConflictState = { message: string; existingContactId: string };

export function ContactsPage({ role }: ContactsPageProps) {
  const { t } = useTranslation("contacts");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactDto | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactDto | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "All">("All");
  const [sortBy, setSortBy] = useState<"default" | "name" | "listings">("default");
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useDashboardContactsQuery();
  const opportunitiesQuery = useDashboardOpportunitiesQuery();
  const leadMetricsQuery = useLeadMetricsQuery();
  const createMutation = useCreateContactMutation();
  const updateMutation = useUpdateContactMutation();
  const deleteMutation = useDeleteContactMutation();
  const importMutation = useImportContactsMutation();

  const canCreate = hasPermission(role, "contacts:create");
  const canEdit   = hasPermission(role, "contacts:update");
  const canDelete = hasPermission(role, "contacts:archive");
  const canExport = hasPermission(role, "contacts:export");
  const canImport = hasPermission(role, "contacts:import");

  const contacts = useMemo(() => data?.contacts ?? [], [data]);

  const activeDealsCount = opportunitiesQuery.data?.metrics.open;
  const contactsInOpportunitiesPct = data
    ? data.metrics.total > 0
      ? `${Math.round((data.metrics.withOpportunities / data.metrics.total) * 100)}%`
      : "0%"
    : null;

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
    setConflict(null);
    try {
      await createMutation.mutateAsync({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        type: CONTACT_TYPE_MAP[input.contactType],
        location: input.location,
        address: input.address,
        notes: input.notes,
        propertyIds: input.propertyIds,
      });
      toast.success(t("toasts.contactCreated"));
      setShowAddModal(false);
    } catch (err) {
      if (err instanceof ContactConflictError) {
        setConflict({ message: err.message, existingContactId: err.existingContact.id });
        return;
      }
      toast.error(err instanceof Error ? err.message : t("toasts.createFailed"));
    }
  }

  async function handleUpdate(id: string, input: EditContactInput) {
    try {
      await updateMutation.mutateAsync({ id, body: input });
      toast.success(t("toasts.contactUpdated"));
      setEditingContact(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.updateFailed"));
    }
  }

  async function handleDelete() {
    if (!deletingContact) return;
    try {
      await deleteMutation.mutateAsync(deletingContact.id);
      toast.success(t("toasts.contactDeleted"));
      setDeletingContact(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.deleteFailed"));
    }
  }

  function handleExport() {
    const header = [
      "Contact ID", "First Name", "Last Name", "Email", "Phone",
      "Type", "Location", "Address", "Notes", "Listings", "Created At",
    ];
    const rows = filtered.map((c) => [
      c.contactId,
      c.firstName,
      c.lastName,
      c.email ?? "",
      c.phone ?? "",
      TYPE_LABEL[c.type] ?? c.type,
      c.location ?? "",
      c.address ?? "",
      c.notes ?? "",
      c.properties.length,
      new Date(c.createdAt).toLocaleDateString("en-US"),
    ]);
    downloadCsv(`contacts-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows));
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  const IMPORT_HEADER_ALIASES: Record<string, string> = {
    firstname: "firstName",
    first: "firstName",
    lastname: "lastName",
    last: "lastName",
    email: "email",
    emailaddress: "email",
    phone: "phone",
    phonenumber: "phone",
    type: "type",
    contacttype: "type",
    location: "location",
    address: "address",
    notes: "notes",
  };

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    try {
      const text = await file.text();
      const records = csvRowsToObjects(parseCsv(text));
      if (records.length === 0) {
        toast.error(t("toasts.importNoDataRows"));
        return;
      }

      const rows = records.map((record) => {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(record)) {
          const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
          const field = IMPORT_HEADER_ALIASES[normalized];
          if (field) mapped[field] = value;
        }
        return mapped;
      });

      const result = await importMutation.mutateAsync(rows);
      if (result.created > 0) {
        toast.success(t("toasts.importedCount", { count: result.created }));
      }
      if (result.skipped > 0) {
        const preview = result.errors.slice(0, 3).map((e) => `Row ${e.row}: ${e.message}`).join(" · ");
        toast.warning(t("toasts.skippedCount", { count: result.skipped }), {
          description: preview + (result.errors.length > 3 ? " …" : ""),
        });
      }
      if (result.created === 0 && result.skipped === 0) {
        toast.error(t("toasts.importNothing"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.importFailed"));
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium leading-7 text-[#0d2138] sm:text-[20px]" style={poppins}>{t("page.title")}</h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>{t("page.subtitle")}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          {canImport && (
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importMutation.isPending}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#4a5565] transition-colors hover:bg-[#f9fafb] disabled:opacity-60 sm:px-4"
              style={mont}
            >
              {importMutation.isPending ? (
                <Loader2 size={16} className="shrink-0 animate-spin" />
              ) : (
                <Upload size={16} className="shrink-0" />
              )}
              <span className="truncate">{t("actions.import")}</span>
            </button>
          )}
          {canExport && (
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#4a5565] transition-colors hover:bg-[#f9fafb] disabled:opacity-60 sm:px-4"
              style={mont}
            >
              <Share2 size={16} className="shrink-0" />
              <span className="truncate">{t("actions.export")}</span>
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="col-span-2 flex h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-span-1 sm:px-4"
              style={mont}
            >
              <Plus size={16} className="shrink-0" />
              <span className="truncate">{t("actions.addContact")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.totalContacts")}
          value={isLoading ? "—" : String(data?.metrics.total ?? 0)}
          note={data ? [
            data.metrics.buyers > 0 && t("stats.buyersCount", { count: data.metrics.buyers }),
            data.metrics.sellers > 0 && t("stats.sellersCount", { count: data.metrics.sellers }),
            data.metrics.both > 0 && t("stats.bothCount", { count: data.metrics.both }),
          ].filter(Boolean).join(" · ") : undefined}
          iconBg="#e8ebff"
          icon={
            <Building2
              size={19}
              strokeWidth={1.8}
              className="text-[#6677f6]"
            />
          }
        />

        <StatCard
          label={t("stats.activeDeals")}
          value={opportunitiesQuery.isLoading ? "—" : String(activeDealsCount ?? 0)}
          note={t("stats.openOpportunities")}
          iconBg="#d9faec"
          icon={
            <TrendingUp
              size={19}
              strokeWidth={1.8}
              className="text-[#16c98d]"
            />
          }
        />

        <StatCard
          label={t("stats.contactsVsLeads")}
          value={
            isLoading || leadMetricsQuery.isLoading
              ? "—"
              : `${data?.metrics.total ?? 0} / ${leadMetricsQuery.data?.total ?? 0}`
          }
          note={t("stats.contactsVsLeadsNote")}
          iconBg="#fff1c8"
          icon={
            <Users
              size={19}
              strokeWidth={1.8}
              className="text-[#f59e0b]"
            />
          }
        />

        <StatCard
          label={t("stats.contactsInOpportunities")}
          value={contactsInOpportunitiesPct ?? "—"}
          note={data ? t("stats.contactsInOpportunitiesNote", { withOpportunities: data.metrics.withOpportunities, total: data.metrics.total }) : undefined}
          iconBg="#fee2e2"
          icon={
            <TrendingDown
              size={19}
              strokeWidth={1.8}
              className="text-[#ff5a64]"
            />
          }
        />
      </div>

      {/* Contacts table */}
      <div className="min-w-0 rounded-[14px] border border-[#f3f4f6] bg-white">
  {/* Table controls */}
  <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
    <h2
      className="text-[14px] font-semibold text-[#0d2138] sm:text-[16px]"
      style={mont}
    >
      {t("table.title")}
    </h2>

    <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:items-center lg:gap-3">
      <div className="col-span-2 flex h-9 min-w-0 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 sm:col-span-1 lg:w-[204px] lg:px-4">
        <Search size={16} className="shrink-0 text-[#99a1af]" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("table.searchPlaceholder")}
          className="min-w-0 w-full bg-transparent text-[13px] text-[#2b3038] outline-none placeholder:text-[#99a1af] sm:text-[14px]"
          style={mont}
        />
      </div>

      <SearchableSelect
        size="sm"
        searchable={false}
        value={sortBy}
        onChange={(next) => setSortBy(next as typeof sortBy)}
        options={[
          { value: "default", label: t("table.sort.default") },
          { value: "name", label: t("table.sort.name") },
          { value: "listings", label: t("table.sort.listings") },
        ]}
        placeholder={t("table.sort.default")}
        ariaLabel={t("table.sortAria")}
        className="min-w-0 lg:min-w-[112px]"
      />

      <SearchableSelect
        size="sm"
        searchable={false}
        value={typeFilter}
        onChange={(next) => setTypeFilter(next as ContactType | "All")}
        options={[
          { value: "All", label: t("table.typeFilterAll") },
          { value: ContactType.BUYER, label: t("type.buyer") },
          { value: ContactType.SELLER, label: t("type.seller") },
          { value: ContactType.BOTH, label: t("type.both") },
        ]}
        placeholder={t("table.typeFilterAll")}
        ariaLabel={t("table.typeFilterAria")}
        className="min-w-0 lg:min-w-[138px]"
      />
    </div>
  </div>

  {/* Loading / error / table */}
  {isLoading ? (
    <div className="flex items-center justify-center gap-2 py-16 text-[#6a7282]">
      <Loader2 size={18} className="animate-spin" />

      <span className="text-[14px]" style={mont}>
        {t("table.loadingContacts")}
      </span>
    </div>
  ) : isError ? (
    <div
      className="py-10 text-center text-[14px] text-red-500"
      style={mont}
    >
      {t("table.failedToLoad")}
    </div>
  ) : (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th
                className="w-[240px] px-6 py-[10px] text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.contactName")}
              </th>

              <th
                className="w-[224px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.contactInformation")}
              </th>

              <th
                className="w-[200px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.location")}
              </th>

              <th
                className="w-[156px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.assignedListings")}
              </th>

              <th
                className="w-[160px] px-4 py-[10px] text-left text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.contactId")}
              </th>

              <th
                className="w-[120px] px-4 py-[10px] text-center text-[14px] font-medium text-[#6a7282]"
                style={mont}
              >
                {t("table.columns.contactType")}
              </th>

              <th className="w-[55px]" />
            </tr>
          </thead>

          <tbody>
            {filtered.map((contact: ContactDto) => (
              <tr
                key={contact.id}
                className="border-b border-[#e5e7eb] last:border-b-0"
              >
                <td className="w-[240px] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white"
                      style={mont}
                    >
                      {contact.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <span
                      className="whitespace-nowrap text-[14px] font-medium text-[#1e4f86]"
                      style={mont}
                    >
                      {contact.fullName}
                    </span>
                  </div>
                </td>

                <td className="w-[224px] px-4 py-[14px]">
                  <div className="flex flex-col gap-1">
                    <span
                      className="whitespace-nowrap text-[14px] font-medium text-[#0d2138]"
                      style={mont}
                    >
                      {contact.email ?? "—"}
                    </span>

                    <span
                      className="whitespace-nowrap text-[12px] text-[#6a7282]"
                      style={mont}
                    >
                      {contact.phone ?? "—"}
                    </span>
                  </div>
                </td>

                <td className="w-[200px] px-4 py-[18px]">
                  <span
                    className="whitespace-nowrap text-[14px] font-medium text-[#6a7282]"
                    style={mont}
                  >
                    {contact.location ?? "—"}
                  </span>
                </td>

                <td className="w-[156px] px-4 py-[18px]">
                  <span
                    className="text-[14px] font-semibold text-[#4896b6]"
                    style={mont}
                  >
                    {contact.properties.length}
                  </span>
                </td>

                <td className="w-[160px] px-4 py-6">
                  <span
                    className="text-[14px] font-semibold text-[#4896b6]"
                    style={mont}
                  >
                    {contact.contactId}
                  </span>
                </td>

                <td className="w-[120px] px-4 py-4 text-center">
                  <TypeBadge type={contact.type} t={t} />
                </td>

                <td className="w-[55px] px-4 py-4 text-center">
                  <RowMenu
                    contact={contact}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => setEditingContact(contact)}
                    onDelete={() => setDeletingContact(contact)}
                    t={t}
                  />
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {contacts.length === 0
                    ? t("table.noContactsYet")
                    : t("table.noContactsMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 bg-[#fff] p-3 md:hidden">
        {filtered.map((contact: ContactDto) => (
          <div
            key={contact.id}
            className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[14px] font-semibold text-white"
                  style={mont}
                >
                  {contact.fullName
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[14px] font-semibold text-[#0d2138]"
                    style={mont}
                  >
                    {contact.fullName}
                  </p>

                  <p
                    className="mt-1 truncate text-[14px] text-[#6a7282]"
                    style={mont}
                  >
                    {contact.email ?? "—"}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <RowMenu
                  contact={contact}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setEditingContact(contact)}
                  onDelete={() => setDeletingContact(contact)}
                  t={t}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#f3f4f6] pt-4">
              <div className="min-w-0">
                <p
                  className="text-[14px] font-medium text-[#99a1af]"
                  style={mont}
                >
                  {t("table.mobileLabels.phone")}
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#2b3038]"
                  style={mont}
                >
                  {contact.phone ?? "—"}
                </p>
              </div>

              <div className="min-w-0">
                <p
                  className="text-[14px] font-medium text-[#99a1af]"
                  style={mont}
                >
                  {t("table.mobileLabels.location")}
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-medium text-[#2b3038]"
                  style={mont}
                >
                  {contact.location ?? "—"}
                </p>
              </div>

              <div className="min-w-0">
                <p
                  className="text-[14px] font-medium text-[#99a1af]"
                  style={mont}
                >
                  {t("table.mobileLabels.assignedListings")}
                </p>

                <p
                  className="mt-1 text-[14px] font-semibold text-[#4896b6]"
                  style={mont}
                >
                  {contact.properties.length}
                </p>
              </div>

              <div className="min-w-0">
                <p
                  className="mb-1.5 text-[14px] font-medium text-[#99a1af]"
                  style={mont}
                >
                  {t("table.mobileLabels.contactType")}
                </p>

                <TypeBadge type={contact.type} t={t} />
              </div>

              <div className="col-span-2 min-w-0 rounded-[10px] bg-[#f8fafc] px-3 py-2.5">
                <p
                  className="text-[14px] font-medium text-[#99a1af]"
                  style={mont}
                >
                  {t("table.mobileLabels.contactId")}
                </p>

                <p
                  className="mt-1 truncate text-[14px] font-semibold text-[#4896b6]"
                  style={mont}
                >
                  {contact.contactId}
                </p>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
            style={mont}
          >
            {contacts.length === 0
              ? t("table.noContactsYet")
              : t("table.noContactsMatch")}
          </div>
        )}
      </div>
    </>
  )}

  <div className="border-t border-[#f3f4f6] px-5 py-3">
    <span
      className="text-[12px] font-medium text-[#6a7282]"
      style={mont}
    >
      {t("table.showingCount", { filtered: filtered.length, total: contacts.length })}
    </span>
  </div>
</div>

      {/* Modals */}
      {showAddModal && (
        <AddContactModal
          onClose={() => {
            setShowAddModal(false);
            setConflict(null);
          }}
          onCreate={handleCreate}
          isSaving={createMutation.isPending}
          conflict={
            conflict
              ? {
                  message: conflict.message,
                  onViewExisting: () => {
                    const existing = contacts.find((c) => c.id === conflict.existingContactId);
                    setShowAddModal(false);
                    setConflict(null);
                    if (existing) setEditingContact(existing);
                    else toast.error(t("toasts.couldNotOpenExisting"));
                  },
                }
              : null
          }
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
          t={t}
        />
      )}
    </div>
  );
}