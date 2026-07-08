"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BlogCategoryDto } from "@/features/blog/types/blog-dto";

// Category deletes/renames can change a post's category text, so invalidate
// posts + metrics alongside the categories list itself.
function invalidateBlogCategories(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.blogCategories() });
  qc.invalidateQueries({ queryKey: queryKeys.blogPosts() });
  qc.invalidateQueries({ queryKey: queryKeys.blogMetrics() });
}

async function postCategory(body: unknown): Promise<{ category: BlogCategoryDto }> {
  const res = await fetch("/api/dashboard/blog/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create category");
  return data;
}

export function useCreateBlogCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postCategory,
    onSuccess: () => invalidateBlogCategories(qc),
  });
}

async function patchCategory({ id, body }: { id: string; body: unknown }): Promise<{ category: BlogCategoryDto }> {
  const res = await fetch(`/api/dashboard/blog/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update category");
  return data;
}

export function useUpdateBlogCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchCategory,
    onSuccess: () => invalidateBlogCategories(qc),
  });
}

async function deleteCategoryReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/blog/categories/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete category");
  return data;
}

export function useDeleteBlogCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategoryReq,
    onSuccess: () => invalidateBlogCategories(qc),
  });
}
