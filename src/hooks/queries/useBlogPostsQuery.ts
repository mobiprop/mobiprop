import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { BlogPostDto, BlogMetrics, BlogCategoryDto } from "@/features/blog/types/blog-dto";

export type BlogPostFilters = {
  status?: string;
  category?: string;
  search?: string;
};

async function fetchBlogPosts(filters: BlogPostFilters): Promise<{ posts: BlogPostDto[] }> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);

  const qs = params.toString();
  const res = await fetch(`/api/dashboard/blog${qs ? `?${qs}` : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch blog posts");
  return data;
}

export function useBlogPostsQuery(filters: BlogPostFilters = {}) {
  return useQuery({
    queryKey: queryKeys.blogPosts(filters),
    queryFn: () => fetchBlogPosts(filters),
    staleTime: 30_000,
  });
}

async function fetchBlogMetrics(): Promise<{ metrics: BlogMetrics }> {
  const res = await fetch("/api/dashboard/blog/metrics");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch blog metrics");
  return data;
}

export function useBlogMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.blogMetrics(),
    queryFn: fetchBlogMetrics,
    staleTime: 30_000,
  });
}

async function fetchBlogCategories(): Promise<{ categories: BlogCategoryDto[] }> {
  const res = await fetch("/api/dashboard/blog/categories");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch categories");
  return data;
}

export function useBlogCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.blogCategories(),
    queryFn: fetchBlogCategories,
    staleTime: 30_000,
  });
}
