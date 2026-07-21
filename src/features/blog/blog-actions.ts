import "server-only";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { mintBlogCoverUploadTicket } from "@/lib/supabase/storage";
import { BlogStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogCoverUploadTicketRequestSchema,
  slugifyTitle,
} from "@/schemas/blog.schema";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "@/schemas/blog.schema";
import type { BlogPostDto, BlogMetrics, BlogCoverUploadTicket } from "./types/blog-dto";
import { filterDummyBlogPosts, dummyBlogMetrics } from "./blog-dummy-data";

export type BlogActionError = { ok: false; error: string; status: number };
export type BlogActionResult<T> = ({ ok: true } & T) | BlogActionError;

// Refresh the public marketing pages that read published posts after any write.
// The public blog pages are force-dynamic, but the homepage "Continue Reading"
// section benefits from an explicit revalidate.
function revalidatePublicBlog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

// The `blog_posts` migration is intentionally not applied yet (scaffold-first).
// Until it is, Prisma throws P2021 ("table does not exist") — detect that so the
// dashboard can preview dummy content instead of erroring. Once migrated, the
// real DB path takes over automatically.
function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021"
  );
}

// True until the blog is actually wired to the DB. Two cases fall here:
//  - the `blog_posts` migration hasn't been applied (Prisma throws P2021), or
//  - the running process still holds a Prisma client generated before the
//    BlogPost model existed, so `prisma.blogPost` is undefined (a dev-only
//    situation until the server restarts after `prisma generate`).
// In both cases we serve dummy data instead of erroring. Once the client is
// current AND the table exists, this is false and the real DB path runs.
function blogModelUnavailable(): boolean {
  return !(prisma as { blogPost?: unknown }).blogPost;
}

// ── DTO ─────────────────────────────────────────────────────────────────────

type BlogPostRow = {
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

function toBlogDto(p: BlogPostRow): BlogPostDto {
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

// Promotes any SCHEDULED post whose scheduledAt has passed to PUBLISHED. Called
// at the top of every read path (list/metrics here, plus the public blog.service.ts
// reads) so scheduling works without a dedicated cron worker.
async function promoteDuePosts(): Promise<void> {
  if (blogModelUnavailable()) return;
  try {
    await prisma.blogPost.updateMany({
      where: { status: BlogStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
      data: { status: BlogStatus.PUBLISHED, publishedAt: new Date() },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }
}

// ── Slug generation (server-side only, never trusted from the client) ─────────

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugifyTitle(title) || "post";
  let candidate = base;
  let suffix = 2;
  // Loop until we find a slug not taken by another post.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listBlogPosts(
  filters: Record<string, string> = {},
): Promise<BlogActionResult<{ posts: BlogPostDto[] }>> {
  const gate = await requirePermission("blog:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const where: Prisma.BlogPostWhereInput = {};

  if (filters.status === "DRAFT" || filters.status === "SCHEDULED" || filters.status === "PUBLISHED") {
    where.status = filters.status as BlogStatus;
  }
  if (filters.category) where.category = filters.category;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  if (blogModelUnavailable()) return { ok: true, posts: filterDummyBlogPosts(filters) };

  try {
    await promoteDuePosts();
    const posts = await prisma.blogPost.findMany({ where, orderBy: { updatedAt: "desc" } });
    return { ok: true, posts: posts.map(toBlogDto) };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { ok: true, posts: filterDummyBlogPosts(filters) };
    }
    throw error;
  }
}

// ── Metrics ─────────────────────────────────────────────────────────────────

export async function getBlogMetrics(): Promise<BlogActionResult<{ metrics: BlogMetrics }>> {
  const gate = await requirePermission("blog:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (blogModelUnavailable()) return { ok: true, metrics: dummyBlogMetrics() };

  try {
    await promoteDuePosts();
    const [total, published, drafts, categories] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: BlogStatus.PUBLISHED } }),
      prisma.blogPost.count({ where: { status: BlogStatus.DRAFT } }),
      prisma.blogCategory.count(),
    ]);

    return {
      ok: true,
      metrics: {
        total,
        published,
        drafts,
        categories,
      },
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { ok: true, metrics: dummyBlogMetrics() };
    }
    throw error;
  }
}

// ── Get one ───────────────────────────────────────────────────────────────────

