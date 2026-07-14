import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { EnvelopeStatus, EnvelopeSource, EnvelopeRecipientRole } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { logActivity } from "@/lib/activity-log";
import { buildAgentMap, agentDisplayName } from "@/lib/agent-map";
import {
  createEnvelopeFromTemplate,
  createEnvelopeFromDocument,
  voidEnvelope as docusignVoidEnvelope,
  resendEnvelope as docusignResendEnvelope,
  listTemplates as docusignListTemplates,
  getTemplatePageImage,
  isDocusignConfigured,
  type DocusignTemplateSummary,
} from "@/lib/docusign";
import {
  mintDocusignDocumentUploadTicket as mintDocusignDocumentUploadTicketInStorage,
  readUploadedDocusignDocument,
  removeDocusignDocumentObject,
  extensionForDocumentFile,
} from "@/lib/supabase/storage";
import {
  notifyEnvelopeSent,
  notifyEnvelopeDelivered,
  notifyEnvelopeCompleted,
  notifyEnvelopeDeclined,
  notifyEnvelopeVoided,
} from "@/features/notifications/server/notify-events";

import type { CrmActionError } from "@/features/crm/contact-actions";
type ActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── DTO ──────────────────────────────────────────────────────────────────────

export type DocusignRecipientDto = {
  id: string;
  name: string;
  email: string;
  role: EnvelopeRecipientRole;
  roleLabel: string | null;
};

export type DocusignEnvelopeDto = {
  id: string;
  docusignEnvelopeId: string;
  source: EnvelopeSource;
  templateId: string | null;
  templateName: string;
  documentFileName: string | null;
  documentUrl: string | null;
  status: EnvelopeStatus;
  recipientName: string;
  recipientEmail: string;
  recipients: DocusignRecipientDto[];
  propertyReference: string | null;
  opportunityId: string | null;
  opportunityNumber: string | null;
  sentById: string | null;
  sentByName: string | null;
  sentAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  voidedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnvelopeStats = {
  totalSent: number;
  awaitingSignature: number;
  completed: number;
  declinedOrVoided: number;
};

type EnvelopeWithRelations = {
  id: string;
  docusignEnvelopeId: string;
  source: EnvelopeSource;
  templateId: string | null;
  templateName: string;
  documentFileName: string | null;
  documentUrl: string | null;
  status: EnvelopeStatus;
  recipientName: string;
  recipientEmail: string;
  propertyReference: string | null;
  opportunityId: string | null;
  sentById: string | null;
  sentAt: Date;
  expiresAt: Date | null;
  completedAt: Date | null;
  voidedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity: { opportunityId: string; assignedAgentId: string | null } | null;
  recipients: { id: string; name: string; email: string; role: EnvelopeRecipientRole; roleLabel: string | null }[];
};

function toEnvelopeDto(
  e: EnvelopeWithRelations,
  agentMap: Map<string, { id: string; fullName: string | null; email: string }>,
): DocusignEnvelopeDto {
  return {
    id: e.id,
    docusignEnvelopeId: e.docusignEnvelopeId,
    source: e.source,
    templateId: e.templateId,
    templateName: e.templateName,
    documentFileName: e.documentFileName,
    documentUrl: e.documentUrl,
    status: e.status,
    recipientName: e.recipientName,
    recipientEmail: e.recipientEmail,
    recipients: e.recipients.map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role, roleLabel: r.roleLabel })),
    propertyReference: e.propertyReference,
    opportunityId: e.opportunityId,
    opportunityNumber: e.opportunity?.opportunityId ?? null,
    sentById: e.sentById,
    sentByName: agentDisplayName(e.sentById ? agentMap.get(e.sentById) : null),
    sentAt: e.sentAt.toISOString(),
    expiresAt: e.expiresAt?.toISOString() ?? null,
    completedAt: e.completedAt?.toISOString() ?? null,
    voidedReason: e.voidedReason,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

const envelopeInclude = {
  opportunity: { select: { opportunityId: true, assignedAgentId: true } },
  recipients: { orderBy: { createdAt: "asc" } },
} as const;

// ── Record-level access ──────────────────────────────────────────────────────
// ADMIN/MANAGER (docusign:view_all) see every envelope. AGENT sees only
// envelopes they personally sent, or that are linked to an Opportunity
// they created/are assigned to — mirrors the opportunity/contract pattern.

