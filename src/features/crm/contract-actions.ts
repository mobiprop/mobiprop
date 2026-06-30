import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { ContractType, ContractStatus } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { buildAgentMap, agentDisplayName } from "@/lib/agent-map";
import { notifyContractCreated } from "@/features/notifications/server/notify-events";
import {
  mintContractDocumentUploadTicket,
  verifyUploadedContractDocument,
  removeContractDocumentObject,
} from "@/lib/supabase/storage";
import { createContractSchema, updateContractSchema } from "@/schemas/contract.schema";
import type { CreateContractInput, UpdateContractInput } from "@/schemas/contract.schema";
import type { ContractDto, ContractMetrics, ContractDocumentDto } from "./types/crm-dto";

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
  contactId: string | null; propertyId: string | null; opportunityId: string | null;
  type: ContractType; status: ContractStatus;
  value: unknown; startDate: Date | null; endDate: Date | null;
  signedAt: Date | null; terms: string | null; notes: string | null;
  assignedAgentId: string | null; createdById: string | null;
  createdAt: Date;
  contact: { firstName: string; lastName: string } | null;
  property: { title: string; slug: string } | null;
  opportunity: { opportunityId: string } | null;
  documents: { id: string; fileName: string; url: string; mimeType: string; sizeBytes: number; createdAt: Date }[];
};

function toContractDto(
  c: ContractWithRelations,
  agentMap: Map<string, { id: string; fullName: string | null; email: string }>,
): ContractDto {
  return {
    id: c.id,
    contractId: c.contractId,
    title: c.title,
    contactId: c.contactId,
    contactName: c.contact ? `${c.contact.firstName} ${c.contact.lastName}`.trim() : null,
    propertyId: c.propertyId,
    propertyTitle: c.property?.title ?? null,
    propertySlug: c.property?.slug ?? null,
    opportunityId: c.opportunityId,
    opportunityNumber: c.opportunity?.opportunityId ?? null,
    type: c.type,
    status: c.status,
    value: c.value !== null ? Number(c.value) : null,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    signedAt: c.signedAt?.toISOString() ?? null,
    terms: c.terms,
    notes: c.notes,
    assignedAgentId: c.assignedAgentId,
    assignedAgentName: agentDisplayName(c.assignedAgentId ? agentMap.get(c.assignedAgentId) : null),
    createdById: c.createdById,
    documents: c.documents.map((d): ContractDocumentDto => ({
      id: d.id,
      fileName: d.fileName,
      url: d.url,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt.toISOString(),
    })),
    createdAt: c.createdAt.toISOString(),
  };
}

const contractInclude = {
  contact: { select: { firstName: true, lastName: true } },
  property: { select: { title: true, slug: true } },
  opportunity: { select: { opportunityId: true } },
  documents: { orderBy: { createdAt: "desc" as const } },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listContracts(): Promise<
  CrmActionResult<{ contracts: ContractDto[]; metrics: ContractMetrics }>
> {
  const gate = await requirePermission("contracts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const rows = await prisma.contract.findMany({
    where: { isDeleted: false, ...contractRecordScope(gate.profile) },
    include: contractInclude,
    orderBy: { createdAt: "desc" },
  });

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));
  const dtos = rows.map((r) => toContractDto(r, agentMap));
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

// ── Get single ────────────────────────────────────────────────────────────────

