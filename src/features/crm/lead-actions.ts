import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { notifyLeadAssigned, notifyLeadCreated } from "@/features/notifications/server/notify-events";
import { resolveLeadAgent } from "./lead-assignment";
import { LeadTemperature, LeadLifecycleStatus, LeadSource, UserStatus } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  addLeadNoteSchema,
  linkLeadConversionSchema,
  leadListFiltersSchema,
  importLeadRowSchema,
} from "@/schemas/lead.schema";
import type { LeadDto, LeadNoteDto, LeadActivityDto, LeadMetrics } from "./types/crm-dto";

export type CrmActionError = { ok: false; error: string; status: number };
export type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextLeadNumber(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(lead_number FROM 5) AS INTEGER)) AS max FROM leads
  `;
  return `LDR-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── Temperature suggestion ────────────────────────────────────────────────────

export function suggestTemperature(score: number): LeadTemperature {
  if (score >= 70) return LeadTemperature.HOT;
  if (score >= 40) return LeadTemperature.WARM;
  return LeadTemperature.COLD;
}

// ── Include / DTO helpers ─────────────────────────────────────────────────────

const leadInclude = {
  contact: {
    select: {
      id: true,
      contactId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      location: true,
      roles: true,
    },
  },
  primaryListing: {
    select: {
      id: true,
      listingId: true,
      title: true,
      location: true,
      slug: true,
      type: true,
      operationType: true,
      status: true,
      salePrice: true,
      rentPrice: true,
      saleCurrency: true,
      rentCurrency: true,
      images: { select: { url: true, isCover: true }, orderBy: { sortOrder: "asc" as const } },
    },
  },
} as const;

type LeadRow = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

async function toLeadDto(l: LeadRow, agentMap?: Map<string, { id: string; fullName: string | null; email: string; avatarUrl: string | null }>): Promise<LeadDto> {
  const coverImage = l.primaryListing?.images.find((i) => i.isCover) ?? l.primaryListing?.images[0];
  const agent = l.assignedAgentId ? (agentMap?.get(l.assignedAgentId) ?? null) : null;

  return {
    id: l.id,
    leadNumber: l.leadNumber,
    contactId: l.contactId,
    contact: l.contact
      ? {
          id: l.contact.id,
          contactId: l.contact.contactId,
          fullName: `${l.contact.firstName} ${l.contact.lastName}`.trim(),
          email: l.contact.email,
          phone: l.contact.phone,
          location: l.contact.location,
          roles: l.contact.roles,
        }
      : null,
    primaryListingId: l.primaryListingId,
    primaryListing: l.primaryListing
      ? {
          id: l.primaryListing.id,
          listingId: l.primaryListing.listingId,
          title: l.primaryListing.title,
          location: l.primaryListing.location,
          slug: l.primaryListing.slug,
          coverUrl: coverImage?.url ?? null,
          type: l.primaryListing.type,
          operationType: l.primaryListing.operationType,
          status: l.primaryListing.status,
          salePrice: l.primaryListing.salePrice ? Number(l.primaryListing.salePrice) : null,
          rentPrice: l.primaryListing.rentPrice ? Number(l.primaryListing.rentPrice) : null,
          saleCurrency: l.primaryListing.saleCurrency,
          rentCurrency: l.primaryListing.rentCurrency,
        }
      : null,
    assignedAgentId: l.assignedAgentId,
    assignedAgent: agent,
    createdById: l.createdById,
    convertedOpportunityId: l.convertedOpportunityId,
    convertedAt: l.convertedAt?.toISOString() ?? null,
    submittedName: l.submittedName,
    submittedEmail: l.submittedEmail,
    submittedPhone: l.submittedPhone,
    submittedLocation: l.submittedLocation,
    source: l.source,
    sourceDetail: l.sourceDetail,
    budgetMin: l.budgetMin ? Number(l.budgetMin) : null,
    budgetMax: l.budgetMax ? Number(l.budgetMax) : null,
    currency: l.currency,
    score: l.score,
    temperature: l.temperature,
    lifecycleStatus: l.lifecycleStatus,
    notes: l.notes,
    lastContactedAt: l.lastContactedAt?.toISOString() ?? null,
    nextFollowUpAt: l.nextFollowUpAt?.toISOString() ?? null,
    closedAt: l.closedAt?.toISOString() ?? null,
    isArchived: l.isArchived,
    archivedAt: l.archivedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

async function buildAgentMap(agentIds: (string | null)[]): Promise<Map<string, { id: string; fullName: string | null; email: string; avatarUrl: string | null }>> {
  const ids = [...new Set(agentIds.filter(Boolean) as string[])];
  if (ids.length === 0) return new Map();
  const agents = await prisma.profile.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  });
  return new Map(agents.map((a) => [a.id, a]));
}

