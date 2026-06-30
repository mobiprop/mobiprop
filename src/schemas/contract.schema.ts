import { z } from "zod";

import { ContractType, ContractStatus } from "@/generated/prisma/enums";

export const createContractSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  opportunityId: z.string().optional(),
  type: z.nativeEnum(ContractType).default(ContractType.SALE),
  status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),
  value: z.coerce.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const updateContractSchema = createContractSchema.partial();
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
