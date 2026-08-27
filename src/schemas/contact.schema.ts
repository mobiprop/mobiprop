import { z } from "zod";

import { ContactType } from "@/generated/prisma/enums";

// BOTH is retired — a contact who is both buyer and seller now just holds
// both roles in the array. It stays in the Postgres enum (old rows/activity
// log snapshots may reference it) but is never written by new code.
export const SELECTABLE_CONTACT_ROLES = [
  ContactType.BUYER,
  ContactType.SELLER,
  ContactType.TENANT,
  ContactType.OWNER,
  ContactType.REAL_ESTATE_COMPANY,
] as const;

const contactRolesSchema = z
  .array(z.nativeEnum(ContactType))
  .min(1, "Select at least one role")
  .refine((roles) => roles.every((role) => (SELECTABLE_CONTACT_ROLES as readonly ContactType[]).includes(role)), {
    message: "Invalid role",
  });

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  roles: contactRolesSchema.default([ContactType.BUYER]),
  location: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
  // IDs of Property records to link via ContactProperty join table.
  propertyIds: z.array(z.string()).optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

// `.partial()` only wraps each field in `.optional()`; it doesn't remove a
// field's `.default(...)`, so an omitted `roles` in a partial PATCH body
// would otherwise be silently coerced to [BUYER] and overwrite the existing
// value. Re-declare it as a plain optional.
export const updateContactSchema = createContactSchema.partial().extend({
  roles: contactRolesSchema.optional(),
  // Reassign the owning/assigned agent (item #6 masking) — ADMIN/MANAGER
  // only; the server strips this for anyone else. Not part of creation,
  // where it's always forced to the creator.
  assignedAgentId: z.string().uuid().nullable().optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ── CSV import ────────────────────────────────────────────────────────────────

// Zonaprop/local exports use free-text role labels, EN or ES, sometimes
// combined (e.g. "buyer/seller"). Recognizes any number of role words
// separated by common delimiters; unrecognized text defaults to BUYER,
// matching the prior single-role importer's fallback.
const ROLE_WORD_MAP: Record<string, ContactType> = {
  buyer: ContactType.BUYER,
  comprador: ContactType.BUYER,
  seller: ContactType.SELLER,
  vendedor: ContactType.SELLER,
  tenant: ContactType.TENANT,
  inquilino: ContactType.TENANT,
  owner: ContactType.OWNER,
  propietario: ContactType.OWNER,
  "real estate company": ContactType.REAL_ESTATE_COMPANY,
  inmobiliaria: ContactType.REAL_ESTATE_COMPANY,
  both: ContactType.BUYER, // expanded below alongside SELLER
  ambos: ContactType.BUYER,
};

const importRolesSchema = z
  .string()
  .optional()
  .transform((v): ContactType[] => {
    const normalized = (v ?? "").trim().toLowerCase();
    if (!normalized) return [ContactType.BUYER];

    const isBoth = normalized === "both" || normalized === "ambos";
    const words = normalized.split(/[,/;&]+| y | and /).map((w) => w.trim()).filter(Boolean);
    const roles = new Set<ContactType>();
    if (isBoth) {
      roles.add(ContactType.BUYER);
      roles.add(ContactType.SELLER);
    }
    for (const word of words) {
      const role = ROLE_WORD_MAP[word];
      if (role) roles.add(role);
    }

    return roles.size > 0 ? [...roles] : [ContactType.BUYER];
  });

export const importContactRowSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  roles: importRolesSchema,
  location: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ImportContactRow = z.infer<typeof importContactRowSchema>;

export const importContactsSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1, "No rows to import").max(1000, "Import is limited to 1000 rows at a time"),
});
