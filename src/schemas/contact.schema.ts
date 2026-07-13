import { z } from "zod";

import { ContactType } from "@/generated/prisma/enums";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  type: z.nativeEnum(ContactType).default(ContactType.BUYER),
  location: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
  // IDs of Property records to link via ContactProperty join table.
  propertyIds: z.array(z.string()).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

// `.partial()` only wraps each field in `.optional()`; it doesn't remove a
// field's `.default(...)`, so an omitted `type` in a partial PATCH body
// would otherwise be silently coerced to BUYER and overwrite the existing
// value. Re-declare it as a plain optional.
export const updateContactSchema = createContactSchema.partial().extend({
  type: z.nativeEnum(ContactType).optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ── CSV import ────────────────────────────────────────────────────────────────

const importTypeSchema = z
  .string()
  .optional()
  .transform((v) => {
    const normalized = (v ?? "").trim().toLowerCase();
    if (normalized === "seller") return ContactType.SELLER;
    if (normalized === "both") return ContactType.BOTH;
    return ContactType.BUYER;
  });

export const importContactRowSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  type: importTypeSchema,
  location: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ImportContactRow = z.infer<typeof importContactRowSchema>;

export const importContactsSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1, "No rows to import").max(1000, "Import is limited to 1000 rows at a time"),
});
