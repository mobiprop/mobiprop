import type { Metadata } from "next";

import { BlogPageContent } from "@/features/blog/BlogPage";
import { getPublishedBlogPosts } from "@/services/blog.service";

export const metadata: Metadata = {
  title: "Blog — Ulrich Propiedades",
  description:
    "Insights for the modern property market: expert analysis, local market trends, and guides for buyers, sellers, and investors.",
};

// Always render fresh so newly published/edited posts appear immediately.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const requestedPage = Math.max(1, Number(page) || 1);

  // Page 1 promotes the newest post to the featured hero, so it needs one extra
  // row to still fill the grid beneath it.
  const isFirstPage = requestedPage === 1;
  const { posts, totalPages } = await getPublishedBlogPosts({
    page: requestedPage,
    pageSize: isFirstPage ? PAGE_SIZE + 1 : PAGE_SIZE,
  });

  const featured = isFirstPage ? posts[0] ?? null : null;
  const gridPosts = isFirstPage ? posts.slice(1) : posts;

  return (
    <BlogPageContent
      posts={gridPosts}
      featured={featured}
      currentPage={requestedPage}
      totalPages={totalPages}
    />
  );
}
