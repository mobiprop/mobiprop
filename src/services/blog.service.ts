import "server-only";

import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";

// Public, unauthenticated read layer for the marketing site. Only ever exposes
// PUBLISHED posts (drafts stay dashboard-only). Server-only — imported by the
// public blog server components.
//
// Every function degrades to empty/null if the blog_posts table doesn't exist
// yet (Prisma P2021) or the running client predates the model, so the public
// site never 500s before the migration is applied.

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  author: string;
  tags: string[];
  status: BlogStatus;
  isFeatured: boolean;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(p: BlogRow): BlogPostDto {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    author: p.author,
    tags: p.tags,
    status: p.status,
    isFeatured: p.isFeatured,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdById: p.createdById,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function blogUnavailable(error: unknown): boolean {
  if (!(prisma as { blogPost?: unknown }).blogPost) return true;
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

// Promotes any SCHEDULED post whose scheduledAt has passed to PUBLISHED, so the
// public site and the dashboard both see it without a dedicated cron worker.
// Mirrors the same helper in blog-actions.ts (kept local — this module already
// duplicates its own availability check rather than importing dashboard code).
async function promoteDuePosts(): Promise<void> {
  if (!(prisma as { blogPost?: unknown }).blogPost) return;
  try {
    await prisma.blogPost.updateMany({
      where: { status: BlogStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
      data: { status: BlogStatus.PUBLISHED, publishedAt: new Date() },
    });
  } catch (error) {
    if (!blogUnavailable(error)) throw error;
  }
}

// Newest first: published date, then creation date as a tiebreaker.
const PUBLISHED_ORDER = [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];

// Same as PUBLISHED_ORDER, but the manually pinned post (if any) sorts first
// regardless of its publish date — used only by getPublishedBlogPosts, whose
// first result becomes the /blog page's hero. Falls back to newest-first when
// nothing is pinned, preserving the previous "newest = featured" behavior.
const PUBLISHED_ORDER_FEATURED_FIRST = [{ isFeatured: "desc" as const }, ...PUBLISHED_ORDER];

export type PublishedBlogList = {
  posts: BlogPostDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getPublishedBlogPosts({
  page = 1,
  pageSize = 9,
  query = "",
  category = "",
}: { page?: number; pageSize?: number; query?: string; category?: string } = {}): Promise<PublishedBlogList> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const empty: PublishedBlogList = { posts: [], total: 0, page: safePage, pageSize, totalPages: 0 };

  if (!(prisma as { blogPost?: unknown }).blogPost) return empty;

  try {
    await promoteDuePosts();
    const where: Prisma.BlogPostWhereInput = { status: BlogStatus.PUBLISHED, ...(category ? { category } : {}), ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }] } : {}) };
    const [rows, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: PUBLISHED_ORDER_FEATURED_FIRST,
        skip: (safePage - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);
    return {
      posts: rows.map(toDto),
      total,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    if (blogUnavailable(error)) return empty;
    throw error;
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostDto | null> {
  if (!(prisma as { blogPost?: unknown }).blogPost) return null;
  try {
    await promoteDuePosts();
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: BlogStatus.PUBLISHED },
    });
    return post ? toDto(post) : null;
  } catch (error) {
    if (blogUnavailable(error)) return null;
    throw error;
  }
}

export async function getRecentBlogPosts(limit = 3): Promise<BlogPostDto[]> {
  if (!(prisma as { blogPost?: unknown }).blogPost) return [];
  try {
    await promoteDuePosts();
    const rows = await prisma.blogPost.findMany({
      where: { status: BlogStatus.PUBLISHED },
      orderBy: PUBLISHED_ORDER,
      take: limit,
    });
    return rows.map(toDto);
  } catch (error) {
    if (blogUnavailable(error)) return [];
    throw error;
  }
}

/** Same-category published posts, excluding the current one. Falls back to most
 * recent posts if there aren't enough in the category. */
export async function getRelatedBlogPosts(
  slug: string,
  category: string | null,
  limit = 3,
): Promise<BlogPostDto[]> {
  if (!(prisma as { blogPost?: unknown }).blogPost) return [];
  try {
    await promoteDuePosts();
    const sameCategory = category
      ? await prisma.blogPost.findMany({
          where: { status: BlogStatus.PUBLISHED, category, slug: { not: slug } },
          orderBy: PUBLISHED_ORDER,
          take: limit,
        })
      : [];

    if (sameCategory.length >= limit) return sameCategory.map(toDto);

    // Top up with other recent posts (excluding self + already-picked).
    const excludeSlugs = [slug, ...sameCategory.map((p) => p.slug)];
    const filler = await prisma.blogPost.findMany({
      where: { status: BlogStatus.PUBLISHED, slug: { notIn: excludeSlugs } },
      orderBy: PUBLISHED_ORDER,
      take: limit - sameCategory.length,
    });
    return [...sameCategory, ...filler].map(toDto);
  } catch (error) {
    if (blogUnavailable(error)) return [];
    throw error;
  }
}