async function envelopeRecordScope(profile: Profile): Promise<Prisma.DocusignEnvelopeWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return {};
  return {
    OR: [
      { sentById: { in: scopeIds } },
      { opportunity: { assignedAgentId: { in: scopeIds } } },
      { opportunity: { createdById: { in: scopeIds } } },
    ],
  };
}

/** The agent to notify/attribute an envelope event to — whoever sent it, falling back to the linked opportunity's assigned agent. */
function envelopeOwnerId(e: { sentById: string | null; opportunity: { assignedAgentId: string | null } | null }): string | null {
  return e.sentById ?? e.opportunity?.assignedAgentId ?? null;
}

/** Mirrors opportunityRecordScope in opportunity-actions: AGENT/team scope only reaches opportunities they created or are assigned to. */
async function opportunityRecordScope(profile: Profile): Promise<Prisma.OpportunityWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return {};
  return { OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
}

/** 404s (never 403s, to avoid existence leaks) when the opportunity is missing, deleted, or outside the caller's record scope. */
async function assertOpportunityAccess(opportunityId: string, profile: Profile): Promise<CrmActionError | null> {
  const scope = await opportunityRecordScope(profile);
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, isDeleted: false, ...scope },
    select: { id: true },
  });
  if (!opportunity) return { ok: false, error: "Opportunity not found.", status: 404 };
  return null;
}

// ── List + stats ─────────────────────────────────────────────────────────────

