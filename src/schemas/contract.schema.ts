import { z } from "zod";

import { ContractType, ContractStatus } from "@/generated/prisma/enums";

// BUYER/SELLER rows link a real Contact; AGENCY rows (a co-broking real
// estate company) are just a free-text name — no Contact record needed.
const contractParticipantSchema = z
  .object({
    role: z.enum(["BUYER", "SELLER", "AGENCY"]),
    contactId: z.string().trim().min(1).optional(),
    companyName: z.string().trim().min(1).max(150).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "AGENCY") {
      if (!data.companyName) {
        ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required" });
      }
    } else if (!data.contactId) {
      ctx.addIssue({ code: "custom", path: ["contactId"], message: "Contact is required" });
    }
  });

export type ContractParticipantInput = z.infer<typeof contractParticipantSchema>;

export const createContractSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  participants: z.array(contractParticipantSchema).min(1, "At least one participant is required"),
  propertyIds: z.array(z.string().trim().min(1)).min(1, "At least one listing is required"),
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
