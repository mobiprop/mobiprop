import { z } from "zod";

import { BlogStatus } from "@/generated/prisma/enums";

// Cover image cap — matches the listings image limit UX (2K/WebP optimized).
export const BLOG_COVER_MAX_BYTES = 8 * 1024 * 1024;

export const blogCoverUploadTicketRequestSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum(["image/jpeg", "image/png", "image/webp"], {
          message: "Cover image must be a JPG, PNG, or WEBP file",
        }),
        size: z.number().int().positive().max(BLOG_COVER_MAX_BYTES, "Cover image is too large"),
      }),
    )
    .length(1, "Exactly one cover image is expected"),
});

const baseBlogFields = {
  title: z.string().min(1, "Title is required").max(200),
  // Free text, checked against live BlogCategory rows in blog-actions.ts — categories
  // are managed from the dashboard (see blog-category.schema.ts), not a fixed enum.
  category: z.string().min(1).max(80).optional().or(z.literal("")),
  // User-editable override; falls back to slugifyTitle(title) when omitted.
  slug: z.string().min(1).max(80).optional().or(z.literal("")),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  // Tiptap HTML. Non-empty means more than an empty paragraph.
  content: z
    .string()
    .min(1, "Content is required")
    .refine((v) => v.replace(/<[^>]*>/g, "").trim().length > 0, "Content is required"),
  author: z.string().min(1, "Author is required").max(120),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  // Public path the client resolved from an upload ticket, or an absolute URL.
  coverImageUrl: z.string().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(BlogStatus).default(BlogStatus.DRAFT),
  // Required (and must be in the future) only when status is SCHEDULED — enforced below.
  scheduledAt: z.string().datetime().optional().or(z.literal("")),
};

function requireFutureScheduledAt(data: { status: BlogStatus; scheduledAt?: string }, ctx: z.RefinementCtx) {
  if (data.status !== BlogStatus.SCHEDULED) return;
  if (!data.scheduledAt) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "A publish date is required for scheduled posts" });
    return;
  }
  if (new Date(data.scheduledAt).getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Publish date must be in the future" });
  }
}

export const createBlogPostSchema = z.object(baseBlogFields).superRefine(requireFutureScheduledAt);
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z
  .object({
    title: baseBlogFields.title.optional(),
    category: baseBlogFields.category,
    slug: baseBlogFields.slug,
    excerpt: baseBlogFields.excerpt,
    content: baseBlogFields.content.optional(),
    author: baseBlogFields.author.optional(),
    tags: baseBlogFields.tags.optional(),
    coverImageUrl: baseBlogFields.coverImageUrl,
    status: z.nativeEnum(BlogStatus).optional(),
    scheduledAt: baseBlogFields.scheduledAt,
  })
  .superRefine((data, ctx) => {
    if (data.status === undefined) return;
    requireFutureScheduledAt({ status: data.status, scheduledAt: data.scheduledAt }, ctx);
  });
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

/** Slugify a title into a URL-safe, deduplicable base slug. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
