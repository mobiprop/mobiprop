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

export const updateContactSchema = createContactSchema.partial();
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