export async function getBlogPost(id: string): Promise<BlogActionResult<{ post: BlogPostDto }>> {
  const gate = await requirePermission("blog:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return { ok: false, error: "Blog post not found", status: 404 };
  return { ok: true, post: toBlogDto(post) };
}

// ── Category validation (skips silently if the categories table isn't migrated yet) ──

function categoryModelUnavailable(): boolean {
  return !(prisma as { blogCategory?: unknown }).blogCategory;
}

async function validateCategoryName(name?: string): Promise<string | null> {
  if (!name) return null;
  if (categoryModelUnavailable()) return null;
  const found = await prisma.blogCategory.findFirst({ where: { name }, select: { id: true } });
  if (!found) return "Select a valid category";
  return null;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createBlogPost(
  input: CreateBlogPostInput,
): Promise<BlogActionResult<{ post: BlogPostDto }>> {
  const gate = await requirePermission("blog:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createBlogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }
  const data = parsed.data;

  // Publishing requires the extra permission; agents may only save drafts.
  if (data.status === BlogStatus.PUBLISHED) {
    const pub = await requirePermission("blog:publish");
    if (!pub.ok) return { ok: false, error: "You don't have permission to publish posts.", status: 403 };
  }

  const categoryError = await validateCategoryName(data.category || undefined);
  if (categoryError) return { ok: false, error: categoryError, status: 400 };

  const slug = await uniqueSlug(data.slug || data.title);

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: data.title,
      category: data.category || null,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      author: data.author,
      tags: data.tags,
      status: data.status,
      scheduledAt: data.status === BlogStatus.SCHEDULED && data.scheduledAt ? new Date(data.scheduledAt) : null,
      publishedAt: data.status === BlogStatus.PUBLISHED ? new Date() : null,
      createdById: gate.profile.id,
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_POST_CREATED",
    entityType: "BLOG_POST",
    entityId: post.id,
    newValues: { slug: post.slug, title: post.title, status: post.status },
  });

  if (post.status === BlogStatus.PUBLISHED) revalidatePublicBlog(post.slug);

  return { ok: true, post: toBlogDto(post) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput,
): Promise<BlogActionResult<{ post: BlogPostDto }>> {
  const gate = await requirePermission("blog:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateBlogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }
  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Blog post not found", status: 404 };

  // A status transition into/out of PUBLISHED needs the publish permission.
  const statusChanging = data.status !== undefined && data.status !== existing.status;
  if (statusChanging) {
    const pub = await requirePermission("blog:publish");
    if (!pub.ok) return { ok: false, error: "You don't have permission to publish or unpublish posts.", status: 403 };
  }

  if (data.category !== undefined) {
    const categoryError = await validateCategoryName(data.category || undefined);
    if (categoryError) return { ok: false, error: categoryError, status: 400 };
  }

  const nextStatus = data.status ?? existing.status;
  const becomingPublished = nextStatus === BlogStatus.PUBLISHED && existing.status !== BlogStatus.PUBLISHED;

  // Slug: an explicit slug edit takes priority; otherwise a title change re-derives it
  // (existing behavior). Untouched slug/title leaves the slug alone.
  let slugUpdate: string | undefined;
  if (data.slug) {
    slugUpdate = await uniqueSlug(data.slug, id);
  } else if (data.title !== undefined) {
    slugUpdate = await uniqueSlug(data.title, id);
  }

  // scheduledAt: explicit value wins; otherwise clear it once the post leaves SCHEDULED.
  let scheduledAtUpdate: Date | null | undefined;
  if (data.scheduledAt !== undefined) {
    scheduledAtUpdate = data.scheduledAt ? new Date(data.scheduledAt) : null;
  } else if (statusChanging && nextStatus !== BlogStatus.SCHEDULED) {
    scheduledAtUpdate = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(slugUpdate !== undefined && { slug: slugUpdate }),
      ...(data.category !== undefined && { category: data.category || null }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt || null }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(scheduledAtUpdate !== undefined && { scheduledAt: scheduledAtUpdate }),
      // First time it goes live, stamp publishedAt; keep original stamp otherwise.
      ...(becomingPublished && { publishedAt: new Date() }),
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: statusChanging ? "BLOG_POST_STATUS_CHANGED" : "BLOG_POST_UPDATED",
    entityType: "BLOG_POST",
    entityId: id,
    oldValues: { title: existing.title, status: existing.status },
    newValues: { title: post.title, status: post.status },
  });

  // Revalidate for both the old and new slug (a title change moves the URL).
  revalidatePublicBlog(post.slug);
  if (existing.slug !== post.slug) revalidatePublicBlog(existing.slug);

  return { ok: true, post: toBlogDto(post) };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteBlogPost(id: string): Promise<BlogActionResult<{ id: string }>> {
  const gate = await requirePermission("blog:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Blog post not found", status: 404 };

  await prisma.blogPost.delete({ where: { id } });

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_POST_DELETED",
    entityType: "BLOG_POST",
    entityId: id,
    oldValues: { slug: existing.slug, title: existing.title, status: existing.status },
  });

  revalidatePublicBlog(existing.slug);

  return { ok: true, id };
}

// ── Featured ──────────────────────────────────────────────────────────────────
// Only one post is ever featured at a time (it's a single hero slot on the
// public blog page) — setting isFeatured=true on one post clears it on every
// other post in the same transaction, rather than requiring the caller to
// find-and-unset the previous one first.

export async function toggleBlogFeatured(
  id: string,
  isFeatured: boolean,
): Promise<BlogActionResult<{ post: BlogPostDto }>> {
  const gate = await requirePermission("blog:publish");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Blog post not found", status: 404 };

  const [, post] = await prisma.$transaction([
    prisma.blogPost.updateMany({
      where: { isFeatured: true, id: { not: id } },
      data: { isFeatured: false },
    }),
    prisma.blogPost.update({ where: { id }, data: { isFeatured } }),
  ]);

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_POST_FEATURED_CHANGED",
    entityType: "BLOG_POST",
    entityId: id,
    oldValues: { isFeatured: existing.isFeatured },
    newValues: { isFeatured: post.isFeatured },
  });

  revalidatePublicBlog(post.slug);

  return { ok: true, post: toBlogDto(post) };
}

// ── Cover upload ticket ───────────────────────────────────────────────────────

export async function prepareBlogCoverUpload(
  input: unknown,
): Promise<BlogActionResult<{ ticket: BlogCoverUploadTicket }>> {
  const gate = await requirePermission("blog:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = blogCoverUploadTicketRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  try {
    const t = await mintBlogCoverUploadTicket(parsed.data.files[0]);
    return {
      ok: true,
      ticket: { storagePath: t.storagePath, token: t.token, publicUrl: t.publicUrl },
    };
  } catch (error) {
    console.error("[blog] failed to mint cover upload ticket", error);
    return { ok: false, error: "Failed to prepare image upload. Please try again.", status: 500 };
  }
}