// ── Record-level access (mirrors listing-actions.ts pattern) ──────────────────

/** ADMIN/MANAGER see all leads; AGENT only leads they are assigned to or created. */
function leadRecordScope(profile: Profile): Prisma.LeadWhereInput {
  if (hasPermission(profile.role, "leads:view_all")) return {};
  return { OR: [{ assignedAgentId: profile.id }, { createdById: profile.id }] };
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export async function getLeadMetrics(): Promise<CrmActionResult<{ metrics: LeadMetrics }>> {
  const gate = await requirePermission("leads:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const [total, hot, converted] = await Promise.all([
    prisma.lead.count({ where: { isArchived: false } }),
    prisma.lead.count({ where: { isArchived: false, temperature: LeadTemperature.HOT } }),
    prisma.lead.count({ where: { isArchived: false, lifecycleStatus: LeadLifecycleStatus.CONVERTED } }),
  ]);

  const scoreAgg = await prisma.lead.aggregate({
    _avg: { score: true },
    where: { isArchived: false },
  });

  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const averageScore = Math.round(scoreAgg._avg.score ?? 0);

  return { ok: true, metrics: { total, hot, conversionRate, averageScore } };
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listLeads(
  rawFilters: Record<string, unknown> = {},
): Promise<CrmActionResult<{ leads: LeadDto[]; total: number; page: number; limit: number }>> {
  const gate = await requirePermission("leads:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = leadListFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid filters", status: 422 };

  const { search, temperature, lifecycleStatus, source, assignedAgentId, unassigned, isArchived, scoreMin, scoreMax, sortBy, page, limit } = parsed.data;

  // Scope + search both use OR at the top level — combine them with AND so neither
  // overwrites the other when spread into the where object.
  const scope = leadRecordScope(gate.profile);
  const andConditions: Prisma.LeadWhereInput[] = [];
  if (Object.keys(scope).length > 0) andConditions.push(scope);
  if (search) {
    andConditions.push({
      OR: [
        { leadNumber: { contains: search, mode: "insensitive" } },
        { submittedName: { contains: search, mode: "insensitive" } },
        { submittedEmail: { contains: search, mode: "insensitive" } },
        { submittedPhone: { contains: search, mode: "insensitive" } },
        { submittedLocation: { contains: search, mode: "insensitive" } },
        { contact: { firstName: { contains: search, mode: "insensitive" } } },
        { contact: { lastName: { contains: search, mode: "insensitive" } } },
        { contact: { email: { contains: search, mode: "insensitive" } } },
        { primaryListing: { title: { contains: search, mode: "insensitive" } } },
        { primaryListing: { listingId: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.LeadWhereInput = {
    isArchived: isArchived ?? false,
    ...(temperature && { temperature }),
    ...(lifecycleStatus && { lifecycleStatus }),
    ...(source && { source }),
    ...(assignedAgentId && { assignedAgentId }),
    ...(unassigned && { assignedAgentId: null }),
    ...(scoreMin !== undefined && { score: { gte: scoreMin } }),
    ...(scoreMax !== undefined && { score: { lte: scoreMax } }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  const orderBy: Prisma.LeadOrderByWithRelationInput = (() => {
    switch (sortBy) {
      case "oldest":      return { createdAt: "asc" };
      case "score_desc":  return { score: "desc" };
      case "score_asc":   return { score: "asc" };
      case "budget_desc": return { budgetMax: "desc" };
      case "budget_asc":  return { budgetMin: "asc" };
      case "updated":     return { updatedAt: "desc" };
      default:            return { createdAt: "desc" };
    }
  })();

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({ where, include: leadInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.lead.count({ where }),
  ]);

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));
  const leads = await Promise.all(rows.map((r) => toLeadDto(r, agentMap)));

  return { ok: true, leads, total, page, limit };
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getLead(id: string): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const row = await prisma.lead.findFirst({ where: { id, ...leadRecordScope(gate.profile) }, include: leadInclude });
  if (!row) return { ok: false, error: "Lead not found", status: 404 };

  const agentMap = await buildAgentMap([row.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(row, agentMap) };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createLead(body: unknown): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const data = parsed.data;

  // A Lead only ever links to an existing Contact match by email/phone. A new
  // Contact is created later, when the Lead converts into an Opportunity —
  // leads should stay contact-less until then (see convertLead()).
  let contactId = data.contactId;
  if (!contactId && (data.submittedEmail || data.submittedPhone)) {
    const existing = await prisma.contact.findFirst({
      where: {
        isDeleted: false,
        OR: [
          ...(data.submittedEmail ? [{ email: data.submittedEmail }] : []),
          ...(data.submittedPhone ? [{ phone: data.submittedPhone }] : []),
        ],
      },
    });
    if (existing) contactId = existing.id;
  }

  if (data.primaryListingId) {
    const listing = await prisma.property.findUnique({ where: { id: data.primaryListingId }, select: { id: true } });
    if (!listing) return { ok: false, error: "Listing not found", status: 422 };
  }

  if (data.assignedAgentId) {
    // AGENT may only self-assign; leads:assign permission is required to assign others.
    if (!hasPermission(gate.profile.role, "leads:assign") && data.assignedAgentId !== gate.profile.id) {
      return { ok: false, error: "You can only assign a lead to yourself.", status: 403 };
    }
    const agent = await prisma.profile.findUnique({ where: { id: data.assignedAgentId }, select: { status: true } });
    if (!agent || agent.status !== UserStatus.ACTIVE) return { ok: false, error: "Agent is not active", status: 422 };
  }

  // No agent explicitly chosen but a listing was — inherit the listing's
  // agent (or its creator) instead of leaving the lead unassigned.
  let resolvedAgentId = data.assignedAgentId || null;
  if (!resolvedAgentId && data.primaryListingId) {
    resolvedAgentId = (await resolveLeadAgent(data.primaryListingId)).agentId;
  }

  const leadNumber = await nextLeadNumber();

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      contactId,
      submittedName: data.submittedName,
      submittedEmail: data.submittedEmail || null,
      submittedPhone: data.submittedPhone || null,
      submittedLocation: data.submittedLocation || null,
      source: data.source,
      sourceDetail: data.sourceDetail || null,
      sourceUrl: data.sourceUrl || null,
      externalSource: data.externalSource || null,
      externalSourceId: data.externalSourceId || null,
      importBatchId: data.importBatchId || null,
      primaryListingId: data.primaryListingId || null,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      currency: data.currency,
      score: data.score,
      temperature: data.temperature,
      lifecycleStatus: data.lifecycleStatus,
      assignedAgentId: resolvedAgentId,
      notes: data.notes || null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      createdById: gate.profile.id,
    },
    include: leadInclude,
  });

  await Promise.all([
    prisma.leadActivity.create({
      data: { leadId: lead.id, actorId: gate.profile.id, type: "LEAD_CREATED", metadata: { source: data.source, submittedName: data.submittedName } as Prisma.InputJsonValue },
    }),
    logActivity({ actorId: gate.profile.id, action: "LEAD_CREATED", entityType: "LEAD", entityId: lead.id, newValues: { leadNumber, contactId, source: data.source } }),
  ]);

  await notifyLeadCreated({ leadId: lead.id, assignedAgentId: resolvedAgentId, actorId: gate.profile.id });

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateLead(id: string, body: unknown): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  // Converted status is set only by the /convert endpoint, never via a direct update.
  if (parsed.data.lifecycleStatus === LeadLifecycleStatus.CONVERTED) {
    return { ok: false, error: "Use the convert endpoint to mark a lead as converted.", status: 400 };
  }

  const existing = await prisma.lead.findFirst({
    where: { id, ...leadRecordScope(gate.profile) },
    select: { id: true, score: true, temperature: true, lifecycleStatus: true, source: true, isArchived: true },
  });
  if (!existing) return { ok: false, error: "Lead not found", status: 404 };
  if (existing.isArchived) return { ok: false, error: "Cannot update an archived lead", status: 409 };

  const data = parsed.data;
  const activities: Prisma.LeadActivityCreateManyInput[] = [];

  if (data.score !== undefined && data.score !== existing.score) {
    activities.push({ leadId: id, actorId: gate.profile.id, type: "LEAD_SCORE_CHANGED", fieldName: "score", oldValue: existing.score as Prisma.InputJsonValue, newValue: data.score as Prisma.InputJsonValue });
  }
  if (data.temperature !== undefined && data.temperature !== existing.temperature) {
    activities.push({ leadId: id, actorId: gate.profile.id, type: "LEAD_TEMPERATURE_CHANGED", fieldName: "temperature", oldValue: existing.temperature as Prisma.InputJsonValue, newValue: data.temperature as Prisma.InputJsonValue });
  }
  if (data.lifecycleStatus !== undefined && data.lifecycleStatus !== existing.lifecycleStatus) {
    activities.push({ leadId: id, actorId: gate.profile.id, type: "LEAD_STATUS_CHANGED", fieldName: "lifecycleStatus", oldValue: existing.lifecycleStatus as Prisma.InputJsonValue, newValue: data.lifecycleStatus as Prisma.InputJsonValue });
  }
  if (data.source !== undefined && data.source !== existing.source) {
    activities.push({ leadId: id, actorId: gate.profile.id, type: "LEAD_SOURCE_CHANGED", fieldName: "source", oldValue: existing.source as Prisma.InputJsonValue, newValue: data.source as Prisma.InputJsonValue });
  }
  if (data.nextFollowUpAt !== undefined) {
    activities.push({ leadId: id, actorId: gate.profile.id, type: "LEAD_FOLLOW_UP_CHANGED", fieldName: "nextFollowUpAt", oldValue: Prisma.JsonNull, newValue: (data.nextFollowUpAt ?? Prisma.JsonNull) as Prisma.InputJsonValue });
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.submittedName && { submittedName: data.submittedName }),
      ...(data.submittedEmail !== undefined && { submittedEmail: data.submittedEmail || null }),
      ...(data.submittedPhone !== undefined && { submittedPhone: data.submittedPhone || null }),
      ...(data.submittedLocation !== undefined && { submittedLocation: data.submittedLocation || null }),
      ...(data.primaryListingId !== undefined && { primaryListingId: data.primaryListingId }),
      ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
      ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
      ...(data.currency && { currency: data.currency }),
      ...(data.score !== undefined && { score: data.score }),
      ...(data.temperature && { temperature: data.temperature }),
      ...(data.lifecycleStatus && { lifecycleStatus: data.lifecycleStatus }),
      ...(data.source && { source: data.source }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.nextFollowUpAt !== undefined && { nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null }),
      ...(data.lastContactedAt !== undefined && { lastContactedAt: data.lastContactedAt ? new Date(data.lastContactedAt) : null }),
    },
    include: leadInclude,
  });

  if (activities.length > 0) await prisma.leadActivity.createMany({ data: activities });

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap) };
}

