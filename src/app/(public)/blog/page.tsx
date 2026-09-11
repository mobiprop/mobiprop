import type { Metadata } from "next";

import { BlogPageContent } from "@/features/blog/BlogPage";
import { getPublishedBlogPosts } from "@/services/blog.service";

export const metadata: Metadata = {
  title: "Blog — Mobi Prop",
  description: "Análisis del mercado inmobiliario y guías para compradores, vendedores e inversores.",
};

// Always render fresh so newly published/edited posts appear immediately.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const { page, q = "", category = "" } = await searchParams;
  const requestedPage = Math.max(1, Math.floor(Number(page)) || 1);
  const [{ posts, totalPages }, highlights] = await Promise.all([
    getPublishedBlogPosts({ page: requestedPage, pageSize: PAGE_SIZE, query: q.trim(), category }),
    getPublishedBlogPosts({ page: 1, pageSize: 5 }),
  ]);
  const featured = highlights.posts[0] ?? null;
  const gridPosts = posts;

  return (
    <BlogPageContent
      posts={gridPosts}
      highlights={highlights.posts.slice(1)}
      featured={featured}
      currentPage={requestedPage}
      totalPages={totalPages}
    />
  );
}
