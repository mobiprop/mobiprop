import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { OpportunityStage, OpportunityStatus, OpportunityParticipantRole, Currency } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { logActivity } from "@/lib/activity-log";
import { buildAgentMap, agentDisplayName } from "@/lib/agent-map";
import { computeCommissionAmount, resolveCompanyRevenueUsd, toUsd } from "@/lib/commission";
import { getDolarBlueVenta } from "@/lib/exchange-rate";
import { notifyOpportunityClosed, notifyOpportunityStageChanged } from "@/features/notifications/server/notify-events";
import { createOpportunitySchema, updateOpportunitySchema } from "@/schemas/opportunity.schema";
import type { CreateOpportunityInput, UpdateOpportunityInput, ParticipantInput } from "@/schemas/opportunity.schema";
import type { OpportunityDto, OpportunityMetrics, OpportunityParticipantDto, OpportunityListingDto } from "./types/crm-dto";

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

// ── Closing a deal ────────────────────────────────────────────────────────────

/**
 * Resolves the fields to stamp when an Opportunity transitions into
 * CLOSED_WON: `closedAt` (always) and, for ARS deals, the Dólar Blue "venta"
 * rate to lock in permanently (the override if the closer supplied one,
 * otherwise a fresh fetch). USD deals need no rate. Returns an error message
 * if an ARS deal can't get a rate from either source — closing must not
 * silently produce an unconvertible dashboard figure.
 */
async function resolveClosedWonFields(
  currency: Currency,
  exchangeRateOverride: number | undefined,
): Promise<{ closedAt: Date; exchangeRate: number | null } | { error: string }> {
  if (currency === Currency.USD) return { closedAt: new Date(), exchangeRate: null };

  const rate = exchangeRateOverride ?? (await getDolarBlueVenta());
  if (!rate) {
    return { error: "Could not determine today's exchange rate. Enter one manually to close this deal." };
  }
  return { closedAt: new Date(), exchangeRate: rate };
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

type ParticipantWithRelations = {
  id: string;
  role: OpportunityParticipantRole;
  contactId: string | null;
  companyName: string | null;
  companyEmail: string | null;
  contact: { firstName: string; lastName: string; email: string | null } | null;
};

type OpportunityListingWithRelations = {
  propertyId: string;
  property: { title: string; slug: string };
};

type OppWithRelations = {
  id: string; opportunityId: string; title: string;
  dealType: string | null; dealSize: unknown; currency: Currency;
  stage: OpportunityStage; status: OpportunityStatus;
  probability: number; commission: unknown; commissionUnit: string | null;
  paymentTerms: string | null; contractStart: Date | null; contractEnd: Date | null;
  expectedCloseAt: Date | null; closedAt: Date | null; exchangeRate: unknown;
  agentCommissionValue: unknown; agentCommissionUnit: string | null;
  notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  participants: ParticipantWithRelations[];
  listings: OpportunityListingWithRelations[];
};

function toParticipantDto(p: ParticipantWithRelations): OpportunityParticipantDto {
  return {
    id: p.id,
    role: p.role,
    contactId: p.contactId,
    contactName: p.contact ? `${p.contact.firstName} ${p.contact.lastName}`.trim() : null,
    contactEmail: p.contact?.email ?? null,
    companyName: p.companyName,
    companyEmail: p.companyEmail,
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
    dealType: o.dealType,
    dealSize,
    currency: o.currency,
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
    closedAt: o.closedAt?.toISOString() ?? null,
    exchangeRate: o.exchangeRate !== null ? Number(o.exchangeRate) : null,
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

  // Both are USD-normalized dashboard rollups — dealSize/revenue can be
  // entered in ARS per-deal, but these summary stats must stay single-currency.
  const liveRate = await getDolarBlueVenta();
  const totalValue = rows.reduce((sum, r) => {
    const dealSize = r.dealSize !== null ? Number(r.dealSize) : null;
    if (dealSize === null) return sum;
    return sum + (toUsd(dealSize, r.currency, r.exchangeRate !== null ? Number(r.exchangeRate) : liveRate) ?? 0);
  }, 0);
  const totalRevenue = rows
    .filter((r) => r.status === OpportunityStatus.CLOSED_WON)
    .reduce((sum, r) => sum + (resolveCompanyRevenueUsd(r, liveRate) ?? 0), 0);

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
    companyEmail: p.role === "AGENCY" ? (p.companyEmail ?? null) : null,
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

  // Edge case: a deal created directly as CLOSED_WON (not the normal flow —
  // new opportunities start OPEN and close later via updateOpportunity, which
  // has the full close-confirmation UI) still needs its rate locked in.
  let closeFields: { closedAt: Date; exchangeRate: number | null } | null = null;
  if (fields.status === OpportunityStatus.CLOSED_WON) {
    const resolved = await resolveClosedWonFields(fields.currency, undefined);
    if ("error" in resolved) return { ok: false, error: resolved.error, status: 422 };
    closeFields = resolved;
  }

  const opportunityId = await nextOpportunityId();

  const opp = await prisma.opportunity.create({
    data: {
      ...fields,
      ...(closeFields ?? {}),
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
    select: {
      isDeleted: true,
      assignedAgentId: true,
      createdById: true,
      title: true,
      stage: true,
      status: true,
      dealSize: true,
      currency: true,
    },
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

  const { participants, propertyIds, contractStart, contractEnd, expectedCloseAt, exchangeRateOverride, ...fields } =
    parsed.data;

  if (participants !== undefined) {
    const contactError = await validateParticipantContacts(participants);
    if (contactError) return { ok: false, error: contactError, status: 422 };
  }
  if (propertyIds !== undefined) {
    const listingError = await validateListingProperties(propertyIds);
    if (listingError) return { ok: false, error: listingError, status: 422 };
  }

  const statusChanging = fields.status !== undefined && fields.status !== existing.status;
  const resolvedCurrency = fields.currency ?? existing.currency;

  let closeFields: { closedAt: Date; exchangeRate: number | null } | null = null;
  if (statusChanging && fields.status === OpportunityStatus.CLOSED_WON) {
    const resolved = await resolveClosedWonFields(resolvedCurrency, exchangeRateOverride);
    if ("error" in resolved) return { ok: false, error: resolved.error, status: 422 };
    closeFields = resolved;
  }

  // Correcting an already-locked rate (not a fresh close) — e.g. the rate
  // fetched/entered at close time turns out to be wrong. Only the rate
  // changes; closedAt is left exactly as it was.
  const rateCorrection =
    !statusChanging &&
    existing.status === OpportunityStatus.CLOSED_WON &&
    resolvedCurrency === Currency.ARS &&
    exchangeRateOverride !== undefined
      ? exchangeRateOverride
      : null;

  const opp = await prisma.opportunity.update({
    where: { id },
    data: {
      ...fields,
      ...(closeFields ?? {}),
      ...(rateCorrection !== null ? { exchangeRate: rateCorrection } : {}),
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

