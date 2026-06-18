import { z } from "zod";

import { OpportunityStage, OpportunityStatus } from "@/generated/prisma/enums";

export const createOpportunitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  contactId: z.string().optional(),
  contactSide: z.enum(["Buyer", "Seller"]).optional(),
  propertyId: z.string().optional(),
  dealType: z.enum(["Rent", "Sale"]).optional(),
  dealSize: z.coerce.number().positive().optional(),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.QUALIFICATION),
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.OPEN),
  probability: z.coerce.number().int().min(0).max(100).default(50),
  commission: z.coerce.number().nonnegative().optional(),
  commissionUnit: z.enum(["%", "$"]).optional(),
  paymentTerms: z.string().max(500).optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  expectedCloseAt: z.string().optional(),
  agentCommission: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema.partial();
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
