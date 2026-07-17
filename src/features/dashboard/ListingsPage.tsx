"use client";

import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Home,
  CheckCircle2,
  Eye,
  Star,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  X,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { PropertyStatus, PropertyType } from "@/generated/prisma/enums";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import { useDashboardListingsQuery } from "@/hooks/queries/useDashboardListingsQuery";
import {
  useListingStatusMutation,
  useListingFeaturedMutation,
  useUpdateListingMutation,
} from "@/hooks/mutations/useUpdateListingMutation";
import { useDeleteListingMutation } from "@/hooks/mutations/useDeleteListingMutation";
import {
  ListingListView,
  type ListingRowActions,
} from "./components/ListingListView";
import { ListingGridView } from "./components/ListingGridView";
import { ListingFilterModal } from "./components/ListingFilterModal";
import { UploadListingModal } from "./components/UploadListingModal";
import { SearchableSelect } from "./components/SearchableSelect";
import { BulkActionsBar } from "./components/BulkActionsBar";
import { BulkAssignAgentModal } from "./components/BulkAssignAgentModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type ViewMode = "list" | "grid";

type StatCardProps = {
  label: string;
  value: string;
  trend: string;
  trendMuted?: boolean;
  iconBg: string;
  icon: ReactNode;
};

function StatCard({
  label,
  value,
  trend,
  trendMuted = false,
  iconBg,
  icon,
}: StatCardProps) {
  return (
    <article className="flex min-h-[142px] min-w-0 flex-col justify-between rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p
          className="min-w-0 text-[14px] font-medium leading-5 text-[#6a7282]"
          style={mont}
        >
          {label}
        </p>

        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>

      <div className="mt-5 min-w-0">
        <p
          className="truncate text-[24px] font-semibold leading-8 text-[#1B487A]"
          style={poppins}
        >
          {value}
        </p>

        <p
          className={`mt-1 text-[14px] font-medium leading-5 ${
            trendMuted ? "text-[#6a7282]" : "text-[#00a63e]"
          }`}
          style={mont}
        >
          {trend}
        </p>
      </div>
    </article>
  );
}

type ListingsPageProps = {
  role: Role;
};

