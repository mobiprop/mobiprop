import { z } from "zod";

import { LeadSource, LeadTemperature, LeadLifecycleStatus } from "@/generated/prisma/enums";

export const createLeadSchema = z.object({
  // Contact — either link existing or provide info to create new
  contactId: z.string().optional(),
  submittedName: z.string().min(1, "Name is required").max(200),
  submittedEmail: z
    .string()
    .email("Invalid email")
    .transform((v) => v.toLowerCase().trim())
    .optional()
    .or(z.literal("")),
  submittedPhone: z.string().max(50).optional(),
  submittedLocation: z.string().max(200).optional(),

  // Lead metadata
  source: z.nativeEnum(LeadSource),
  sourceDetail: z.string().max(200).optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  externalSource: z.string().max(100).optional(),
  externalSourceId: z.string().max(200).optional(),
  importBatchId: z.string().max(100).optional(),

  // Property interest
  primaryListingId: z.string().optional(),

  // Budget
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  currency: z.string().max(3).default("ARS"),

  // Quality
  score: z.coerce.number().int().min(0).max(100).default(0),
  temperature: z.nativeEnum(LeadTemperature).default(LeadTemperature.COLD),
  lifecycleStatus: z.nativeEnum(LeadLifecycleStatus).default(LeadLifecycleStatus.NEW),

  // Assignment
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional().or(z.literal("")),

  // Notes & scheduling
  notes: z.string().max(5000).optional(),
  nextFollowUpAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
}).refine(
  (d) => !d.budgetMin || !d.budgetMax || d.budgetMin <= d.budgetMax,
  { message: "Budget minimum cannot exceed maximum", path: ["budgetMin"] },
);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  submittedName: z.string().min(1).max(200).optional(),
  submittedEmail: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim())
    .optional()
    .or(z.literal("")),
  submittedPhone: z.string().max(50).optional(),
  submittedLocation: z.string().max(200).optional(),
  primaryListingId: z.string().optional().nullable(),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().max(3).optional(),
  score: z.coerce.number().int().min(0).max(100).optional(),
  temperature: z.nativeEnum(LeadTemperature).optional(),
  lifecycleStatus: z.nativeEnum(LeadLifecycleStatus).optional(),
  notes: z.string().max(5000).optional().nullable(),
  nextFollowUpAt: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")),
  lastContactedAt: z.string().datetime({ offset: true }).optional().nullable().or(z.literal("")),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const assignLeadSchema = z.object({
  agentId: z.string().guid().nullable(),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

export const addLeadNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
});

export type AddLeadNoteInput = z.infer<typeof addLeadNoteSchema>;

export const convertLeadSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  dealType: z.string().max(50).optional(),
  dealSize: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const leadListFiltersSchema = z.object({
  search: z.string().optional(),
  temperature: z.nativeEnum(LeadTemperature).optional(),
  lifecycleStatus: z.nativeEnum(LeadLifecycleStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedAgentId: z.string().guid().optional(),
  unassigned: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional().default(false),
  scoreMin: z.coerce.number().int().min(0).max(100).optional(),
  scoreMax: z.coerce.number().int().min(0).max(100).optional(),
  sortBy: z
    .enum(["newest", "oldest", "score_desc", "score_asc", "budget_desc", "budget_asc", "updated"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type LeadListFilters = z.infer<typeof leadListFiltersSchema>;