export async function listEnvelopes(): Promise<ActionResult<{ envelopes: DocusignEnvelopeDto[]; stats: EnvelopeStats }>> {
  const gate = await requirePermission("docusign:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = await envelopeRecordScope(gate.profile);
  const rows = await prisma.docusignEnvelope.findMany({
    where: scope,
    include: envelopeInclude,
    orderBy: { sentAt: "desc" },
  });

  const agentMap = await buildAgentMap(rows.map((r) => r.sentById));
  const envelopes = rows.map((r) => toEnvelopeDto(r, agentMap));

  const stats: EnvelopeStats = {
    totalSent: envelopes.length,
    awaitingSignature: envelopes.filter((e) => e.status === EnvelopeStatus.SENT || e.status === EnvelopeStatus.DELIVERED).length,
    completed: envelopes.filter((e) => e.status === EnvelopeStatus.COMPLETED).length,
    declinedOrVoided: envelopes.filter((e) => e.status === EnvelopeStatus.DECLINED || e.status === EnvelopeStatus.VOIDED).length,
  };

  return { ok: true, envelopes, stats };
}

// ── Templates ────────────────────────────────────────────────────────────────

export async function listAvailableTemplates(): Promise<ActionResult<{ templates: DocusignTemplateSummary[]; usedCounts: Record<string, number> }>> {
  const gate = await requirePermission("docusign:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!isDocusignConfigured()) {
    return { ok: true, templates: [], usedCounts: {} };
  }

  try {
    const [templates, usedCountRows] = await Promise.all([
      docusignListTemplates(),
      prisma.docusignEnvelope.groupBy({ by: ["templateId"], _count: { templateId: true } }),
    ]);
    const usedCounts = Object.fromEntries(usedCountRows.map((r) => [r.templateId, r._count.templateId]));
    return { ok: true, templates, usedCounts };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to load DocuSign templates.", status: 502 };
  }
}

export async function getTemplatePreviewImage(
  templateId: string,
): Promise<ActionResult<{ contentType: string; buffer: Buffer }>> {
  const gate = await requirePermission("docusign:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!isDocusignConfigured()) {
    return { ok: false, error: "DocuSign is not configured yet.", status: 503 };
  }

  try {
    const image = await getTemplatePageImage(templateId);
    return { ok: true, ...image };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to load template preview.", status: 502 };
  }
}

// ── Send for signature ──────────────────────────────────────────────────────

export type SendForSignatureInput = {
  templateId: string;
  templateName: string;
  recipientName: string;
  recipientEmail: string;
  propertyReference?: string;
  expiresInDays?: number;
  message?: string;
  opportunityId?: string;
};

export async function sendEnvelopeForSignature(
  input: SendForSignatureInput,
): Promise<ActionResult<{ envelope: DocusignEnvelopeDto }>> {
  const gate = await requirePermission("docusign:send");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!isDocusignConfigured()) {
    return { ok: false, error: "DocuSign is not configured yet.", status: 503 };
  }

  if (input.opportunityId) {
    const accessError = await assertOpportunityAccess(input.opportunityId, gate.profile);
    if (accessError) return accessError;
  }

  let created;
  try {
    created = await createEnvelopeFromTemplate({
      templateId: input.templateId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      propertyReference: input.propertyReference,
      expiresInDays: input.expiresInDays,
      message: input.message,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send the envelope via DocuSign.", status: 502 };
  }

  const defaultExpiryDays = input.expiresInDays ?? (await getSettingsRow()).defaultExpiryDays;
  const expiresAt = new Date(Date.now() + defaultExpiryDays * 24 * 60 * 60 * 1000);

  const envelope = await prisma.docusignEnvelope.create({
    data: {
      docusignEnvelopeId: created.envelopeId,
      templateId: input.templateId,
      templateName: input.templateName,
      status: EnvelopeStatus.SENT,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      propertyReference: input.propertyReference || null,
      opportunityId: input.opportunityId || null,
      sentById: gate.profile.id,
      expiresAt,
    },
    include: envelopeInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_SENT",
    entityType: "DOCUSIGN_ENVELOPE",
    entityId: envelope.id,
    newValues: { templateName: envelope.templateName, recipientEmail: envelope.recipientEmail },
  });

  void notifyEnvelopeSent({
    envelopeId: envelope.id,
    templateName: envelope.templateName,
    recipientName: envelope.recipientName,
    assignedAgentId: envelopeOwnerId(envelope),
    actorId: gate.profile.id,
  });

  const agentMap = await buildAgentMap([envelope.sentById]);
  return { ok: true, envelope: toEnvelopeDto(envelope, agentMap) };
}

// ── Upload custom contract ──────────────────────────────────────────────────
// A one-off PDF/DOC/DOCX (not a reusable DocuSign template) sent via
// DocuSign Free Form Signing, with staff-entered recipients/roles instead of
// template roles. See [[docusign-custom-contracts]].

export async function mintCustomContractUploadTicket(
  file: { name: string; type: string },
): Promise<ActionResult<{ ticket: { uploadId: string; storagePath: string; signedUrl: string; token: string } }>> {
  const gate = await requirePermission("docusign:send");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const ticket = await mintDocusignDocumentUploadTicketInStorage(file);
  return { ok: true, ticket };
}

export type CustomContractRecipientInput = {
  name: string;
  email: string;
  role: EnvelopeRecipientRole;
  roleLabel?: string;
};

export type SendCustomContractInput = {
  // A fresh upload sitting in the docusign-documents bucket's pending/ area —
  // always required. There is no other document source; Opportunities don't
  // hold their own internal file storage.
  documentStoragePath: string;
  documentFileName: string;
  recipients: CustomContractRecipientInput[];
  propertyReference?: string;
  expiresInDays?: number;
  message?: string;
  opportunityId?: string;
};

const ROLE_LABELS: Record<EnvelopeRecipientRole, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  AGENT: "Agent",
  THIRD_PARTY: "Third-Party Company",
  OTHER: "Other",
};

export async function sendCustomContractForSignature(
  input: SendCustomContractInput,
): Promise<ActionResult<{ envelope: DocusignEnvelopeDto }>> {
  const gate = await requirePermission("docusign:send");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  if (!isDocusignConfigured()) {
    return { ok: false, error: "DocuSign is not configured yet.", status: 503 };
  }

  if (input.opportunityId) {
    const accessError = await assertOpportunityAccess(input.opportunityId, gate.profile);
    if (accessError) return accessError;
  }

  const recipients = input.recipients
    .map((r) => ({ ...r, name: r.name.trim(), email: r.email.trim(), roleLabel: r.roleLabel?.trim() || undefined }))
    .filter((r) => r.name && r.email);
  if (recipients.length === 0) {
    return { ok: false, error: "At least one recipient with a name and email is required.", status: 400 };
  }

  // Resolve the document to send — always a fresh pending upload.
  if (!input.documentStoragePath || !input.documentFileName) {
    return { ok: false, error: "An uploaded document is required.", status: 400 };
  }
  let uploaded;
  try {
    uploaded = await readUploadedDocusignDocument(input.documentStoragePath);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to read the uploaded document.", status: 400 };
  }
  const document = {
    fileName: input.documentFileName,
    url: uploaded.url,
    mimeType: uploaded.mimeType,
    buffer: uploaded.buffer,
    pendingStoragePath: input.documentStoragePath,
  };

  let created;
  try {
    created = await createEnvelopeFromDocument({
      documentBase64: document.buffer.toString("base64"),
      documentName: document.fileName,
      fileExtension: extensionForDocumentFile(document.mimeType, document.fileName),
      recipients: recipients.map((r) => ({
        name: r.name,
        email: r.email,
        roleLabel: r.role === EnvelopeRecipientRole.OTHER ? r.roleLabel || "Other" : ROLE_LABELS[r.role],
      })),
      expiresInDays: input.expiresInDays,
      message: input.message,
    });
  } catch (error) {
    void removeDocusignDocumentObject(document.pendingStoragePath);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send the document via DocuSign.", status: 502 };
  }

  const defaultExpiryDays = input.expiresInDays ?? (await getSettingsRow()).defaultExpiryDays;
  const expiresAt = new Date(Date.now() + defaultExpiryDays * 24 * 60 * 60 * 1000);
  const primary = recipients[0];

  const envelope = await prisma.docusignEnvelope.create({
    data: {
      docusignEnvelopeId: created.envelopeId,
      source: EnvelopeSource.CUSTOM_UPLOAD,
      templateId: null,
      templateName: document.fileName,
      documentFileName: document.fileName,
      documentStoragePath: document.pendingStoragePath,
      documentUrl: document.url,
      documentMimeType: document.mimeType,
      status: EnvelopeStatus.SENT,
      recipientName: primary.name,
      recipientEmail: primary.email,
      propertyReference: input.propertyReference || null,
      opportunityId: input.opportunityId || null,
      sentById: gate.profile.id,
      expiresAt,
      recipients: {
        create: recipients.map((r) => ({ name: r.name, email: r.email, role: r.role, roleLabel: r.roleLabel ?? null })),
      },
    },
    include: envelopeInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_SENT",
    entityType: "DOCUSIGN_ENVELOPE",
    entityId: envelope.id,
    newValues: { documentFileName: envelope.documentFileName, recipientCount: recipients.length },
  });

  void notifyEnvelopeSent({
    envelopeId: envelope.id,
    templateName: envelope.templateName,
    recipientName: envelope.recipientName,
    assignedAgentId: envelopeOwnerId(envelope),
    actorId: gate.profile.id,
  });

  const agentMap = await buildAgentMap([envelope.sentById]);
  return { ok: true, envelope: toEnvelopeDto(envelope, agentMap) };
}

// ── Void / resend ────────────────────────────────────────────────────────────

async function assertEnvelopeAccess(id: string, gate: { profile: Profile }): Promise<{ envelope: EnvelopeWithRelations } | CrmActionError> {
  const scope = await envelopeRecordScope(gate.profile);
  const envelope = await prisma.docusignEnvelope.findFirst({ where: { id, ...scope }, include: envelopeInclude });
  if (!envelope) return { ok: false, error: "Envelope not found.", status: 404 };
  return { envelope };
}

export async function voidEnvelopeAction(id: string, reason: string): Promise<ActionResult<{ id: string }>> {
  const gate = await requirePermission("docusign:void");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const access = await assertEnvelopeAccess(id, gate);
  if ("ok" in access) return access;

  if (access.envelope.status === EnvelopeStatus.VOIDED) {
    return { ok: false, error: "This envelope is already voided.", status: 409 };
  }
  if (access.envelope.status === EnvelopeStatus.COMPLETED || access.envelope.status === EnvelopeStatus.DECLINED) {
    return { ok: false, error: "Completed or declined envelopes can no longer be voided.", status: 409 };
  }

  try {
    await docusignVoidEnvelope(access.envelope.docusignEnvelopeId, reason);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to void the envelope via DocuSign.", status: 502 };
  }
  await prisma.docusignEnvelope.update({
    where: { id },
    data: { status: EnvelopeStatus.VOIDED, voidedReason: reason },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_VOIDED",
    entityType: "DOCUSIGN_ENVELOPE",
    entityId: id,
    newValues: { voidedReason: reason },
  });

  void notifyEnvelopeVoided({
    envelopeId: id,
    templateName: access.envelope.templateName,
    recipientName: access.envelope.recipientName,
    assignedAgentId: envelopeOwnerId(access.envelope),
    actorId: gate.profile.id,
  });

  return { ok: true, id };
}

export async function resendEnvelopeAction(id: string): Promise<ActionResult<{ id: string }>> {
  const gate = await requirePermission("docusign:resend");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const access = await assertEnvelopeAccess(id, gate);
  if ("ok" in access) return access;

  if (access.envelope.status !== EnvelopeStatus.SENT && access.envelope.status !== EnvelopeStatus.DELIVERED) {
    return { ok: false, error: "Only envelopes awaiting signature can be resent.", status: 409 };
  }

  try {
    await docusignResendEnvelope(access.envelope.docusignEnvelopeId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to resend the envelope via DocuSign.", status: 502 };
  }

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_RESENT",
    entityType: "DOCUSIGN_ENVELOPE",
    entityId: id,
  });

  return { ok: true, id };
}