export async function getContract(id: string): Promise<CrmActionResult<{ contract: ContractDto }>> {
  const gate = await requirePermission("contracts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const contract = await prisma.contract.findFirst({
    where: { id, isDeleted: false, ...contractRecordScope(gate.profile) },
    include: contractInclude,
  });
  if (!contract) return { ok: false, error: "Contract not found.", status: 404 };

  const agentMap = await buildAgentMap([contract.assignedAgentId]);
  return { ok: true, contract: toContractDto(contract, agentMap) };
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
      opportunityId: fields.opportunityId || null,
      // Only ADMIN/MANAGER (agents:view) may assign to an arbitrary agent. Any
      // other role (AGENT) can't see other agents, so their contracts are
      // always attributed to themselves regardless of what the client sends.
      assignedAgentId: hasPermission(gate.profile.role, "agents:view")
        ? fields.assignedAgentId ?? null
        : gate.profile.id,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdById: gate.profile.id,
    },
    include: contractInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTRACT_CREATED",
    entityType: "CONTRACT",
    entityId: contract.id,
    newValues: { title: contract.title, contactId: contract.contactId, type: contract.type, status: contract.status, value: fields.value ?? null },
  });

  void notifyContractCreated({
    contractId: contract.id,
    title: contract.title,
    assignedAgentId: contract.assignedAgentId,
    actorId: gate.profile.id,
  });

  const agentMap = await buildAgentMap([contract.assignedAgentId]);
  return { ok: true, contract: toContractDto(contract, agentMap) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateContract(
  id: string,
  input: UpdateContractInput,
): Promise<CrmActionResult<{ contract: ContractDto }>> {
  const gate = await requirePermission("contracts:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.contract.findUnique({
    where: { id },
    select: { isDeleted: true, assignedAgentId: true, createdById: true, title: true, type: true, status: true, value: true },
  });
  if (!existing || existing.isDeleted) return { ok: false, error: "Contract not found.", status: 404 };
  if (!hasPermission(gate.profile.role, "contracts:view_all")) {
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
      opportunityId: fields.opportunityId !== undefined ? (fields.opportunityId || null) : undefined,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
    },
    include: contractInclude,
  });

  const statusChanged = fields.status && fields.status !== existing.status;

  await logActivity({
    actorId: gate.profile.id,
    action: statusChanged ? "CONTRACT_STATUS_CHANGED" : "CONTRACT_UPDATED",
    entityType: "CONTRACT",
    entityId: id,
    oldValues: { title: existing.title, type: existing.type, status: existing.status, value: existing.value ? Number(existing.value) : null },
    newValues: { title: contract.title, type: contract.type, status: contract.status, value: contract.value ? Number(contract.value) : null },
  });

  const agentMap = await buildAgentMap([contract.assignedAgentId]);
  return { ok: true, contract: toContractDto(contract, agentMap) };
}

// ── Soft delete ───────────────────────────────────────────────────────────────

export async function deleteContract(id: string): Promise<CrmActionResult<{ id: string }>> {
  const gate = await requirePermission("contracts:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.contract.findUnique({ where: { id }, select: { title: true, isDeleted: true } });
  if (!existing || existing.isDeleted) return { ok: false, error: "Contract not found.", status: 404 };

  await prisma.contract.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTRACT_DELETED",
    entityType: "CONTRACT",
    entityId: id,
    oldValues: { title: existing.title, isDeleted: false },
    newValues: { isDeleted: true, deletedAt: new Date().toISOString() },
  });

  return { ok: true, id };
}

// ── Documents ─────────────────────────────────────────────────────────────────

async function assertContractAccess(id: string, gate: { profile: Profile }): Promise<CrmActionError | null> {
  const contract = await prisma.contract.findFirst({
    where: { id, isDeleted: false, ...contractRecordScope(gate.profile) },
    select: { id: true },
  });
  if (!contract) return { ok: false, error: "Contract not found.", status: 404 };
  return null;
}

export async function mintContractDocumentTicket(
  contractId: string,
  file: { name: string; type: string },
): Promise<CrmActionResult<{ ticket: { documentId: string; storagePath: string; signedUrl: string; token: string } }>> {
  const gate = await requirePermission("contracts:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertContractAccess(contractId, gate);
  if (accessError) return accessError;

  const ticket = await mintContractDocumentUploadTicket(contractId, file);
  return { ok: true, ticket };
}

export async function addContractDocument(
  contractId: string,
  storagePath: string,
  fileName: string,
): Promise<CrmActionResult<{ document: ContractDocumentDto }>> {
  const gate = await requirePermission("contracts:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertContractAccess(contractId, gate);
  if (accessError) return accessError;

  const verified = await verifyUploadedContractDocument(contractId, storagePath);

  const doc = await prisma.contractDocument.create({
    data: {
      contractId,
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
    action: "CONTRACT_DOCUMENT_UPLOADED",
    entityType: "CONTRACT",
    entityId: contractId,
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

export async function removeContractDocument(
  contractId: string,
  documentId: string,
): Promise<CrmActionResult<{ id: string }>> {
  const gate = await requirePermission("contracts:uploadDocuments");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertContractAccess(contractId, gate);
  if (accessError) return accessError;

  const doc = await prisma.contractDocument.findFirst({ where: { id: documentId, contractId } });
  if (!doc) return { ok: false, error: "Document not found.", status: 404 };

  await prisma.contractDocument.delete({ where: { id: documentId } });
  await removeContractDocumentObject(doc.storagePath);

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTRACT_DOCUMENT_REMOVED",
    entityType: "CONTRACT",
    entityId: contractId,
    oldValues: { fileName: doc.fileName },
  });

  return { ok: true, id: documentId };
}
