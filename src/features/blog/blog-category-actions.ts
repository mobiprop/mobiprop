import "server-only";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { Prisma } from "@/generated/prisma/client";
import {
  createBlogCategorySchema,
  updateBlogCategorySchema,
} from "@/schemas/blog-category.schema";
import type { CreateBlogCategoryInput, UpdateBlogCategoryInput } from "@/schemas/blog-category.schema";
import { slugifyTitle } from "@/schemas/blog.schema";
import type { BlogCategoryDto } from "./types/blog-dto";

export type BlogActionError = { ok: false; error: string; status: number };
export type BlogActionResult<T> = ({ ok: true } & T) | BlogActionError;

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function categoryModelUnavailable(): boolean {
  return !(prisma as { blogCategory?: unknown }).blogCategory;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toCategoryDto(c: CategoryRow, postCount: number): BlogCategoryDto {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    postCount,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugifyTitle(name) || "category";
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.blogCategory.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listBlogCategories(): Promise<BlogActionResult<{ categories: BlogCategoryDto[] }>> {
  const gate = await requirePermission("blog:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (categoryModelUnavailable()) return { ok: true, categories: [] };

  try {
    const categories = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
    const counts = await Promise.all(
      categories.map((c) => prisma.blogPost.count({ where: { category: c.name } })),
    );
    return { ok: true, categories: categories.map((c, i) => toCategoryDto(c, counts[i])) };
  } catch (error) {
    if (isMissingTableError(error)) return { ok: true, categories: [] };
    throw error;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createBlogCategory(
  input: CreateBlogCategoryInput,
): Promise<BlogActionResult<{ category: BlogCategoryDto }>> {
  const gate = await requirePermission("blog:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createBlogCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }
  const data = parsed.data;

  const existingName = await prisma.blogCategory.findFirst({ where: { name: data.name }, select: { id: true } });
  if (existingName) return { ok: false, error: "A category with this name already exists", status: 400 };

  const slug = await uniqueCategorySlug(data.slug || data.name);

  const category = await prisma.blogCategory.create({
    data: { name: data.name, slug, description: data.description || null },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_CATEGORY_CREATED",
    entityType: "BLOG_CATEGORY",
    entityId: category.id,
    newValues: { name: category.name, slug: category.slug },
  });

  revalidatePath("/blog");

  return { ok: true, category: toCategoryDto(category, 0) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateBlogCategory(
  id: string,
  input: UpdateBlogCategoryInput,
): Promise<BlogActionResult<{ category: BlogCategoryDto }>> {
  const gate = await requirePermission("blog:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateBlogCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }
  const data = parsed.data;

  const existing = await prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Category not found", status: 404 };

  if (data.name && data.name !== existing.name) {
    const clash = await prisma.blogCategory.findFirst({ where: { name: data.name, id: { not: id } }, select: { id: true } });
    if (clash) return { ok: false, error: "A category with this name already exists", status: 400 };
  }

  let slugUpdate: string | undefined;
  if (data.slug) {
    slugUpdate = await uniqueCategorySlug(data.slug, id);
  } else if (data.name && data.name !== existing.name) {
    slugUpdate = await uniqueCategorySlug(data.name, id);
  }

  const category = await prisma.blogCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slugUpdate !== undefined && { slug: slugUpdate }),
      ...(data.description !== undefined && { description: data.description || null }),
    },
  });

  // A rename needs to follow through to every post denormalizing the old name.
  if (data.name && data.name !== existing.name) {
    await prisma.blogPost.updateMany({ where: { category: existing.name }, data: { category: category.name } });
  }

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_CATEGORY_UPDATED",
    entityType: "BLOG_CATEGORY",
    entityId: id,
    oldValues: { name: existing.name },
    newValues: { name: category.name },
  });

  revalidatePath("/blog");

  const postCount = await prisma.blogPost.count({ where: { category: category.name } });
  return { ok: true, category: toCategoryDto(category, postCount) };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteBlogCategory(id: string): Promise<BlogActionResult<{ id: string }>> {
  const gate = await requirePermission("blog:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Category not found", status: 404 };

  // Posts keep their content; they just lose this category (shown as Uncategorized).
  await prisma.blogPost.updateMany({ where: { category: existing.name }, data: { category: null } });
  await prisma.blogCategory.delete({ where: { id } });

  await logActivity({
    actorId: gate.profile.id,
    action: "BLOG_CATEGORY_DELETED",
    entityType: "BLOG_CATEGORY",
    entityId: id,
    oldValues: { name: existing.name },
  });

  revalidatePath("/blog");

  return { ok: true, id };
}
