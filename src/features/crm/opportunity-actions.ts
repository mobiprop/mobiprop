import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { OpportunityStage, OpportunityStatus, OpportunityParticipantRole } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { logActivity } from "@/lib/activity-log";
import { buildAgentMap, agentDisplayName } from "@/lib/agent-map";
import { computeCommissionAmount, resolveCompanyRevenue } from "@/lib/commission";
import { notifyOpportunityClosed, notifyOpportunityStageChanged } from "@/features/notifications/server/notify-events";
import {
  mintOpportunityDocumentUploadTicket,
  verifyUploadedOpportunityDocument,
  removeOpportunityDocumentObject,
} from "@/lib/supabase/storage";
import { createOpportunitySchema, updateOpportunitySchema } from "@/schemas/opportunity.schema";
import type { CreateOpportunityInput, UpdateOpportunityInput, ParticipantInput } from "@/schemas/opportunity.schema";
import type { OpportunityDto, OpportunityMetrics, OpportunityParticipantDto, OpportunityListingDto, OpportunityDocumentDto } from "./types/crm-dto";

export type { CrmActionError, CrmActionResult } from "./contact-actions";
import type { CrmActionError } from "./contact-actions";
type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── Record-level access ──────────────────────────────────────────────────────

/**
 * ADMIN sees all opportunities. MANAGER sees their own + their team's (agents
 * whose teamLeaderId points to them). AGENT only ones they created or are
 * assigned to.
 */
async function opportunityRecordScope(profile: Profile): Promise<Prisma.OpportunityWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return {};
  return { OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextOpportunityId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(opportunity_id FROM 5) AS INTEGER)) AS max FROM opportunities
  `;
  return `OPP-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

type ParticipantWithRelations = {
  id: string;
  role: OpportunityParticipantRole;
  contactId: string | null;
  companyName: string | null;
  contact: { firstName: string; lastName: string; email: string | null } | null;
};

type OpportunityListingWithRelations = {
  propertyId: string;
  property: { title: string; slug: string };
};

type OppWithRelations = {
  id: string; opportunityId: string; title: string;
  dealType: string | null; dealSize: unknown;
  stage: OpportunityStage; status: OpportunityStatus;
  probability: number; commission: unknown; commissionUnit: string | null;
  paymentTerms: string | null; contractStart: Date | null; contractEnd: Date | null;
  expectedCloseAt: Date | null;
  agentCommissionValue: unknown; agentCommissionUnit: string | null;
  notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  participants: ParticipantWithRelations[];
  listings: OpportunityListingWithRelations[];
  documents: { id: string; fileName: string; url: string; mimeType: string; sizeBytes: number; createdAt: Date }[];
};

function toParticipantDto(p: ParticipantWithRelations): OpportunityParticipantDto {
  return {
    id: p.id,
    role: p.role,
    contactId: p.contactId,
    contactName: p.contact ? `${p.contact.firstName} ${p.contact.lastName}`.trim() : null,
    contactEmail: p.contact?.email ?? null,
    companyName: p.companyName,
  };
}

function toOpportunityListingDto(l: OpportunityListingWithRelations): OpportunityListingDto {
  return {
    propertyId: l.propertyId,
    propertyTitle: l.property.title,
    propertySlug: l.property.slug,
  };
}

function toOpportunityDto(
  o: OppWithRelations,
  agentMap: Map<string, { id: string; fullName: string | null; email: string }>,
): OpportunityDto {
  const dealSize = o.dealSize !== null ? Number(o.dealSize) : null;
  const commission = o.commission !== null ? Number(o.commission) : null;
  const agentCommissionValue = o.agentCommissionValue !== null ? Number(o.agentCommissionValue) : null;

  return {
    id: o.id,
    opportunityId: o.opportunityId,
    title: o.title,
    participants: o.participants.map(toParticipantDto),
    listings: o.listings.map(toOpportunityListingDto),
    documents: o.documents.map((d): OpportunityDocumentDto => ({
      id: d.id,
      fileName: d.fileName,
      url: d.url,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt.toISOString(),
    })),
    dealType: o.dealType,
    dealSize,
    stage: o.stage,
    status: o.status,
    probability: o.probability,
    commission,
    commissionUnit: o.commissionUnit,
    commissionAmount: computeCommissionAmount(dealSize, commission, o.commissionUnit),
    paymentTerms: o.paymentTerms,
    contractStart: o.contractStart?.toISOString() ?? null,
    contractEnd: o.contractEnd?.toISOString() ?? null,
    expectedCloseAt: o.expectedCloseAt?.toISOString() ?? null,
    agentCommissionValue,
    agentCommissionUnit: o.agentCommissionUnit,
    agentCommissionAmount: computeCommissionAmount(dealSize, agentCommissionValue, o.agentCommissionUnit),
    notes: o.notes,
    assignedAgentId: o.assignedAgentId,
    assignedAgentName: agentDisplayName(o.assignedAgentId ? agentMap.get(o.assignedAgentId) : null),
    createdById: o.createdById,
    createdAt: o.createdAt.toISOString(),
  };
}

