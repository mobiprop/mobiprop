import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { OpportunityStage, OpportunityStatus, ContactType } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
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
  expectedCloseAt: Date | null; agentCommission: string | null; notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  contact: { firstName: string; lastName: string; type: ContactType } | null;
  property: { title: string; slug: string } | null;
};

function toOpportunityDto(o: OppWithRelations): OpportunityDto {
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
    dealSize: o.dealSize !== null ? Number(o.dealSize) : null,
    stage: o.stage,
    status: o.status,
    probability: o.probability,
    commission: o.commission !== null ? Number(o.commission) : null,
    commissionUnit: o.commissionUnit,
    paymentTerms: o.paymentTerms,
    contractStart: o.contractStart?.toISOString() ?? null,
    contractEnd: o.contractEnd?.toISOString() ?? null,
    expectedCloseAt: o.expectedCloseAt?.toISOString() ?? null,
    agentCommission: o.agentCommission,
    notes: o.notes,
    assignedAgentId: o.assignedAgentId,
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
    where: opportunityRecordScope(gate.profile),
    include: opportunityInclude,
    orderBy: { createdAt: "desc" },
  });

  const dtos = rows.map(toOpportunityDto);
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
      contactId: fields.contactId || null,
      propertyId: fields.propertyId || null,
      contractStart: contractStart ? new Date(contractStart) : null,
      contractEnd: contractEnd ? new Date(contractEnd) : null,
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      createdById: gate.profile.id,
    },
    include: opportunityInclude,
  });

  return { ok: true, opportunity: toOpportunityDto(opp) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput,
): Promise<CrmActionResult<{ opportunity: OpportunityDto }>> {
  const gate = await requirePermission("opportunities:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!hasPermission(gate.profile.role, "opportunities:view_all")) {
    const existing = await prisma.opportunity.findUnique({
      where: { id },
      select: { assignedAgentId: true, createdById: true },
    });
    if (!existing) return { ok: false, error: "Opportunity not found.", status: 404 };
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

  return { ok: true, opportunity: toOpportunityDto(opp) };
}
