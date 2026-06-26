import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { ContractType, ContractStatus } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { createContractSchema, updateContractSchema } from "@/schemas/contract.schema";
import type { CreateContractInput, UpdateContractInput } from "@/schemas/contract.schema";
import type { ContractDto, ContractMetrics } from "./types/crm-dto";

import type { CrmActionError } from "./contact-actions";
type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── Record-level access ──────────────────────────────────────────────────────

/** ADMIN/MANAGER see all contracts; AGENT only ones they created or are assigned to. */
function contractRecordScope(profile: Profile): Prisma.ContractWhereInput {
  if (hasPermission(profile.role, "contracts:view_all")) return {};
  return { OR: [{ assignedAgentId: profile.id }, { createdById: profile.id }] };
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextContractId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(contract_id FROM 5) AS INTEGER)) AS max FROM contracts
  `;
  return `CON-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

type ContractWithRelations = {
  id: string; contractId: string; title: string;
  contactId: string | null; propertyId: string | null;
  type: ContractType; status: ContractStatus;
  value: unknown; startDate: Date | null; endDate: Date | null;
  signedAt: Date | null; terms: string | null; notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  contact: { firstName: string; lastName: string } | null;
  property: { title: string; slug: string } | null;
};

function toContractDto(c: ContractWithRelations): ContractDto {
  return {
    id: c.id,
    contractId: c.contractId,
    title: c.title,
    contactId: c.contactId,
    contactName: c.contact ? `${c.contact.firstName} ${c.contact.lastName}`.trim() : null,
    propertyId: c.propertyId,
    propertyTitle: c.property?.title ?? null,
    propertySlug: c.property?.slug ?? null,
    type: c.type,
    status: c.status,
    value: c.value !== null ? Number(c.value) : null,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    signedAt: c.signedAt?.toISOString() ?? null,
    terms: c.terms,
    notes: c.notes,
    assignedAgentId: c.assignedAgentId,
    createdById: c.createdById,
    createdAt: c.createdAt.toISOString(),
  };
}

const contractInclude = {
  contact: { select: { firstName: true, lastName: true } },
  property: { select: { title: true, slug: true } },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listContracts(): Promise<
  CrmActionResult<{ contracts: ContractDto[]; metrics: ContractMetrics }>
> {
  const gate = await requirePermission("contracts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const rows = await prisma.contract.findMany({
    where: contractRecordScope(gate.profile),
    include: contractInclude,
    orderBy: { createdAt: "desc" },
  });

  const dtos = rows.map(toContractDto);
  const totalValue = dtos.reduce((sum, c) => sum + (c.value ?? 0), 0);

  return {
    ok: true,
    contracts: dtos,
    metrics: {
      total: dtos.length,
      active: dtos.filter((c) => c.status === ContractStatus.ACTIVE).length,
      pending: dtos.filter((c) => c.status === ContractStatus.PENDING).length,
      completed: dtos.filter((c) => c.status === ContractStatus.COMPLETED).length,
      totalValue,
    },
  };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createContract(
  input: CreateContractInput,
): Promise<CrmActionResult<{ contract: ContractDto }>> {
  const gate = await requirePermission("contracts:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { startDate, endDate, ...fields } = parsed.data;
  const contractId = await nextContractId();

  const contract = await prisma.contract.create({
    data: {
      ...fields,
      contractId,
      contactId: fields.contactId || null,
      propertyId: fields.propertyId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdById: gate.profile.id,
    },
    include: contractInclude,
  });

  return { ok: true, contract: toContractDto(contract) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateContract(
  id: string,
  input: UpdateContractInput,
): Promise<CrmActionResult<{ contract: ContractDto }>> {
  const gate = await requirePermission("contracts:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!hasPermission(gate.profile.role, "contracts:view_all")) {
    const existing = await prisma.contract.findUnique({
      where: { id },
      select: { assignedAgentId: true, createdById: true },
    });
    if (!existing) return { ok: false, error: "Contract not found.", status: 404 };
    if (existing.assignedAgentId !== gate.profile.id && existing.createdById !== gate.profile.id) {
      return { ok: false, error: "You can only update your own or assigned contracts.", status: 403 };
    }
  }

  const parsed = updateContractSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { startDate, endDate, ...fields } = parsed.data;

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      ...fields,
      contactId: fields.contactId !== undefined ? (fields.contactId || null) : undefined,
      propertyId: fields.propertyId !== undefined ? (fields.propertyId || null) : undefined,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
    },
    include: contractInclude,
  });

  return { ok: true, contract: toContractDto(contract) };
}
