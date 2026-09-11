"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  FileEdit,
  Tags,
  Pencil,
  Trash2,
  Loader2,
  Newspaper,
  MoreVertical,
  FolderCog,
  AlertTriangle,
  Star,
} from "lucide-react";

import { hasPermission, type Role } from "@/lib/permissions";
import { BlogStatus } from "@/generated/prisma/enums";
import { useBlogPostsQuery, useBlogMetricsQuery, useBlogCategoriesQuery } from "@/hooks/queries/useBlogPostsQuery";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
  useToggleBlogFeaturedMutation,
} from "@/hooks/mutations/useBlogMutations";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";
import { BlogEditorModal, type BlogFormValues } from "./components/BlogEditorModal";
import { ManageCategoriesModal } from "./components/ManageCategoriesModal";
import { SearchableSelect } from "./components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  iconBg,
  icon,
}: {
  label: string;
  value: string | number;
  trend: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#e5e7eb] bg-white p-4 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] text-[#6a7282]" style={mont}>{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[24px] font-semibold leading-[28px] text-[#0d2138]" style={poppins}>{value}</p>
        <p className="text-[13px] font-medium text-[#00a63e]" style={mont}>{trend}</p>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: "#dcfce7", text: "#166534" },
  SCHEDULED: { bg: "#dbeafe", text: "#1d4ed8" },
  DRAFT: { bg: "#f3f4f6", text: "#4b5563" },
};

function StatusBadge({ status }: { status: BlogStatus }) {
  const { t } = useTranslation("dashboardBlog");
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text, ...mont }}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// ── Row actions menu ──────────────────────────────────────────────────────────
// Portal + fixed-position pattern (flips above the trigger near the bottom of
// the viewport) — same approach as RowMenu in ContractsPage.tsx, so the table's
// scroll/overflow wrappers can't clip the menu.

