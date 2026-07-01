import { z } from "zod";

import { BlogStatus } from "@/generated/prisma/enums";

// Fixed editorial taxonomy. Kept in sync with the public blog's category chips
// (see src/features/blog/BlogPage.tsx). Stored as text in the DB so the set can
// grow later without a migration, but writes are validated against this list.
export const BLOG_CATEGORIES = [
  "Architecture",
  "Interior",
  "Real Estate",
  "Design",
  "Investment",
  "Lifestyle",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

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
  category: z.enum(BLOG_CATEGORIES, { message: "Select a valid category" }),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  // Tiptap HTML. Non-empty means more than an empty paragraph.
  content: z
    .string()
    .min(1, "Content is required")
    .refine((v) => v.replace(/<[^>]*>/g, "").trim().length > 0, "Content is required"),
  author: z.string().min(1, "Author is required").max(120),
  // Public path the client resolved from an upload ticket, or an absolute URL.
  coverImageUrl: z.string().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(BlogStatus).default(BlogStatus.DRAFT),
};

export const createBlogPostSchema = z.object(baseBlogFields);
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z.object({
  title: baseBlogFields.title.optional(),
  category: baseBlogFields.category.optional(),
  excerpt: baseBlogFields.excerpt,
  content: baseBlogFields.content.optional(),
  author: baseBlogFields.author.optional(),
  coverImageUrl: baseBlogFields.coverImageUrl,
  status: z.nativeEnum(BlogStatus).optional(),
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