// ── Assign ────────────────────────────────────────────────────────────────────

export async function assignLead(id: string, body: unknown): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:assign");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = assignLeadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const existing = await prisma.lead.findFirst({
    where: { id, ...leadRecordScope(gate.profile) },
    select: { id: true, assignedAgentId: true, isArchived: true },
  });
  if (!existing) return { ok: false, error: "Lead not found", status: 404 };
  if (existing.isArchived) return { ok: false, error: "Cannot assign an archived lead", status: 409 };

  const { agentId } = parsed.data;

  if (agentId) {
    const agent = await prisma.profile.findUnique({ where: { id: agentId }, select: { status: true } });
    if (!agent || agent.status !== UserStatus.ACTIVE) return { ok: false, error: "Agent is not active", status: 422 };
  }

  const isReassign = existing.assignedAgentId !== null && agentId !== null;

  const lead = await prisma.lead.update({
    where: { id },
    data: { assignedAgentId: agentId },
    include: leadInclude,
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      actorId: gate.profile.id,
      type: isReassign ? "LEAD_REASSIGNED" : "LEAD_ASSIGNED",
      fieldName: "assignedAgentId",
      oldValue: (existing.assignedAgentId ?? null) as Prisma.InputJsonValue,
      newValue: (agentId ?? null) as Prisma.InputJsonValue,
    },
  });

  // Best-effort: notify the agent(s). Never affects the assignment result.
  if (agentId || isReassign) {
    await notifyLeadAssigned({
      leadId: lead.id,
      assignedAgentId: agentId,
      previousAgentId: existing.assignedAgentId,
      isReassign,
      actorId: gate.profile.id,
    });
  }

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap) };
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getLeadNotes(leadId: string): Promise<CrmActionResult<{ notes: LeadNoteDto[] }>> {
  const gate = await requirePermission("leads:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const lead = await prisma.lead.findFirst({ where: { id: leadId, ...leadRecordScope(gate.profile) }, select: { id: true } });
  if (!lead) return { ok: false, error: "Lead not found", status: 404 };

  const rows = await prisma.leadNote.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } });
  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await prisma.profile.findMany({ where: { id: { in: authorIds } }, select: { id: true, fullName: true, avatarUrl: true } });
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  const notes: LeadNoteDto[] = rows.map((r) => {
    const author = authorMap.get(r.authorId);
    return { id: r.id, leadId: r.leadId, authorId: r.authorId, authorName: author?.fullName ?? null, authorAvatar: author?.avatarUrl ?? null, content: r.content, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
  });

  return { ok: true, notes };
}

