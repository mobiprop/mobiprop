"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";

function invalidateBlog(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.blogPosts() });
  qc.invalidateQueries({ queryKey: queryKeys.blogMetrics() });
}

async function postBlog(body: unknown): Promise<{ post: BlogPostDto }> {
  const res = await fetch("/api/dashboard/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create post");
  return data;
}

export function useCreateBlogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postBlog,
    onSuccess: () => invalidateBlog(qc),
  });
}

async function patchBlog({ id, body }: { id: string; body: unknown }): Promise<{ post: BlogPostDto }> {
  const res = await fetch(`/api/dashboard/blog/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update post");
  return data;
}

export function useUpdateBlogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchBlog,
    onSuccess: () => invalidateBlog(qc),
  });
}

async function deleteBlogReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/blog/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete post");
  return data;
}

export function useDeleteBlogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBlogReq,
    onSuccess: () => invalidateBlog(qc),
  });
}

async function patchBlogFeatured({ id, isFeatured }: { id: string; isFeatured: boolean }): Promise<{ post: BlogPostDto }> {
  const res = await fetch(`/api/dashboard/blog/${id}/featured`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFeatured }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update featured post");
  return data;
}

export function useToggleBlogFeaturedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchBlogFeatured,
    onSuccess: () => invalidateBlog(qc),
  });
}
