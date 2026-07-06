"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { BlogCategoryDto } from "@/features/blog/types/blog-dto";
import {
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
} from "@/hooks/mutations/useBlogCategoryMutations";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const inputClass =
  "h-10 w-full min-w-0 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-[12px] text-[#0a0a0a] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

type ManageCategoriesModalProps = {
  categories: BlogCategoryDto[];
  totalPosts: number;
  uncategorizedPosts: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
};

type PanelState = { mode: "empty" } | { mode: "add" } | { mode: "edit"; category: BlogCategoryDto };

// ── Delete confirm dialog ──────────────────────────────────────────────────────
// Matches the "Delete Category" Figma alert: icon + title + subtitle + message,
// Cancel/Delete actions. Scoped to category deletion (post deletion elsewhere on
// the Blog page keeps its existing window.confirm — that wasn't part of these frames).

function DeleteCategoryDialog({
  category,
  busy,
  onCancel,
  onConfirm,
}: {
  category: BlogCategoryDto;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-[400px] rounded-[16px] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={mont}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
            <Trash2 className="size-5 text-[#dc2626]" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#1f2937]">Delete Category</p>
            <p className="text-[12px] text-[#9ca3af]">Posts will not be deleted</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-5 text-[#4b5563]">
          Are you sure? Posts in &quot;{category.name}&quot; will remain but will no longer be categorised.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 flex-1 rounded-[10px] border border-[#e5e7eb] text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#dc2626] text-[13px] font-medium text-white hover:bg-[#c81e1e] disabled:opacity-60"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManageCategoriesModal({
  categories,
  totalPosts,
  uncategorizedPosts,
  canCreate,
  canUpdate,
  canDelete,
  onClose,
}: ManageCategoriesModalProps) {
  const [panel, setPanel] = useState<PanelState>({ mode: "empty" });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogCategoryDto | null>(null);

  const createMutation = useCreateBlogCategoryMutation();
  const updateMutation = useUpdateBlogCategoryMutation();
  const deleteMutation = useDeleteBlogCategoryMutation();

  function openAdd() {
    setName("");
    setSlug("");
    setDescription("");
    setPanel({ mode: "add" });
  }

  function openEdit(category: BlogCategoryDto) {
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setPanel({ mode: "edit", category });
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const body = { name: name.trim(), slug: slug.trim(), description: description.trim() };

    if (panel.mode === "edit") {
      updateMutation.mutate(
        { id: panel.category.id, body },
        {
          onSuccess: () => {
            toast.success("Category updated");
            setPanel({ mode: "empty" });
          },
          onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update category"),
        },
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => {
          toast.success("Category added");
          setPanel({ mode: "empty" });
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add category"),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeleteTarget(null);
        if (panel.mode === "edit" && panel.category.id === deleteTarget.id) setPanel({ mode: "empty" });
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete category"),
    });
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative flex w-full max-w-[900px] max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={mont}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <p className="text-[16px] font-semibold text-[#1f2937]">Manage Categories</p>
            <p className="mt-0.5 text-[12px] text-[#6a7282]">Organise your content into structured categories</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-[#6a7282] hover:bg-[#f3f4f6]" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid shrink-0 grid-cols-3 divide-x divide-[#f0f0f0] border-b border-[#e5e7eb]">
          <div className="px-5 py-3">
            <p className="text-[12px] text-[#9ca3af]">Total Categories</p>
            <p className="text-[18px] font-semibold text-[#1f2937]">{categories.length}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[12px] text-[#9ca3af]">Total Posts</p>
            <p className="text-[18px] font-semibold text-[#1f2937]">{totalPosts}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[12px] text-[#9ca3af]">Uncategorised</p>
            <p className="text-[18px] font-semibold text-[#1f2937]">{uncategorizedPosts}</p>
          </div>
        </div>

        {/* Body — list (left) + detail/form panel (right) */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex w-full max-w-[380px] shrink-0 flex-col overflow-y-auto border-r border-[#e5e7eb]">
            <div className="flex shrink-0 items-center justify-between px-5 py-3">
              <p className="text-[13px] font-semibold text-[#1f2937]">Categories ({categories.length})</p>
              {canCreate && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#1e4f86] px-3 text-[12px] font-medium text-white hover:bg-[#1a4574]"
                >
                  <Plus className="size-3.5" /> Add New
                </button>
              )}
            </div>

            {categories.length === 0 ? (
              <p className="px-5 py-6 text-[12px] text-[#9ca3af]">No categories yet.</p>
            ) : (
              categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => (panel.mode === "edit" && panel.category.id === c.id ? setPanel({ mode: "empty" }) : openEdit(c))}
                  className={`flex items-center justify-between gap-3 border-t border-[#f0f0f0] px-5 py-3 text-left transition-colors hover:bg-[#fafbfc] ${
                    panel.mode === "edit" && panel.category.id === c.id ? "bg-[#eff6ff]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-[#1f2937]">{c.name}</p>
                      <span className="shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6b7280]">
                        {c.postCount} {c.postCount === 1 ? "post" : "posts"}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[#9ca3af]">/{c.slug}</p>
                    {c.description && <p className="mt-0.5 truncate text-[11px] text-[#6a7282]">{c.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canUpdate && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openEdit(c); } }}
                        className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#eff6ff] hover:text-[#1e4f86]"
                      >
                        <Pencil className="size-3.5" />
                      </span>
                    )}
                    {canDelete && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setDeleteTarget(c); } }}
                        className="flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
            {panel.mode === "empty" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-[#f3f4f6]">
                  <LayoutGrid className="size-5 text-[#9ca3af]" />
                </span>
                <p className="text-[14px] font-semibold text-[#1f2937]">No category selected</p>
                <p className="text-[12px] text-[#9ca3af]">Select a category to edit, or add a new one</p>
                {canCreate && (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="mt-1 flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574]"
                  >
                    <Plus className="size-4" /> Add New Category
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#eff6ff] text-[#1e4f86]">
                    <Plus className="size-4" />
                  </span>
                  <p className="text-[14px] font-semibold text-[#1f2937]">
                    {panel.mode === "edit" ? "Edit Category" : "Add New Category"}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Category Name *</label>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Market Insights"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>URL Slug</label>
                  <div className="flex h-10 w-full min-w-0 items-center overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white focus-within:border-[#1e4f86]">
                    <span className="shrink-0 pl-3.5 text-[12px] text-[#9ca3af]">/blog/category/</span>
                    <input
                      className="h-full w-full min-w-0 bg-transparent px-1 text-[12px] text-[#0a0a0a] outline-none placeholder:text-[#6a7282]"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="auto-generated"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Description</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-[12px] text-[#0a0a0a] outline-none placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this category…"
                  />
                </div>

                <div className="rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-4 py-3">
                  <p className="mb-1.5 text-[11px] text-[#9ca3af]">Preview</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1f2937]">{name.trim() || "Category Name"}</p>
                    <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6b7280]">
                      {panel.mode === "edit" ? panel.category.postCount : 0} posts
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPanel({ mode: "empty" })}
                    disabled={saving}
                    className="h-10 flex-1 rounded-[10px] border border-[#e5e7eb] text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] text-[13px] font-medium text-white hover:bg-[#1a4574] disabled:opacity-60"
                  >
                    {saving && <Loader2 className="size-3.5 animate-spin" />}
                    {panel.mode === "edit" ? "Save Changes" : "Add Category"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          busy={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