export async function addLeadNote(leadId: string, body: unknown): Promise<CrmActionResult<{ note: LeadNoteDto }>> {
  const gate = await requirePermission("leads:add_note");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = addLeadNoteSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const lead = await prisma.lead.findFirst({ where: { id: leadId, ...leadRecordScope(gate.profile) }, select: { id: true, isArchived: true } });
  if (!lead) return { ok: false, error: "Lead not found", status: 404 };
  if (lead.isArchived) return { ok: false, error: "Cannot add notes to an archived lead", status: 409 };

  const noteRow = await prisma.leadNote.create({ data: { leadId, authorId: gate.profile.id, content: parsed.data.content } });

  await prisma.leadActivity.create({
    data: { leadId, actorId: gate.profile.id, type: "LEAD_NOTE_ADDED", metadata: { noteId: noteRow.id } as Prisma.InputJsonValue },
  });

  return {
    ok: true,
    note: { id: noteRow.id, leadId: noteRow.leadId, authorId: noteRow.authorId, authorName: gate.profile.fullName, authorAvatar: gate.profile.avatarUrl, content: noteRow.content, createdAt: noteRow.createdAt.toISOString(), updatedAt: noteRow.updatedAt.toISOString() },
  };
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function getLeadActivities(leadId: string): Promise<CrmActionResult<{ activities: LeadActivityDto[] }>> {
  const gate = await requirePermission("leads:view_activity");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const lead = await prisma.lead.findFirst({ where: { id: leadId, ...leadRecordScope(gate.profile) }, select: { id: true } });
  if (!lead) return { ok: false, error: "Lead not found", status: 404 };

  const rows = await prisma.leadActivity.findMany({ where: { leadId }, orderBy: { createdAt: "desc" } });
  const actorIds = [...new Set(rows.map((r) => r.actorId).filter(Boolean) as string[])];
  const actors = await prisma.profile.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true } });
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const activities: LeadActivityDto[] = rows.map((r) => ({
    id: r.id,
    leadId: r.leadId,
    actorId: r.actorId,
    actorName: r.actorId ? (actorMap.get(r.actorId)?.fullName ?? null) : null,
    type: r.type,
    fieldName: r.fieldName,
    oldValue: r.oldValue,
    newValue: r.newValue,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));

  return { ok: true, activities };
}

