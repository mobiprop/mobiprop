import { z } from "zod";

import { TourStatus } from "@/generated/prisma/enums";

// ── Public tour request (listing page) ────────────────────────────────────────

export const requestTourSchema = z.object({
  submittedName: z.string().min(1, "Name is required").max(200),
  submittedEmail: z
    .string()
    .email("Invalid email")
    .transform((v) => v.toLowerCase().trim())
    .optional()
    .or(z.literal("")),
  submittedPhone: z.string().max(50).optional(),
  submittedMessage: z.string().max(2000).optional(),
  propertyId: z.string().optional(),
  scheduledAt: z
    .string()
    .datetime({ offset: true, message: "Invalid date-time" }),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
});

export type RequestTourInput = z.infer<typeof requestTourSchema>;

// ── Dashboard create (staff) ───────────────────────────────────────────────────

export const createTourSchema = z.object({
  submittedName: z.string().min(1, "Name is required").max(200),
  submittedEmail: z
    .string()
    .email("Invalid email")
    .transform((v) => v.toLowerCase().trim())
    .optional()
    .or(z.literal("")),
  submittedPhone: z.string().max(50).optional(),
  submittedMessage: z.string().max(2000).optional(),
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  leadId: z.string().optional(),
  // .guid() (not .uuid()) — some seeded staff profiles use simplified IDs
  // that aren't RFC4122-compliant (wrong version/variant nibble); the real
  // existence/role check happens server-side against the profiles table.
  assignedAgentId: z.string().guid().optional().or(z.literal("")),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  source: z.enum(["PUBLIC_REQUEST", "DASHBOARD_CREATED"]).default("DASHBOARD_CREATED"),
});

export type CreateTourInput = z.infer<typeof createTourSchema>;

// ── Dashboard update ───────────────────────────────────────────────────────────

export const updateTourSchema = z.object({
  submittedName: z.string().min(1).max(200).optional(),
  submittedEmail: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim())
    .optional()
    .or(z.literal("")),
  submittedPhone: z.string().max(50).optional().nullable(),
  submittedMessage: z.string().max(2000).optional().nullable(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  leadId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
});

export type UpdateTourInput = z.infer<typeof updateTourSchema>;

// ── Status transition ─────────────────────────────────────────────────────────

export const updateTourStatusSchema = z.object({
  status: z.nativeEnum(TourStatus),
  confirmationNote: z.string().max(2000).optional(),
  rescheduleNote: z.string().max(2000).optional(),
  cancellationReason: z.string().max(2000).optional(),
  completionNote: z.string().max(2000).optional(),
  // New date when rescheduling
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

export type UpdateTourStatusInput = z.infer<typeof updateTourStatusSchema>;

// ── Assign agent ──────────────────────────────────────────────────────────────

export const assignTourSchema = z.object({
  agentId: z.string().guid().nullable(),
});

export type AssignTourInput = z.infer<typeof assignTourSchema>;

// ── List filters ──────────────────────────────────────────────────────────────

export const tourListFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TourStatus).optional(),
  assignedAgentId: z.string().guid().optional(),
  unassigned: z.coerce.boolean().optional(),
  propertyId: z.string().optional(),
  fromDate: z.string().datetime({ offset: true }).optional(),
  toDate: z.string().datetime({ offset: true }).optional(),
  upcoming: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["newest", "oldest", "scheduled_asc", "scheduled_desc"])
    .optional()
    .default("scheduled_asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type TourListFilters = z.infer<typeof tourListFiltersSchema>;
