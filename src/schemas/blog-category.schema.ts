import { z } from "zod";

const baseCategoryFields = {
  name: z.string().min(1, "Name is required").max(60),
  // User-editable override; falls back to a slugified name when omitted.
  slug: z.string().min(1).max(80).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
};

export const createBlogCategorySchema = z.object(baseCategoryFields);
export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;

export const updateBlogCategorySchema = z.object({
  name: baseCategoryFields.name.optional(),
  slug: baseCategoryFields.slug,
  description: baseCategoryFields.description,
});
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