// ── Archive / Restore ─────────────────────────────────────────────────────────

export async function archiveLead(id: string): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:archive");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.lead.findFirst({
    where: { id, ...leadRecordScope(gate.profile) },
    select: { id: true, isArchived: true },
  });
  if (!existing) return { ok: false, error: "Lead not found", status: 404 };
  if (existing.isArchived) return { ok: false, error: "Lead is already archived", status: 409 };

  const lead = await prisma.lead.update({ where: { id }, data: { isArchived: true, archivedAt: new Date() }, include: leadInclude });

  await Promise.all([
    prisma.leadActivity.create({ data: { leadId: lead.id, actorId: gate.profile.id, type: "LEAD_ARCHIVED" } }),
    logActivity({ actorId: gate.profile.id, action: "LEAD_ARCHIVED", entityType: "LEAD", entityId: id }),
  ]);

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap) };
}

// A single batched call instead of one request per selected row — the prior
// client-side fan-out (N parallel archiveLead calls) was a plausible source
// of the "unusual error" reported on multi-select archive for larger selections.
export async function bulkArchiveLeads(
  ids: string[],
): Promise<CrmActionResult<{ archivedIds: string[]; failedCount: number }>> {
  const gate = await requirePermission("leads:archive");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return { ok: true, archivedIds: [], failedCount: 0 };

  const existing = await prisma.lead.findMany({
    where: { id: { in: uniqueIds }, isArchived: false, ...leadRecordScope(gate.profile) },
    select: { id: true },
  });
  const archivableIds = existing.map((l) => l.id);

  if (archivableIds.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: archivableIds } },
      data: { isArchived: true, archivedAt: new Date() },
    });

    await Promise.all([
      prisma.leadActivity.createMany({
        data: archivableIds.map((leadId) => ({ leadId, actorId: gate.profile.id, type: "LEAD_ARCHIVED" as const })),
      }),
      ...archivableIds.map((id) =>
        logActivity({ actorId: gate.profile.id, action: "LEAD_ARCHIVED", entityType: "LEAD", entityId: id }),
      ),
    ]);
  }

  return { ok: true, archivedIds: archivableIds, failedCount: uniqueIds.length - archivableIds.length };
}