// ── Attach / detach on an Opportunity ───────────────────────────────────────

export async function attachEnvelopeToOpportunity(
  envelopeId: string,
  opportunityId: string,
): Promise<ActionResult<{ id: string }>> {
  const gate = await requirePermission("opportunities:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const accessError = await assertOpportunityAccess(opportunityId, gate.profile);
  if (accessError) return accessError;

  const scope = await envelopeRecordScope(gate.profile);
  const envelope = await prisma.docusignEnvelope.findFirst({ where: { id: envelopeId, ...scope }, select: { id: true } });
  if (!envelope) return { ok: false, error: "Envelope not found.", status: 404 };

  await prisma.docusignEnvelope.update({ where: { id: envelopeId }, data: { opportunityId } });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_ATTACHED",
    entityType: "OPPORTUNITY",
    entityId: opportunityId,
    newValues: { envelopeId },
  });

  return { ok: true, id: envelopeId };
}

export async function detachEnvelopeFromOpportunity(envelopeId: string): Promise<ActionResult<{ id: string }>> {
  const gate = await requirePermission("opportunities:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = await envelopeRecordScope(gate.profile);
  const envelope = await prisma.docusignEnvelope.findFirst({ where: { id: envelopeId, ...scope }, select: { id: true, opportunityId: true } });
  if (!envelope) return { ok: false, error: "Envelope not found.", status: 404 };

  await prisma.docusignEnvelope.update({ where: { id: envelopeId }, data: { opportunityId: null } });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_ENVELOPE_DETACHED",
    entityType: "OPPORTUNITY",
    entityId: envelope.opportunityId ?? envelopeId,
    oldValues: { envelopeId },
  });

  return { ok: true, id: envelopeId };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export type DocusignSettingsDto = {
  defaultExpiryDays: number;
  autoReminderDays: number;
  autoSendReminders: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

async function getSettingsRow() {
  // Seeded by the Phase 1 migration — always present.
  return prisma.docusignSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function getDocusignSettings(): Promise<ActionResult<{ settings: DocusignSettingsDto }>> {
  const gate = await requirePermission("docusign:manageSettings");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const row = await getSettingsRow();
  return {
    ok: true,
    settings: {
      defaultExpiryDays: row.defaultExpiryDays,
      autoReminderDays: row.autoReminderDays,
      autoSendReminders: row.autoSendReminders,
      emailNotifications: row.emailNotifications,
      smsNotifications: row.smsNotifications,
    },
  };
}

export async function updateDocusignSettings(
  input: Partial<DocusignSettingsDto>,
): Promise<ActionResult<{ settings: DocusignSettingsDto }>> {
  const gate = await requirePermission("docusign:manageSettings");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const row = await prisma.docusignSettings.upsert({
    where: { id: "default" },
    update: input,
    create: { id: "default", ...input },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "DOCUSIGN_SETTINGS_UPDATED",
    entityType: "DOCUSIGN_SETTINGS",
    entityId: "default",
    newValues: input,
  });

  return {
    ok: true,
    settings: {
      defaultExpiryDays: row.defaultExpiryDays,
      autoReminderDays: row.autoReminderDays,
      autoSendReminders: row.autoSendReminders,
      emailNotifications: row.emailNotifications,
      smsNotifications: row.smsNotifications,
    },
  };
}

// ── Webhook — no permission gate, called only from the signed-webhook route ──

/**
 * Applies one DocuSign Connect status-change event, idempotently. `eventKey`
 * must be stable for a redelivered event and different across genuine
 * distinct events (the webhook route builds it as
 * `${event}:${envelopeId}:${status}`). Status only ever advances forward
 * (SENT -> DELIVERED -> a terminal state) — a stale/out-of-order redelivery
 * is a no-op.
 */
const STATUS_RANK: Record<EnvelopeStatus, number> = {
  SENT: 0,
  DELIVERED: 1,
  COMPLETED: 2,
  DECLINED: 2,
  VOIDED: 2,
};

export async function applyEnvelopeWebhookEvent(input: {
  docusignEnvelopeId: string;
  eventKey: string;
  status: EnvelopeStatus;
  recipientName?: string;
}): Promise<void> {
  const envelope = await prisma.docusignEnvelope.findUnique({
    where: { docusignEnvelopeId: input.docusignEnvelopeId },
    include: envelopeInclude,
  });
  if (!envelope) return; // Unknown envelope (different env, or predates this table) — ack and ignore.
  if (envelope.lastWebhookEventId === input.eventKey) return; // Already processed this exact event.
  if (STATUS_RANK[input.status] < STATUS_RANK[envelope.status]) return; // Stale/out-of-order — ignore.

  const wasAlready = envelope.status === input.status;

  const updated = await prisma.docusignEnvelope.update({
    where: { id: envelope.id },
    data: {
      status: input.status,
      lastWebhookEventId: input.eventKey,
      completedAt: input.status === EnvelopeStatus.COMPLETED ? new Date() : undefined,
    },
    include: envelopeInclude,
  });

  if (wasAlready) return; // Same status, just a redelivered/duplicate event with a new key — no new notification.

  const recipientName = input.recipientName || updated.recipientName;
  const ownerId = envelopeOwnerId(updated);
  const notifyInput = { envelopeId: updated.id, templateName: updated.templateName, recipientName, assignedAgentId: ownerId, actorId: null };

  if (input.status === EnvelopeStatus.DELIVERED) void notifyEnvelopeDelivered(notifyInput);
  else if (input.status === EnvelopeStatus.COMPLETED) void notifyEnvelopeCompleted(notifyInput);
  else if (input.status === EnvelopeStatus.DECLINED) void notifyEnvelopeDeclined(notifyInput);
  else if (input.status === EnvelopeStatus.VOIDED) void notifyEnvelopeVoided(notifyInput);
}

// ── "My Contracts" for authenticated public users ───────────────────────────

export type MyContractDto = {
  id: string;
  templateName: string;
  source: EnvelopeSource;
  status: EnvelopeStatus;
  role: "BUYER" | "SELLER" | "AGENCY" | null;
  opportunityNumber: string | null;
  propertyReference: string | null;
  sentAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  /**
   * Only set for CUSTOM_UPLOAD — a signed URL to the originally uploaded
   * document. TEMPLATE envelopes have no locally-held file (the document
   * lives in DocuSign's own system), so this stays null for those; there is
   * no "view/download" surface for a template-sourced contract yet.
   */
  documentUrl: string | null;
  documentFileName: string | null;
};

export async function getMyContracts(profileId: string): Promise<MyContractDto[]> {
  // Public users only see envelopes tied to an Opportunity they're a
  // participant on (matched by contact email), sent directly to their
  // profile email as the primary recipient, or naming them as any signer
  // on a CUSTOM_UPLOAD envelope's recipient list — mirrors the getMyTours
  // pattern.
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { email: true } });
  if (!profile) return [];

  const contact = await prisma.contact.findFirst({
    where: { email: profile.email, isDeleted: false },
    select: { opportunityParticipants: { select: { opportunityId: true, role: true } } },
  });

  const roleByOpportunity = new Map<string, "BUYER" | "SELLER" | "AGENCY">();
  for (const p of contact?.opportunityParticipants ?? []) {
    if (!roleByOpportunity.has(p.opportunityId)) roleByOpportunity.set(p.opportunityId, p.role);
  }
  const opportunityIds = [...roleByOpportunity.keys()];

  const rows = await prisma.docusignEnvelope.findMany({
    where: {
      OR: [
        ...(opportunityIds.length ? [{ opportunityId: { in: opportunityIds } }] : []),
        { recipientEmail: profile.email },
        // A named signer on a CUSTOM_UPLOAD envelope who isn't the primary
        // recipient (and isn't covered by the opportunity match above,
        // e.g. a standalone envelope with no Opportunity attached).
        { recipients: { some: { email: profile.email } } },
      ],
    },
    orderBy: { sentAt: "desc" },
    include: { opportunity: { select: { opportunityId: true } } },
  });

  const seen = new Set<string>();
  const contracts: MyContractDto[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    contracts.push({
      id: r.id,
      templateName: r.templateName,
      source: r.source,
      status: r.status,
      role: r.opportunityId ? roleByOpportunity.get(r.opportunityId) ?? null : null,
      opportunityNumber: r.opportunity?.opportunityId ?? null,
      propertyReference: r.propertyReference,
      sentAt: r.sentAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
      documentUrl: r.documentUrl,
      documentFileName: r.documentFileName,
    });
  }
  return contracts;
}