export function ListingsPage({ role }: ListingsPageProps) {
  const { t } = useTranslation("dashboardListings");
  const { t: td } = useTranslation("dashboard");
  const [view, setView] = useState<ViewMode>("list");
  const [showUpload, setShowUpload] = useState(false);
  const [editListing, setEditListing] = useState<DashboardListingDto | null>(
    null,
  );
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "All">(
    "All",
  );
  const [typeFilter, setTypeFilter] = useState<PropertyType | "All">("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const { data, isLoading, isError } = useDashboardListingsQuery();
  const statusMutation = useListingStatusMutation();
  const featuredMutation = useListingFeaturedMutation();
  const deleteMutation = useDeleteListingMutation();
  const updateMutation = useUpdateListingMutation();

  const canCreate = hasPermission(role, "listings:create");
  const canUpdate = hasPermission(role, "listings:update");
  const canPause = hasPermission(role, "listings:pause");
  const canFeature = hasPermission(role, "listings:feature");
  const canDelete = hasPermission(role, "listings:delete");
  const canAssign = hasPermission(role, "listings:assign");

  const listings = useMemo(() => data?.listings ?? [], [data]);
  const metrics = data?.metrics;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        listing.listingId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || listing.status === statusFilter;

      const matchesType = typeFilter === "All" || listing.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [listings, search, statusFilter, typeFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== "All" || typeFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  }

  async function handleToggleStatus(listing: DashboardListingDto) {
    const nextStatus =
      listing.status === PropertyStatus.ACTIVE
        ? PropertyStatus.PAUSED
        : PropertyStatus.ACTIVE;

    try {
      await statusMutation.mutateAsync({
        id: listing.id,
        status: nextStatus,
      });

      toast.success(
        nextStatus === PropertyStatus.PAUSED
          ? t("toasts.listingPaused")
          : t("toasts.listingActivated"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.updateStatusFailed"),
      );
    }
  }

  async function handleToggleFeatured(listing: DashboardListingDto) {
    try {
      await featuredMutation.mutateAsync({
        id: listing.id,
        isFeatured: !listing.isFeatured,
      });

      toast.success(
        listing.isFeatured ? t("toasts.removedFromFeatured") : t("toasts.markedAsFeatured"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.updateListingFailed"),
      );
    }
  }

  async function handleDelete(listing: DashboardListingDto) {
    const confirmed = window.confirm(
      t("toasts.confirmDelete", { title: listing.title, listingId: listing.listingId }),
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(listing.id);
      toast.success(t("toasts.listingDeleted"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.deleteListingFailed"),
      );
    }
  }

  const rowActions: ListingRowActions = {
    canUpdate,
    canPause,
    canFeature,
    canDelete,
    onEdit: (listing) => setEditListing(listing),
    onToggleStatus: handleToggleStatus,
    onToggleFeatured: handleToggleFeatured,
    onDelete: handleDelete,
  };

  function toggleOneSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllSelected() {
    setSelectedIds((prev) => {
      const allVisibleSelected =
        filtered.length > 0 && filtered.every((listing) => prev.has(listing.id));
      return allVisibleSelected ? new Set() : new Set(filtered.map((listing) => listing.id));
    });
  }

  async function runBulk(
    ids: string[],
    run: (id: string) => Promise<unknown>,
    successLabel: (count: number) => string,
    failureLabel: (count: number) => string,
  ) {
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(run));
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    if (succeeded > 0) toast.success(successLabel(succeeded));
    if (failed > 0) toast.error(failureLabel(failed));

    setBulkBusy(false);
    setSelectedIds(new Set());
  }

  function handleBulkFeature(isFeatured: boolean) {
    const ids = [...selectedIds];
    return runBulk(
      ids,
      (id) => featuredMutation.mutateAsync({ id, isFeatured }),
      (n) => t(isFeatured ? "toasts.bulkFeatured" : "toasts.bulkUnfeatured", { count: n }),
      (n) => t("toasts.bulkUpdateFailed", { count: n }),
    );
  }

  function handleBulkStatus(status: PropertyStatus, successKey: string) {
    const ids = [...selectedIds];
    return runBulk(
      ids,
      (id) => statusMutation.mutateAsync({ id, status }),
      (n) => t(successKey, { count: n }),
      (n) => t("toasts.bulkUpdateFailed", { count: n }),
    );
  }

  function handleBulkArchive() {
    const ids = [...selectedIds];
    const confirmed = window.confirm(t("toasts.confirmArchive", { count: ids.length }));
    if (!confirmed) return;
    return handleBulkStatus(PropertyStatus.INACTIVE, "toasts.bulkArchived");
  }

  function handleBulkDelete() {
    const ids = [...selectedIds];
    const confirmed = window.confirm(t("toasts.confirmBulkDelete", { count: ids.length }));
    if (!confirmed) return;
    return runBulk(
      ids,
      (id) => deleteMutation.mutateAsync(id),
      (n) => t("toasts.bulkDeleted", { count: n }),
      (n) => t("toasts.bulkDeleteFailed", { count: n }),
    );
  }

  function handleBulkAssign(agentId: string) {
    const ids = [...selectedIds];
    setShowBulkAssign(false);
    return runBulk(
      ids,
      (id) => updateMutation.mutateAsync({ id, data: { assignedAgentId: agentId } }),
      (n) => t("toasts.bulkAssigned", { count: n }),
      (n) => t("toasts.bulkAssignFailed", { count: n }),
    );
  }

  return (
    <main className="min-h-full bg-[#f8fafc] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-4 sm:gap-5">
        {/* Header */}
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1
              className="text-[20px] font-semibold leading-8 text-[#0d2138] sm:text-[22px]"
              style={poppins}
            >
              {t("page.title")}
            </h1>

            <p
              className="mt-1 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              {t("page.subtitle")}
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 sm:w-auto"
              style={mont}
            >
              <Plus size={16} className="shrink-0" />
              {t("page.uploadNewListing")}
            </button>
          )}
        </header>

        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("stats.totalListings")}
            value={metrics ? String(metrics.totalListings) : "—"}
            trend={t("stats.allListings")}
            trendMuted
            iconBg="#e0e7ff"
            icon={
              <Home
                size={19}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
          />

          <StatCard
            label={t("stats.activeListings")}
            value={metrics ? String(metrics.activeListings) : "—"}
            trend={t("stats.visibleOnPublicSite")}
            trendMuted
            iconBg="#d1fae5"
            icon={
              <CheckCircle2
                size={19}
                strokeWidth={1.8}
                className="text-[#10b981]"
              />
            }
          />

          <StatCard
            label={t("stats.totalViews")}
            value={metrics ? metrics.totalViews.toLocaleString("en-US") : "—"}
            trend={t("stats.acrossAllListings")}
            trendMuted
            iconBg="#fef3c7"
            icon={
              <Eye
                size={19}
                strokeWidth={1.8}
                className="text-[#f59e0b]"
              />
            }
          />

          <StatCard
            label={t("stats.featured")}
            value={metrics ? String(metrics.featuredListings) : "—"}
            trend={t("stats.premiumListings")}
            trendMuted
            iconBg="#e0e7ff"
            icon={
              <Star
                size={19}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
          />
        </section>

        {/* Filters */}
        <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-3 sm:p-4">
          <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 lg:flex lg:items-center lg:gap-3">
            {/* Search */}
            <div className="col-span-2 flex h-11 min-w-0 items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 transition-all focus-within:border-[#1e4f86] focus-within:ring-2 focus-within:ring-[#1e4f86]/10 sm:col-span-4 lg:w-[300px] lg:flex-none">
              <Search size={16} className="shrink-0 text-[#99a1af]" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                aria-label={t("filters.searchAria")}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af]"
                style={mont}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("filters.clearSearchAria")}
                  className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-[#99a1af] transition-colors hover:bg-[#e9edf2] hover:text-[#0d2138]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter modal */}
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] font-medium text-[#6a7282] transition-colors hover:bg-[#f3f4f6] lg:w-11 lg:px-0"
              title={t("filters.moreFiltersTitle")}
              style={mont}
            >
              <Filter size={16} className="shrink-0" />
              <span className="lg:hidden">{t("filters.filtersLabel")}</span>
            </button>

            {/* Status filter */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={statusFilter}
              onChange={(next) => setStatusFilter(next as PropertyStatus | "All")}
              options={[
                { value: "All", label: t("filters.allStatus") },
                ...Object.values(PropertyStatus).map((value) => ({ value, label: td(`status.${value}`) })),
              ]}
              placeholder={t("filters.allStatus")}
              ariaLabel={t("filters.statusAria")}
              className="min-w-0 lg:min-w-[130px]"
            />

            {/* Type filter */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={typeFilter}
              onChange={(next) => setTypeFilter(next as PropertyType | "All")}
              options={[
                { value: "All", label: t("filters.allTypes") },
                ...Object.values(PropertyType).map((value) => ({ value, label: td(`propertyType.${value}`) })),
              ]}
              placeholder={t("filters.allTypes")}
              ariaLabel={t("filters.typeAria")}
              className="min-w-0 lg:min-w-[135px]"
            />

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[14px] font-medium text-[#6a7282] transition-colors hover:bg-[#f8fafc] hover:text-[#0d2138] sm:col-span-1 lg:w-auto"
                style={mont}
              >
                <X size={15} />
                {t("filters.clear")}
              </button>
            )}

            {/* View toggle */}
            <div className="col-span-2 flex h-11 items-center justify-end gap-2 sm:col-span-1 lg:ml-auto">
              <button
                type="button"
                onClick={() => setView("grid")}
                title={t("toolbar.gridViewTitle")}
                aria-label={t("toolbar.gridViewAria")}
                aria-pressed={view === "grid"}
                className={`flex size-10 items-center justify-center rounded-[9px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/25 ${
                  view === "grid"
                    ? "border-[#1e4f86] bg-[#1e4f86] text-white"
                    : "border-[#e5e7eb] bg-white text-[#6a7282] hover:bg-[#f9fafb]"
                }`}
              >
                <LayoutGrid size={17} />
              </button>

              <button
                type="button"
                onClick={() => setView("list")}
                title={t("toolbar.listViewTitle")}
                aria-label={t("toolbar.listViewAria")}
                aria-pressed={view === "list"}
                className={`flex size-10 items-center justify-center rounded-[9px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/25 ${
                  view === "list"
                    ? "border-[#1e4f86] bg-[#1e4f86] text-white"
                    : "border-[#e5e7eb] bg-white text-[#6a7282] hover:bg-[#f9fafb]"
                }`}
              >
                <List size={17} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f3f4f6] pt-3">
            <p
              className="text-[14px] font-medium text-[#6a7282]"
              style={mont}
            >
              {t("filters.showingCount", { filtered: filtered.length, total: listings.length })}
            </p>
          </div>
        </section>

        <BulkActionsBar
          selectedCount={selectedIds.size}
          busy={bulkBusy}
          canFeature={canFeature}
          canPause={canPause}
          canDelete={canDelete}
          canAssign={canAssign}
          onClear={() => setSelectedIds(new Set())}
          onFeature={() => handleBulkFeature(true)}
          onUnfeature={() => handleBulkFeature(false)}
          onPause={() => handleBulkStatus(PropertyStatus.PAUSED, "toasts.bulkPaused")}
          onActivate={() => handleBulkStatus(PropertyStatus.ACTIVE, "toasts.bulkActivated")}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onAssign={() => setShowBulkAssign(true)}
        />

        {/* Content */}
        {isLoading ? (
          <div
            className="flex min-h-[220px] items-center justify-center gap-2 rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-16 text-[14px] text-[#6a7282]"
            style={mont}
          >
            <Loader2 size={18} className="animate-spin" />
            {t("content.loading")}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex min-h-[220px] items-center justify-center rounded-[14px] border border-[#fecaca] bg-white px-4 py-16 text-center text-[14px] text-[#e7000b]"
            style={mont}
          >
            {t("content.failedToLoad")}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex min-h-[220px] flex-col items-center justify-center rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-16 text-center"
            style={mont}
          >
            <Search size={24} className="text-[#99a1af]" />

            <p className="mt-3 text-[16px] font-semibold text-[#0d2138]">
              {t("content.noListingsFound")}
            </p>

            <p className="mt-1 text-[14px] text-[#6a7282]">
              {t("content.tryChangingSearch")}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1b487a]"
              >
                {t("content.clearFilters")}
              </button>
            )}
          </div>
        ) : view === "list" ? (
          <div className="min-w-0 overflow-hidden">
            <ListingListView
              listings={filtered}
              actions={rowActions}
              selection={{
                selectedIds,
                onToggleOne: toggleOneSelected,
                onToggleAll: toggleAllSelected,
              }}
            />
          </div>
        ) : (
          <div className="min-w-0">
            <ListingGridView listings={filtered} actions={rowActions} />
          </div>
        )}

        {showUpload && (
          <UploadListingModal
            onClose={() => setShowUpload(false)}
            canFeature={canFeature}
            canAssign={canAssign}
          />
        )}

        {editListing && (
          <UploadListingModal
            listing={editListing}
            onClose={() => setEditListing(null)}
            canFeature={canFeature}
            canAssign={canAssign}
          />
        )}

        {showFilter && (
          <ListingFilterModal
            resultCount={filtered.length}
            onApply={() => setShowFilter(false)}
            onClose={() => setShowFilter(false)}
          />
        )}

        {showBulkAssign && (
          <BulkAssignAgentModal
            count={selectedIds.size}
            busy={bulkBusy}
            onClose={() => setShowBulkAssign(false)}
            onAssign={handleBulkAssign}
          />
        )}
      </div>
    </main>
  );
}