export async function restoreLead(id: string): Promise<CrmActionResult<{ lead: LeadDto }>> {
  const gate = await requirePermission("leads:archive");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.lead.findFirst({
    where: { id, ...leadRecordScope(gate.profile) },
    select: { id: true, isArchived: true },
  });
  if (!existing) return { ok: false, error: "Lead not found", status: 404 };
  if (!existing.isArchived) return { ok: false, error: "Lead is not archived", status: 409 };

  const lead = await prisma.lead.update({ where: { id }, data: { isArchived: false, archivedAt: null }, include: leadInclude });

  await Promise.all([
    prisma.leadActivity.create({ data: { leadId: lead.id, actorId: gate.profile.id, type: "LEAD_RESTORED" } }),
    logActivity({ actorId: gate.profile.id, action: "LEAD_RESTORED", entityType: "LEAD", entityId: id }),
  ]);

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap) };
}

// ── Convert to Opportunity ───────────────────────────────────────────────────
//
// The Opportunity itself is created beforehand through the standard
// createOpportunity flow (same full form as the Opportunities page — staff add
// the prospect as a real Contact there via its own "Add Contact" panel). This
// just links the already-created Opportunity back onto the Lead and marks it
// converted, so a Lead never needs a Contact of its own to get this far.

export async function convertLead(id: string, body: unknown): Promise<CrmActionResult<{ lead: LeadDto; opportunityId: string }>> {
  const gate = await requirePermission("leads:convert");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = linkLeadConversionSchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const existing = await prisma.lead.findFirst({
    where: { id, ...leadRecordScope(gate.profile) },
    select: { id: true, convertedOpportunityId: true, isArchived: true },
  });
  if (!existing) return { ok: false, error: "Lead not found", status: 404 };
  if (existing.convertedOpportunityId) return { ok: false, error: "Lead has already been converted", status: 409 };
  if (existing.isArchived) return { ok: false, error: "Cannot convert an archived lead", status: 409 };

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: parsed.data.opportunityId },
    select: { id: true },
  });
  if (!opportunity) return { ok: false, error: "Opportunity not found", status: 404 };

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      lifecycleStatus: LeadLifecycleStatus.CONVERTED,
      convertedAt: new Date(),
      convertedOpportunityId: opportunity.id,
    },
    include: leadInclude,
  });

  await Promise.all([
    prisma.leadActivity.create({ data: { leadId: id, actorId: gate.profile.id, type: "LEAD_CONVERTED", metadata: { opportunityId: opportunity.id } as Prisma.InputJsonValue } }),
    logActivity({ actorId: gate.profile.id, action: "LEAD_CONVERTED", entityType: "LEAD", entityId: id, newValues: { opportunityId: opportunity.id } }),
  ]);

  const agentMap = await buildAgentMap([lead.assignedAgentId]);
  return { ok: true, lead: await toLeadDto(lead, agentMap), opportunityId: opportunity.id };
}

