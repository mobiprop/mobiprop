import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { OpportunityStage, OpportunityStatus, ContactType } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { buildAgentMap, agentDisplayName } from "@/lib/agent-map";
import { computeCommissionAmount } from "@/lib/commission";
import { notifyOpportunityClosed, notifyOpportunityStageChanged } from "@/features/notifications/server/notify-events";
import { createOpportunitySchema, updateOpportunitySchema } from "@/schemas/opportunity.schema";
import type { CreateOpportunityInput, UpdateOpportunityInput } from "@/schemas/opportunity.schema";
import type { OpportunityDto, OpportunityMetrics } from "./types/crm-dto";

export type { CrmActionError, CrmActionResult } from "./contact-actions";
import type { CrmActionError } from "./contact-actions";
type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── Record-level access ──────────────────────────────────────────────────────

/** ADMIN/MANAGER see all opportunities; AGENT only ones they created or are assigned to. */
function opportunityRecordScope(profile: Profile): Prisma.OpportunityWhereInput {
  if (hasPermission(profile.role, "opportunities:view_all")) return {};
  return { OR: [{ assignedAgentId: profile.id }, { createdById: profile.id }] };
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextOpportunityId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(opportunity_id FROM 5) AS INTEGER)) AS max FROM opportunities
  `;
  return `OPP-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

type OppWithRelations = {
  id: string; opportunityId: string; title: string;
  contactId: string | null; propertyId: string | null;
  dealType: string | null; dealSize: unknown;
  stage: OpportunityStage; status: OpportunityStatus;
  probability: number; commission: unknown; commissionUnit: string | null;
  paymentTerms: string | null; contractStart: Date | null; contractEnd: Date | null;
  expectedCloseAt: Date | null;
  agentCommissionValue: unknown; agentCommissionUnit: string | null;
  notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  contact: { firstName: string; lastName: string; type: ContactType } | null;
  property: { title: string; slug: string } | null;
};

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
    contactId: o.contactId,
    contactName: o.contact ? `${o.contact.firstName} ${o.contact.lastName}`.trim() : null,
    contactType: o.contact?.type ?? null,
    propertyId: o.propertyId,
    propertyTitle: o.property?.title ?? null,
    propertySlug: o.property?.slug ?? null,
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
  contact: { select: { firstName: true, lastName: true, type: true } },
  property: { select: { title: true, slug: true } },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listOpportunities(): Promise<
  CrmActionResult<{ opportunities: OpportunityDto[]; metrics: OpportunityMetrics }>
> {
  const gate = await requirePermission("opportunities:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const rows = await prisma.opportunity.findMany({
    where: { isDeleted: false, ...opportunityRecordScope(gate.profile) },
    include: opportunityInclude,
    orderBy: { createdAt: "desc" },
  });

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));
  const dtos = rows.map((r) => toOpportunityDto(r, agentMap));
  const totalValue = dtos.reduce((sum, o) => sum + (o.dealSize ?? 0), 0);

  return {
    ok: true,
    opportunities: dtos,
    metrics: {
      total: dtos.length,
      open: dtos.filter((o) => o.status === OpportunityStatus.OPEN).length,
      closedWon: dtos.filter((o) => o.status === OpportunityStatus.CLOSED_WON).length,
      closedLost: dtos.filter((o) => o.status === OpportunityStatus.CLOSED_LOST).length,
      totalValue,
    },
  };
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getOpportunity(id: string): Promise<CrmActionResult<{ opportunity: OpportunityDto }>> {
  const gate = await requirePermission("opportunities:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const opp = await prisma.opportunity.findFirst({
    where: { id, isDeleted: false, ...opportunityRecordScope(gate.profile) },
    include: opportunityInclude,
  });
  if (!opp) return { ok: false, error: "Opportunity not found.", status: 404 };

  const agentMap = await buildAgentMap([opp.assignedAgentId]);
  return { ok: true, opportunity: toOpportunityDto(opp, agentMap) };
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

  const { contactSide, contractStart, contractEnd, expectedCloseAt, ...fields } = parsed.data;
  const opportunityId = await nextOpportunityId();

  const opp = await prisma.opportunity.create({
    data: {
      ...fields,
      opportunityId,
      propertyId: fields.propertyId || null,
      contractStart: contractStart ? new Date(contractStart) : null,
      contractEnd: contractEnd ? new Date(contractEnd) : null,
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      createdById: gate.profile.id,
    },
    include: opportunityInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "OPPORTUNITY_CREATED",
    entityType: "OPPORTUNITY",
    entityId: opp.id,
    newValues: { title: opp.title, contactId: opp.contactId, stage: opp.stage, status: opp.status, dealSize: fields.dealSize ?? null },
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
  if (!hasPermission(gate.profile.role, "opportunities:view_all")) {
    if (existing.assignedAgentId !== gate.profile.id && existing.createdById !== gate.profile.id) {
      return { ok: false, error: "You can only update your own or assigned opportunities.", status: 403 };
    }
  }

  const parsed = updateOpportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { contactSide, contractStart, contractEnd, expectedCloseAt, ...fields } = parsed.data;

  const opp = await prisma.opportunity.update({
    where: { id },
    data: {
      ...fields,
      contactId: fields.contactId !== undefined ? (fields.contactId || null) : undefined,
      propertyId: fields.propertyId !== undefined ? (fields.propertyId || null) : undefined,
      contractStart: contractStart !== undefined ? (contractStart ? new Date(contractStart) : null) : undefined,
      contractEnd: contractEnd !== undefined ? (contractEnd ? new Date(contractEnd) : null) : undefined,
      expectedCloseAt: expectedCloseAt !== undefined ? (expectedCloseAt ? new Date(expectedCloseAt) : null) : undefined,
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

// ── Create Contract from a Won Opportunity (Option A pre-fill) ─────────────────

export type ContractDraft = {
  title: string;
  contactId: string | null;
  propertyId: string | null;
  assignedAgentId: string | null;
  opportunityId: string;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  type: "SALE" | "RENT" | "SALE_AND_RENT";
};

/**
 * Returns a pre-filled Contract draft from a CLOSED_WON Opportunity — the
 * human still confirms/saves it through the normal create-contract flow
 * (Option A, per the 2026-06-26 client decision: Opportunities and Contracts
 * stay separate, linked records with a one-click pre-fill, not a merge).
 */
export async function createContractFromOpportunity(id: string): Promise<CrmActionResult<{ draft: ContractDraft }>> {
  const gate = await requirePermission("contracts:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const opp = await prisma.opportunity.findFirst({
    where: { id, isDeleted: false, ...opportunityRecordScope(gate.profile) },
  });
  if (!opp) return { ok: false, error: "Opportunity not found.", status: 404 };
  if (opp.status !== OpportunityStatus.CLOSED_WON) {
    return { ok: false, error: "Only a Closed Won opportunity can be turned into a contract.", status: 400 };
  }

  const draft: ContractDraft = {
    title: opp.title,
    contactId: opp.contactId,
    propertyId: opp.propertyId,
    assignedAgentId: opp.assignedAgentId,
    opportunityId: opp.id,
    value: opp.dealSize !== null ? Number(opp.dealSize) : null,
    startDate: opp.contractStart?.toISOString() ?? null,
    endDate: opp.contractEnd?.toISOString() ?? null,
    type: opp.dealType === "Rent" ? "RENT" : "SALE",
  };

  return { ok: true, draft };
}