const opportunityInclude = {
  participants: {
    include: { contact: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  },
  listings: {
    include: { property: { select: { title: true, slug: true } } },
  },
  documents: { orderBy: { createdAt: "desc" as const } },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listOpportunities(): Promise<
  CrmActionResult<{ opportunities: OpportunityDto[]; metrics: OpportunityMetrics }>
> {
  const gate = await requirePermission("opportunities:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = await opportunityRecordScope(gate.profile);
  const rows = await prisma.opportunity.findMany({
    where: { isDeleted: false, ...scope },
    include: opportunityInclude,
    orderBy: { createdAt: "desc" },
  });

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));
  const dtos = rows.map((r) => toOpportunityDto(r, agentMap));
  const totalValue = dtos.reduce((sum, o) => sum + (o.dealSize ?? 0), 0);
  const totalRevenue = rows
    .filter((r) => r.status === OpportunityStatus.CLOSED_WON)
    .reduce((sum, r) => sum + resolveCompanyRevenue(r), 0);

  return {
    ok: true,
    opportunities: dtos,
    metrics: {
      total: dtos.length,
      open: dtos.filter((o) => o.status === OpportunityStatus.OPEN).length,
      closedWon: dtos.filter((o) => o.status === OpportunityStatus.CLOSED_WON).length,
      closedLost: dtos.filter((o) => o.status === OpportunityStatus.CLOSED_LOST).length,
      totalValue,
      totalRevenue,
    },
  };
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getOpportunity(id: string): Promise<CrmActionResult<{ opportunity: OpportunityDto }>> {
  const gate = await requirePermission("opportunities:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = await opportunityRecordScope(gate.profile);
  const opp = await prisma.opportunity.findFirst({
    where: { id, isDeleted: false, ...scope },
    include: opportunityInclude,
  });
  if (!opp) return { ok: false, error: "Opportunity not found.", status: 404 };

  const agentMap = await buildAgentMap([opp.assignedAgentId]);
  return { ok: true, opportunity: toOpportunityDto(opp, agentMap) };
}

/** Confirms every BUYER/SELLER participant's contactId is a real, non-deleted Contact. */
async function validateParticipantContacts(participants: ParticipantInput[]): Promise<string | null> {
  const contactIds = [...new Set(participants.map((p) => p.contactId).filter((id): id is string => Boolean(id)))];
  if (contactIds.length === 0) return null;

  const found = await prisma.contact.findMany({
    where: { id: { in: contactIds }, isDeleted: false },
    select: { id: true },
  });
  if (found.length !== contactIds.length) {
    return "One of the selected contacts was not found.";
  }
  return null;
}

function participantsCreateData(participants: ParticipantInput[]) {
  return participants.map((p) => ({
    role: p.role as OpportunityParticipantRole,
    contactId: p.role === "AGENCY" ? null : (p.contactId ?? null),
    companyName: p.role === "AGENCY" ? (p.companyName ?? null) : null,
  }));
}

/** Confirms every linked propertyId is a real Property. */
async function validateListingProperties(propertyIds: string[]): Promise<string | null> {
  const ids = [...new Set(propertyIds)];
  if (ids.length === 0) return null;

  const found = await prisma.property.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    return "One of the selected listings was not found.";
  }
  return null;
}

function listingsCreateData(propertyIds: string[]) {
  return propertyIds.map((propertyId) => ({ propertyId }));
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<CrmActionResult<{ opportunity: OpportunityDto }>> {
  const gate = await requirePermission("opportunities:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { participants, propertyIds, contractStart, contractEnd, expectedCloseAt, ...fields } = parsed.data;

  const contactError = await validateParticipantContacts(participants);
  if (contactError) return { ok: false, error: contactError, status: 422 };
  const listingError = await validateListingProperties(propertyIds ?? []);
  if (listingError) return { ok: false, error: listingError, status: 422 };

  const opportunityId = await nextOpportunityId();

  const opp = await prisma.opportunity.create({
    data: {
      ...fields,
      opportunityId,
      // Agents can't see/choose other agents — force self-assignment so the deal
      // is always attributed to its creator. ADMIN/MANAGER (agents:view) keep
      // the agent they picked.
      assignedAgentId: hasPermission(gate.profile.role, "agents:view")
        ? fields.assignedAgentId ?? null
        : gate.profile.id,
      contractStart: contractStart ? new Date(contractStart) : null,
      contractEnd: contractEnd ? new Date(contractEnd) : null,
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      createdById: gate.profile.id,
      participants: { create: participantsCreateData(participants) },
      listings: { create: listingsCreateData(propertyIds ?? []) },
    },
    include: opportunityInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "OPPORTUNITY_CREATED",
    entityType: "OPPORTUNITY",
    entityId: opp.id,
    newValues: {
      title: opp.title,
      participants: opp.participants.map((p) => ({ role: p.role, contactId: p.contactId })),
      stage: opp.stage,
      status: opp.status,
      dealSize: fields.dealSize ?? null,
    },
  });

  const agentMap = await buildAgentMap([opp.assignedAgentId]);
  return { ok: true, opportunity: toOpportunityDto(opp, agentMap) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput,
): Promise<CrmActionResult<{ opportunity: OpportunityDto }>> {
  const gate = await requirePermission("opportunities:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.opportunity.findUnique({
    where: { id },
    select: { isDeleted: true, assignedAgentId: true, createdById: true, title: true, stage: true, status: true, dealSize: true },
  });
  if (!existing || existing.isDeleted) return { ok: false, error: "Opportunity not found.", status: 404 };
  const scopeIds = await resolveOwnerScopeIds(gate.profile);
  if (scopeIds !== null) {
    const visible =
      (existing.assignedAgentId !== null && scopeIds.includes(existing.assignedAgentId)) ||
      (existing.createdById !== null && scopeIds.includes(existing.createdById));
    if (!visible) {
      return { ok: false, error: "You can only update your own or assigned opportunities.", status: 403 };
    }
  }

  const parsed = updateOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { participants, propertyIds, contractStart, contractEnd, expectedCloseAt, ...fields } = parsed.data;

  if (participants !== undefined) {
    const contactError = await validateParticipantContacts(participants);
    if (contactError) return { ok: false, error: contactError, status: 422 };
  }
  if (propertyIds !== undefined) {
    const listingError = await validateListingProperties(propertyIds);
    if (listingError) return { ok: false, error: listingError, status: 422 };
  }

  const opp = await prisma.opportunity.update({
    where: { id },
    data: {
      ...fields,
      contractStart: contractStart !== undefined ? (contractStart ? new Date(contractStart) : null) : undefined,
      contractEnd: contractEnd !== undefined ? (contractEnd ? new Date(contractEnd) : null) : undefined,
      expectedCloseAt: expectedCloseAt !== undefined ? (expectedCloseAt ? new Date(expectedCloseAt) : null) : undefined,
      // Full replace, mirroring how listing amenities are updated — simplest
      // correct behavior for a small per-deal participant list.
      ...(participants !== undefined
        ? { participants: { deleteMany: {}, create: participantsCreateData(participants) } }
        : {}),
      ...(propertyIds !== undefined
        ? { listings: { deleteMany: {}, create: listingsCreateData(propertyIds) } }
        : {}),
    },
    include: opportunityInclude,
  });

  const statusChanged = fields.status && fields.status !== existing.status;
  const stageChanged = fields.stage && fields.stage !== existing.stage;

  await logActivity({
    actorId: gate.profile.id,
    action: statusChanged || stageChanged ? "OPPORTUNITY_STATUS_CHANGED" : "OPPORTUNITY_UPDATED",
    entityType: "OPPORTUNITY",
    entityId: id,
    oldValues: { title: existing.title, stage: existing.stage, status: existing.status, dealSize: existing.dealSize ? Number(existing.dealSize) : null },
    newValues: { title: opp.title, stage: opp.stage, status: opp.status, dealSize: opp.dealSize ? Number(opp.dealSize) : null },
  });

  if (statusChanged && (opp.status === OpportunityStatus.CLOSED_WON || opp.status === OpportunityStatus.CLOSED_LOST)) {
    void notifyOpportunityClosed({
      opportunityId: opp.id,
      title: opp.title,
      won: opp.status === OpportunityStatus.CLOSED_WON,
      assignedAgentId: opp.assignedAgentId,
      actorId: gate.profile.id,
    });
  } else if (stageChanged) {
    void notifyOpportunityStageChanged({
      opportunityId: opp.id,
      title: opp.title,
      assignedAgentId: opp.assignedAgentId,
      actorId: gate.profile.id,
      occurredAt: opp.updatedAt,
    });
  }

  const agentMap = await buildAgentMap([opp.assignedAgentId]);
  return { ok: true, opportunity: toOpportunityDto(opp, agentMap) };
}

// ── Soft delete ───────────────────────────────────────────────────────────────

export async function deleteOpportunity(id: string): Promise<CrmActionResult<{ id: string }>> {
  const gate = await requirePermission("opportunities:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.opportunity.findUnique({ where: { id }, select: { title: true, isDeleted: true } });
  if (!existing || existing.isDeleted) return { ok: false, error: "Opportunity not found.", status: 404 };

  await prisma.opportunity.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });

  await logActivity({
    actorId: gate.profile.id,
    action: "OPPORTUNITY_DELETED",
    entityType: "OPPORTUNITY",
    entityId: id,
    oldValues: { title: existing.title, isDeleted: false },
    newValues: { isDeleted: true, deletedAt: new Date().toISOString() },
  });

  return { ok: true, id };
}

// ── Documents ─────────────────────────────────────────────────────────────────

async function assertOpportunityAccess(id: string, gate: { profile: Profile }): Promise<CrmActionError | null> {
  const scope = await opportunityRecordScope(gate.profile);
  const opp = await prisma.opportunity.findFirst({
    where: { id, isDeleted: false, ...scope },
    select: { id: true },
  });
  if (!opp) return { ok: false, error: "Opportunity not found.", status: 404 };
  return null;
}

export async function mintOpportunityDocumentTicket(
  opportunityId: string,
  file: { name: string; type: string },
): Promise<CrmActionResult<{ ticket: { documentId: string; storagePath: string; signedUrl: string; token: string } }>> {
  const gate = await requirePermission("opportunities:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertOpportunityAccess(opportunityId, gate);
  if (accessError) return accessError;

  const ticket = await mintOpportunityDocumentUploadTicket(opportunityId, file);
  return { ok: true, ticket };
}

export async function addOpportunityDocument(
  opportunityId: string,
  storagePath: string,
  fileName: string,
): Promise<CrmActionResult<{ document: OpportunityDocumentDto }>> {
  const gate = await requirePermission("opportunities:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertOpportunityAccess(opportunityId, gate);
  if (accessError) return accessError;

  const verified = await verifyUploadedOpportunityDocument(opportunityId, storagePath);

  const doc = await prisma.opportunityDocument.create({
    data: {
      opportunityId,
      fileName,
      storagePath: verified.storagePath,
      url: verified.url,
      mimeType: verified.mimeType,
      sizeBytes: verified.sizeBytes,
      uploadedById: gate.profile.id,
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "OPPORTUNITY_DOCUMENT_UPLOADED",
    entityType: "OPPORTUNITY",
    entityId: opportunityId,
    newValues: { fileName: doc.fileName, mimeType: doc.mimeType, sizeBytes: doc.sizeBytes },
  });

  return {
    ok: true,
    document: {
      id: doc.id, fileName: doc.fileName, url: doc.url, mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes, createdAt: doc.createdAt.toISOString(),
    },
  };
}

export async function removeOpportunityDocument(
  opportunityId: string,
  documentId: string,
): Promise<CrmActionResult<{ id: string }>> {
  const gate = await requirePermission("opportunities:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertOpportunityAccess(opportunityId, gate);
  if (accessError) return accessError;

  const doc = await prisma.opportunityDocument.findFirst({ where: { id: documentId, opportunityId } });
  if (!doc) return { ok: false, error: "Document not found.", status: 404 };

  await prisma.opportunityDocument.delete({ where: { id: documentId } });
  await removeOpportunityDocumentObject(doc.storagePath);

  await logActivity({
    actorId: gate.profile.id,
    action: "OPPORTUNITY_DOCUMENT_REMOVED",
    entityType: "OPPORTUNITY",
    entityId: opportunityId,
    oldValues: { fileName: doc.fileName },
  });

  return { ok: true, id: documentId };
}