// ── CSV/XLSX import ───────────────────────────────────────────────────────────

type ExistingLeadMatch = { id: string; leadNumber: string; submittedName: string };

async function findDuplicateLead(
  email: string | null,
  phone: string | null,
): Promise<{ matchedOn: "email address" | "phone number"; existing: ExistingLeadMatch } | null> {
  if (email) {
    const existing = await prisma.lead.findFirst({
      where: { isArchived: false, submittedEmail: { equals: email, mode: "insensitive" } },
      select: { id: true, leadNumber: true, submittedName: true },
    });
    if (existing) return { matchedOn: "email address", existing };
  }

  const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";
  if (normalizedPhone) {
    const rows = await prisma.$queryRaw<ExistingLeadMatch[]>`
      SELECT id, lead_number AS "leadNumber", submitted_name AS "submittedName"
      FROM leads
      WHERE is_archived = false AND submitted_phone IS NOT NULL
        AND regexp_replace(submitted_phone, '\D', '', 'g') = ${normalizedPhone}
      LIMIT 1
    `;
    if (rows[0]) return { matchedOn: "phone number", existing: rows[0] };
  }

  return null;
}

export type ImportLeadsError = { row: number; message: string };

export async function importLeads(
  rawRows: unknown[],
  source: LeadSource = LeadSource.IMPORT,
): Promise<CrmActionResult<{ created: number; skipped: number; errors: ImportLeadsError[] }>> {
  const gate = await requirePermission("leads:import");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const errors: ImportLeadsError[] = [];
  let created = 0;
  const importBatchId = crypto.randomUUID();

  // Sequential on purpose — same reasoning as importContacts(): nextLeadNumber()
  // and findDuplicateLead() both read current table state, so rows must be
  // processed one at a time to avoid two rows in the same file racing each
  // other onto the same generated lead number or both slipping past the
  // duplicate check.
  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // +1 for 1-index, +1 for the header row
    const parsed = importLeadRowSchema.safeParse(rawRows[i]);
    if (!parsed.success) {
      errors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }

    const email = parsed.data.submittedEmail || null;
    const phone = parsed.data.submittedPhone || null;

    const duplicate = await findDuplicateLead(email, phone);
    if (duplicate) {
      errors.push({
        row: rowNumber,
        message: `Matches existing lead ${duplicate.existing.leadNumber} (${duplicate.matchedOn})`,
      });
      continue;
    }

    const leadNumber = await nextLeadNumber();
    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        submittedName: parsed.data.submittedName,
        submittedEmail: email,
        submittedPhone: phone,
        submittedLocation: parsed.data.submittedLocation || null,
        source,
        importBatchId,
        budgetMin: parsed.data.budgetMin ?? null,
        budgetMax: parsed.data.budgetMax ?? null,
        notes: parsed.data.notes || null,
        createdById: gate.profile.id,
      },
    });

    await Promise.all([
      prisma.leadActivity.create({
        data: { leadId: lead.id, actorId: gate.profile.id, type: "LEAD_CREATED", metadata: { source, submittedName: parsed.data.submittedName } as Prisma.InputJsonValue },
      }),
      logActivity({ actorId: gate.profile.id, action: "LEAD_CREATED", entityType: "LEAD", entityId: lead.id, newValues: { leadNumber, source, importBatchId } }),
    ]);

    created++;
  }

  return { ok: true, created, skipped: errors.length, errors };
}
