import { z } from "zod";

import { OpportunityStage, OpportunityStatus, Currency } from "@/generated/prisma/enums";

// BUYER/SELLER/TENANT/OWNER rows link a real Contact; AGENCY rows (a
// co-broking real estate company) are just a free-text name — no Contact
// record needed.
const participantSchema = z
  .object({
    role: z.enum(["BUYER", "SELLER", "TENANT", "OWNER", "AGENCY"]),
    contactId: z.string().trim().min(1).optional(),
    companyName: z.string().trim().min(1).max(150).optional(),
    // AGENCY rows only — optional, but needed to pick the agency as a
    // DocuSign signer (they have no Contact record/email otherwise).
    companyEmail: z.string().trim().email().max(200).optional(),
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

export type ParticipantInput = z.infer<typeof participantSchema>;

export const createOpportunitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  // Required: the lifecycle rule is Contact → Lead → Opportunity → Contract —
  // an Opportunity can't exist without at least one real client (Buyer,
  // Seller, Tenant or Owner) behind it. Co-broking agencies alone aren't enough.
  participants: z
    .array(participantSchema)
    .min(1, "At least one participant is required")
    .refine(
      (rows) => rows.some((r) => r.role === "BUYER" || r.role === "SELLER" || r.role === "TENANT" || r.role === "OWNER"),
      { message: "At least one Buyer, Seller, Tenant or Owner is required" },
    ),
  propertyIds: z.array(z.string().trim().min(1)).optional(),
  dealType: z.enum(["Rent", "Sale"]).optional(),
  dealSize: z.coerce.number().positive().optional(),
  // Currency dealSize/commission are entered in — independent of any linked
  // listing's currency, since dealSize is a manually-typed figure.
  currency: z.nativeEnum(Currency).default(Currency.USD),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.QUALIFICATION),
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.OPEN),
  probability: z.coerce.number().int().min(0).max(100).default(50),
  commission: z.coerce.number().nonnegative().optional(),
  commissionUnit: z.enum(["%", "$"]).optional(),
  paymentTerms: z.string().max(500).optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  expectedCloseAt: z.string().optional(),
  agentCommissionValue: z.coerce.number().nonnegative().optional(),
  agentCommissionUnit: z.enum(["%", "$"]).optional(),
  notes: z.string().max(2000).optional(),
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

// `.partial()` only wraps each field in `.optional()`; it doesn't remove a
// field's `.default(...)`, so an omitted stage/status/probability in a
// partial PATCH body would otherwise be silently coerced to the create-time
// default and overwrite the existing value. Re-declare all three as plain
// optionals.
export const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  stage: z.nativeEnum(OpportunityStage).optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  currency: z.nativeEnum(Currency).optional(),
  // Only consumed when this update closes an ARS-currency deal (status
  // transitioning into CLOSED_WON) — lets the closer override the
  // auto-fetched Dólar Blue rate before it's locked in permanently.
  exchangeRateOverride: z.coerce.number().positive().optional(),
});
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
