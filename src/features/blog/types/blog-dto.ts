import type { BlogStatus } from "@/generated/prisma/enums";

export type BlogPostDto = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  author: string;
  status: BlogStatus;
  publishedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogMetrics = {
  total: number;
  published: number;
  drafts: number;
  categories: number;
};

/** Trimmed ticket returned to the browser to drive a direct cover upload. */
export type BlogCoverUploadTicket = {
  storagePath: string;
  token: string;
  /** Public URL the client stores on the post once the upload completes. */
  publicUrl: string;
};
