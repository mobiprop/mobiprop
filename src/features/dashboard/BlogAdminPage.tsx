"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
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
} from "lucide-react";

import { hasPermission, type Role } from "@/lib/permissions";
import { BLOG_CATEGORIES } from "@/schemas/blog.schema";
import { BlogStatus } from "@/generated/prisma/enums";
import { useBlogPostsQuery, useBlogMetricsQuery } from "@/hooks/queries/useBlogPostsQuery";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} from "@/hooks/mutations/useBlogMutations";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";
import { BlogEditorModal, type BlogFormValues } from "./components/BlogEditorModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  iconBg,
  icon,
}: {
  label: string;
  value: string | number;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#e5e7eb] bg-white p-4 flex flex-col gap-[18px] h-[112px]">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[#6a7282]" style={mont}>{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <p className="text-[24px] font-semibold leading-[28px] text-[#1e4f86]" style={poppins}>{value}</p>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BlogStatus }) {
  const published = status === BlogStatus.PUBLISHED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        published ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f3f4f6] text-[#4b5563]"
      }`}
      style={mont}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BlogAdminPage({ role }: { role: Role }) {
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

  const filters = useMemo(
    () => ({ status: statusFilter, category: categoryFilter, search }),
    [statusFilter, categoryFilter, search],
  );

  const { data, isLoading, isError } = useBlogPostsQuery(filters);
  const { data: metricsData } = useBlogMetricsQuery();
  const createMutation = useCreateBlogMutation();
  const updateMutation = useUpdateBlogMutation();
  const deleteMutation = useDeleteBlogMutation();

  const posts = data?.posts ?? [];
  const metrics = metricsData?.metrics;
  const submitting = createMutation.isPending || updateMutation.isPending;
  // The dummy fallback (before the blog_posts migration is applied) tags rows
  // with `dummy-` ids. Surface a banner so it's clear these are placeholders and
  // that create/edit/delete won't persist until the DB table exists.
  const isPreviewData = posts.some((p) => p.id.startsWith("dummy-"));

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
      excerpt: values.excerpt,
      author: values.author,
      content: values.content,
      coverImageUrl: values.coverImageUrl,
      status: values.status,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, body },
        {
          onSuccess: () => {
            toast.success("Post updated");
            setEditorOpen(false);
            setEditing(null);
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update post"),
        },
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => {
          toast.success(values.status === BlogStatus.PUBLISHED ? "Post published" : "Draft saved");
          setEditorOpen(false);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create post"),
      });
    }
  }

  function handleDelete(post: BlogPostDto) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    deleteMutation.mutate(post.id, {
      onSuccess: () => toast.success("Post deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete post"),
      onSettled: () => setDeletingId(null),
    });
  }

  const selectClass =
    "h-9 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#374151] outline-none focus:border-[#1e4f86]";

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6" style={mont}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1f2937]" style={poppins}>Blog</h1>
          <p className="mt-1 text-[13px] text-[#6a7282]">Create and manage articles for the website blog.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white hover:bg-[#1a4574]"
          >
            <Plus className="size-4" /> New Post
          </button>
        )}
      </div>

      {/* Preview-data notice (dummy fallback before the DB migration is applied) */}
      {isPreviewData && (
        <div className="flex items-start gap-2 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#92400e]">
          <span className="mt-0.5 font-semibold">Preview data</span>
          <span>
            These are placeholder posts. The blog database table hasn&apos;t been created yet, so
            creating, editing, or deleting won&apos;t save. Apply the pending migration to start
            managing real posts.
          </span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total posts" value={metrics?.total ?? "—"} iconBg="#dbeafe" icon={<FileText className="size-4 text-[#1e4f86]" />} />
        <StatCard label="Published" value={metrics?.published ?? "—"} iconBg="#dcfce7" icon={<CheckCircle2 className="size-4 text-[#16a34a]" />} />
        <StatCard label="Drafts" value={metrics?.drafts ?? "—"} iconBg="#fef3c7" icon={<FileEdit className="size-4 text-[#d97706]" />} />
        <StatCard label="Categories" value={metrics?.categories ?? "—"} iconBg="#ede9fe" icon={<Tags className="size-4 text-[#7c3aed]" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author…"
            className="h-9 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-3 text-[12px] text-[#374151] outline-none focus:border-[#1e4f86]"
          />
        </div>
        <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select className={selectClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {BLOG_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#6a7282]">
            <Loader2 className="size-4 animate-spin" /> Loading posts…
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-[13px] text-[#dc2626]">Failed to load posts. Try again.</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#f3f4f6]">
              <Newspaper className="size-6 text-[#9ca3af]" />
            </span>
            <p className="text-[14px] font-medium text-[#1f2937]">No posts yet</p>
            <p className="max-w-[320px] text-[12px] text-[#6a7282]">
              {search || statusFilter || categoryFilter
                ? "No posts match your filters."
                : "Create your first article to get started."}
            </p>
            {canCreate && !search && !statusFilter && !categoryFilter && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-1 flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574]"
              >
                <Plus className="size-4" /> New Post
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc] text-left text-[11px] uppercase tracking-wide text-[#6a7282]">
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafbfc]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
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
                      <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#1e4f86]">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#374151]">{post.author}</td>
                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                    <td className="px-4 py-3 text-[12px] text-[#6a7282]">
                      {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEdit(post)}
                            title="Edit"
                            aria-label="Edit"
                            className="flex size-8 items-center justify-center rounded-[8px] text-[#374151] hover:bg-[#eff6ff] hover:text-[#1e4f86]"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(post)}
                            disabled={deletingId === post.id}
                            title="Delete"
                            aria-label="Delete"
                            className="flex size-8 items-center justify-center rounded-[8px] text-[#374151] hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:opacity-50"
                          >
                            {deletingId === post.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </button>
                        )}
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
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