function RowMenu({
  label,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  label: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("dashboardBlog");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

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
  }, [open, canEdit, canDelete]);

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

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={t("adminPage.rowMenu.actionsTitle")}
        aria-label={t("adminPage.rowMenu.actionsAria", { label })}
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
            className="mobi-dropdown-menu fixed z-[9999] w-[160px] overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{ top: position.top, left: position.left }}
          >
            {canEdit && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onEdit(); }}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#0d2138] transition-colors hover:bg-[#f8fafc]"
                style={mont}
              >
                <Pencil size={14} className="text-[#1e4f86]" /> {t("adminPage.rowMenu.edit")}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onDelete(); }}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-3 text-left text-[13px] font-medium text-[#fb2c36] transition-colors hover:bg-[#fff1f2]"
                style={mont}
              >
                <Trash2 size={14} /> {t("adminPage.rowMenu.delete")}
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({
  post,
  isDeleting,
  onCancel,
  onConfirm,
  t,
}: {
  post: BlogPostDto;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
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
            <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>
              {t("adminPage.deleteModal.title")}
            </p>
            <p className="text-[13px] text-[#6a7282] leading-5" style={mont}>
              {(() => {
                const body = t("adminPage.deleteModal.body", { title: post.title });
                const idx = body.indexOf(post.title);
                if (idx === -1) return body;
                return (
                  <>
                    {body.slice(0, idx)}
                    <span className="font-semibold text-[#0d2138]">{post.title}</span>
                    {body.slice(idx + post.title.length)}
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
              {t("adminPage.deleteModal.cancel")}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex-1 h-10 bg-[#fb2c36] rounded-[10px] text-[13px] font-medium text-white hover:bg-[#e0262f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isDeleting ? t("adminPage.deleteModal.deleting") : t("adminPage.deleteModal.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BlogAdminPage({ role }: { role: Role }) {
  const { t } = useTranslation("dashboardBlog");
  const canCreate = hasPermission(role, "blog:create");
  const canUpdate = hasPermission(role, "blog:update");
  const canDelete = hasPermission(role, "blog:delete");
  const canPublish = hasPermission(role, "blog:publish");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPostDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<BlogPostDto | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const filters = useMemo(
    () => ({ status: statusFilter, category: categoryFilter, search }),
    [statusFilter, categoryFilter, search],
  );

  const { data, isLoading, isError } = useBlogPostsQuery(filters);
  const { data: metricsData } = useBlogMetricsQuery();
  const { data: categoriesData } = useBlogCategoriesQuery();
  const createMutation = useCreateBlogMutation();
  const updateMutation = useUpdateBlogMutation();
  const deleteMutation = useDeleteBlogMutation();
  const featuredMutation = useToggleBlogFeaturedMutation();

  const posts = data?.posts ?? [];
  const metrics = metricsData?.metrics;
  const categories = categoriesData?.categories ?? [];
  const submitting = createMutation.isPending || updateMutation.isPending;
  // The dummy fallback (before the blog_posts migration is applied) tags rows
  // with `dummy-` ids. Surface a banner so it's clear these are placeholders and
  // that create/edit/delete won't persist until the DB table exists.
  const isPreviewData = posts.some((p) => p.id.startsWith("dummy-"));

  // Posts not counted under any current category (null category, or stale text
  // left over from a deleted/renamed one).
  const uncategorizedPosts = Math.max(0, (metrics?.total ?? 0) - categories.reduce((sum, c) => sum + c.postCount, 0));

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(post: BlogPostDto) {
    setEditing(post);
    setEditorOpen(true);
  }

  function handleSubmit(values: BlogFormValues) {
    const body = {
      title: values.title,
      category: values.category,
      slug: values.slug,
      excerpt: values.excerpt,
      author: values.author,
      content: values.content,
      tags: values.tags,
      coverImageUrl: values.coverImageUrl,
      status: values.status,
      scheduledAt: values.scheduledAt,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, body },
        {
          onSuccess: () => {
            toast.success(t("adminPage.toasts.postUpdated"));
            setEditorOpen(false);
            setEditing(null);
          },
          onError: () => toast.error(t("adminPage.toasts.updateFailed")),
        },
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => {
          toast.success(
            values.status === BlogStatus.PUBLISHED
              ? t("adminPage.toasts.postPublished")
              : values.status === BlogStatus.SCHEDULED
                ? t("adminPage.toasts.postScheduled")
                : t("adminPage.toasts.draftSaved"),
          );
          setEditorOpen(false);
        },
        onError: () => toast.error(t("adminPage.toasts.createFailed")),
      });
    }
  }

  function handleDelete(post: BlogPostDto) {
    setConfirmingDelete(post);
  }

  function handleToggleFeatured(post: BlogPostDto) {
    featuredMutation.mutate(
      { id: post.id, isFeatured: !post.isFeatured },
      {
        onSuccess: () =>
          toast.success(post.isFeatured ? t("adminPage.toasts.unfeatured") : t("adminPage.toasts.featured")),
        onError: () => toast.error(t("adminPage.toasts.featuredFailed")),
      },
    );
  }

  function handleConfirmDelete() {
    if (!confirmingDelete) return;
    const post = confirmingDelete;
    setDeletingId(post.id);
    deleteMutation.mutate(post.id, {
      onSuccess: () => toast.success(t("adminPage.toasts.postDeleted")),
      onError: () => toast.error(t("adminPage.toasts.deleteFailed")),
      onSettled: () => {
        setDeletingId(null);
        setConfirmingDelete(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6" style={mont}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1f2937]" style={poppins}>{t("adminPage.title")}</h1>
          <p className="mt-1 text-[13px] text-[#6a7282]">{t("adminPage.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <button
              type="button"
              onClick={() => setManageCategoriesOpen(true)}
              className="flex h-10 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f8fafc]"
            >
              <FolderCog className="size-4" /> {t("adminPage.manageCategories")}
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white hover:bg-[#1a4574]"
            >
              <Plus className="size-4" /> {t("adminPage.newPost")}
            </button>
          )}
        </div>
      </div>

      {/* Preview-data notice (dummy fallback before the DB migration is applied) */}
      {isPreviewData && (
        <div className="flex items-start gap-2 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#92400e]">
          <span className="mt-0.5 font-semibold">{t("adminPage.previewData")}</span>
          <span>
            {t("adminPage.previewDataMessage")}
          </span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("adminPage.stats.totalPosts")} value={metrics?.total ?? "—"} trend={t("adminPage.stats.allTime")} iconBg="#dbeafe" icon={<FileText className="size-4 text-[#1e4f86]" />} />
        <StatCard label={t("adminPage.stats.published")} value={metrics?.published ?? "—"} trend={t("adminPage.stats.liveOnSite")} iconBg="#dcfce7" icon={<CheckCircle2 className="size-4 text-[#16a34a]" />} />
        <StatCard label={t("adminPage.stats.drafts")} value={metrics?.drafts ?? "—"} trend={t("adminPage.stats.awaitingPublish")} iconBg="#fef3c7" icon={<FileEdit className="size-4 text-[#d97706]" />} />
        <StatCard label={t("adminPage.stats.categories")} value={metrics?.categories ?? "—"} trend={t("adminPage.stats.managedTaxonomy")} iconBg="#ede9fe" icon={<Tags className="size-4 text-[#7c3aed]" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adminPage.searchPlaceholder")}
            className="h-9 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-3 text-[12px] text-[#374151] outline-none focus:border-[#1e4f86]"
          />
        </div>
        <SearchableSelect
          className="w-[170px] shrink-0"
          size="sm"
          searchable={false}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder={t("adminPage.allStatuses")}
          ariaLabel={t("adminPage.allStatuses")}
          options={[
            { value: "", label: t("adminPage.allStatuses") },
            { value: "PUBLISHED", label: t("status.PUBLISHED") },
            { value: "SCHEDULED", label: t("status.SCHEDULED") },
            { value: "DRAFT", label: t("status.DRAFT") },
          ]}
        />
        <SearchableSelect
          className="w-[190px] shrink-0"
          size="sm"
          searchable={false}
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder={t("adminPage.allCategories")}
          ariaLabel={t("adminPage.allCategories")}
          options={[
            { value: "", label: t("adminPage.allCategories") },
            ...categories.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#6a7282]">
            <Loader2 className="size-4 animate-spin" /> {t("adminPage.loading")}
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[13px] text-[#dc2626]">{t("adminPage.loadError")}</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#f3f4f6]">
              <Newspaper className="size-6 text-[#9ca3af]" />
            </span>
            <p className="text-[14px] font-medium text-[#1f2937]">{t("adminPage.noPostsYet")}</p>
            <p className="max-w-[320px] text-[12px] text-[#6a7282]">
              {search || statusFilter || categoryFilter
                ? t("adminPage.noPostsMatchFilters")
                : t("adminPage.createFirstArticle")}
            </p>
            {canCreate && !search && !statusFilter && !categoryFilter && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-1 flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574]"
              >
                <Plus className="size-4" /> {t("adminPage.newPost")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc] text-left text-[11px] uppercase tracking-wide text-[#6a7282]">
                  <th className="px-4 py-3 font-medium">{t("adminPage.columns.post")}</th>
                  <th className="px-4 py-3 font-medium">{t("adminPage.columns.category")}</th>
                  <th className="px-4 py-3 font-medium">{t("adminPage.columns.author")}</th>
                  <th className="px-4 py-3 font-medium">{t("adminPage.columns.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("adminPage.columns.updated")}</th>
                  <th className="w-[52px]" />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafbfc]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {canPublish && (
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(post)}
                            disabled={featuredMutation.isPending}
                            title={post.isFeatured ? t("adminPage.unfeatureAria") : t("adminPage.featureAria")}
                            className="shrink-0 rounded-[6px] p-1 text-[#d1d5db] transition-colors hover:bg-[#fffbeb] hover:text-[#f59e0b] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Star
                              className="size-4"
                              fill={post.isFeatured ? "#f59e0b" : "none"}
                              color={post.isFeatured ? "#f59e0b" : "currentColor"}
                            />
                          </button>
                        )}
                        <div className="size-11 shrink-0 overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                          {post.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.coverImageUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center">
                              <FileText className="size-4 text-[#9ca3af]" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#1f2937]">{post.title}</p>
                          <p className="truncate text-[11px] text-[#9ca3af]">/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.category ? (
                        <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#1e4f86]">
                          {post.category}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#9ca3af]">{t("adminPage.uncategorized")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#374151]">{post.author}</td>
                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                    <td className="px-4 py-3 text-[12px] text-[#6a7282]">
                      {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <RowMenu
                          label={post.title}
                          canEdit={canUpdate}
                          canDelete={canDelete}
                          onEdit={() => openEdit(post)}
                          onDelete={() => handleDelete(post)}
                        />
                        {deletingId === post.id && <Loader2 className="ml-1 size-4 shrink-0 animate-spin text-[#6a7282]" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editorOpen && (
        <BlogEditorModal
          post={editing}
          canPublish={canPublish}
          submitting={submitting}
          categories={categories}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {manageCategoriesOpen && (
        <ManageCategoriesModal
          categories={categories}
          totalPosts={metrics?.total ?? 0}
          uncategorizedPosts={uncategorizedPosts}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onClose={() => setManageCategoriesOpen(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmModal
          post={confirmingDelete}
          isDeleting={deletingId === confirmingDelete.id}
          onCancel={() => setConfirmingDelete(null)}
          onConfirm={handleConfirmDelete}
          t={t}
        />
      )}
    </div>
  );
}
