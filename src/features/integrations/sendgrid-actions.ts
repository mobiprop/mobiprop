import "server-only";

// Server actions for the SendGrid marketing module (dashboard → Integrations →
// SendGrid → Manage). Everything SendGrid-related happens here or in
// src/lib/sendgrid-marketing.ts — the API key never reaches the browser.

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import {
  EmailCampaignStatus,
  EmailRecipientStatus,
  EmailSendStatus,
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { toCsv } from "@/lib/csv";
import {
  getSendgridConfigStatus,
  isSendgridConfigured,
  sendCampaignBatches,
  sendCampaignTest,
  testSendgridConnection,
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_FROM_NAME,
  type SendgridConfigStatus,
  type SendgridConnectionInfo,
} from "@/lib/sendgrid-marketing";
import { getMarketingTemplate } from "@/features/integrations/email-marketing-templates";
import { dispatchNotification } from "@/features/notifications/server/notify-events";

import type { CrmActionError } from "@/features/crm/contact-actions";
type ActionResult<T> = ({ ok: true } & T) | CrmActionError;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Hard cap per import request — keeps payloads and transactions bounded. */
const IMPORT_ROW_LIMIT = 5000;
const SYSTEM_LIST_ID = "emls_all_contacts_system";

function fail(status: number, error: string): CrmActionError {
  return { ok: false, error, status };
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export type EmailListDto = {
  id: string;
  listId: string;
  name: string;
  description: string | null;
  doubleOptIn: boolean;
  isSystem: boolean;
  memberCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  updatedAt: string;
};

export type EmailRecipientDto = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  source: string | null;
  status: EmailRecipientStatus;
  createdAt: string;
  updatedAt: string;
};

export type CampaignMetricsDto = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  dropped: number;
  unsubscribed: number;
  spamReports: number;
  failed: number;
};

export type EmailCampaignDto = {
  id: string;
  campaignId: string;
  name: string;
  subject: string;
  previewText: string | null;
  fromName: string;
  fromEmail: string;
  htmlBody: string;
  templateKey: string | null;
  status: EmailCampaignStatus;
  listId: string | null;
  listName: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  sentById: string | null;
  failedReason: string | null;
  totalRecipients: number;
  metrics: CampaignMetricsDto;
  lastEventAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SendgridSettingsDto = {
  defaultFromName: string;
  defaultFromEmail: string;
  clickTracking: boolean;
  openTracking: boolean;
  sandboxMode: boolean;
  lastConnectionTestAt: string | null;
};

export type SendgridOverviewDto = {
  emailsSent: number;
  openRate: number | null;
  clickRate: number | null;
  bounceRate: number | null;
  totalLists: number;
  totalRecipients: number;
  subscribedRecipients: number;
  unsubscribedRecipients: number;
  bouncedRecipients: number;
  campaignsSent: number;
  draftCampaigns: number;
  scheduledCampaigns: { id: string; name: string; recipients: number; scheduledAt: string }[];
  funnel: { sent: number; delivered: number; opened: number; clicked: number };
  /** False until at least one webhook event has been stored — the UI must say
   *  metrics are pending webhook setup instead of showing misleading zeros. */
  metricsAvailable: boolean;
  recentActivity: { id: string; kind: string; title: string; detail: string; at: string }[];
  lastCampaignSentAt: string | null;
};

const EMPTY_METRICS: CampaignMetricsDto = {
  sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0,
  dropped: 0, unsubscribed: 0, spamReports: 0, failed: 0,
};

// ── Status ───────────────────────────────────────────────────────────────────

export type SendgridStatusResult = ActionResult<{
  connected: boolean;
  config: SendgridConfigStatus;
}>;

export async function getSendgridStatus(): Promise<SendgridStatusResult> {
  const gate = await requirePermission("sendgrid:view");
  if (!gate.ok) return fail(403, gate.error);
  return { ok: true, connected: isSendgridConfigured(), config: getSendgridConfigStatus() };
}

// ── Overview ─────────────────────────────────────────────────────────────────

type MetricsRow = {
  campaign_id: string;
  sent: bigint; failed: bigint; delivered: bigint; opened: bigint; clicked: bigint;
  bounced: bigint; dropped: bigint; unsubscribed: bigint; spam: bigint;
};

async function campaignMetricsByCampaign(): Promise<Map<string, CampaignMetricsDto>> {
  const rows = await prisma.$queryRaw<MetricsRow[]>`
    SELECT campaign_id,
      COUNT(*) FILTER (WHERE status = 'SENT')  AS sent,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
      COUNT(delivered_at)     AS delivered,
      COUNT(opened_at)        AS opened,
      COUNT(clicked_at)       AS clicked,
      COUNT(bounced_at)       AS bounced,
      COUNT(dropped_at)       AS dropped,
      COUNT(unsubscribed_at)  AS unsubscribed,
      COUNT(spam_reported_at) AS spam
    FROM email_campaign_recipients
    GROUP BY campaign_id
  `;
  const map = new Map<string, CampaignMetricsDto>();
  for (const r of rows) {
    map.set(r.campaign_id, {
      sent: Number(r.sent), failed: Number(r.failed), delivered: Number(r.delivered),
      opened: Number(r.opened), clicked: Number(r.clicked), bounced: Number(r.bounced),
      dropped: Number(r.dropped), unsubscribed: Number(r.unsubscribed), spamReports: Number(r.spam),
    });
  }
  return map;
}

export async function getSendgridOverview(): Promise<ActionResult<{ overview: SendgridOverviewDto }>> {
  const gate = await requirePermission("sendgrid:view");
  if (!gate.ok) return fail(403, gate.error);

  const [metricsMap, recipientGroups, listCount, campaignCounts, scheduled, recentCampaigns, eventCount, lastSent] =
    await Promise.all([
      campaignMetricsByCampaign(),
      prisma.emailRecipient.groupBy({ by: ["status"], _count: true }),
      prisma.emailList.count(),
      prisma.emailCampaign.groupBy({ by: ["status"], _count: true }),
      prisma.emailCampaign.findMany({
        where: { status: EmailCampaignStatus.SCHEDULED },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        select: { id: true, name: true, totalRecipients: true, scheduledAt: true, list: { select: { _count: { select: { members: true } } } } },
      }),
      prisma.emailCampaign.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, name: true, status: true, sentAt: true, totalRecipients: true, updatedAt: true, failedReason: true },
      }),
      prisma.emailCampaignEvent.count(),
      prisma.emailCampaign.findFirst({
        where: { status: EmailCampaignStatus.SENT },
        orderBy: { sentAt: "desc" },
        select: { sentAt: true },
      }),
    ]);

  const totals = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
  for (const m of metricsMap.values()) {
    totals.sent += m.sent;
    totals.delivered += m.delivered;
    totals.opened += m.opened;
    totals.clicked += m.clicked;
    totals.bounced += m.bounced;
  }

  const recipientsByStatus = Object.fromEntries(recipientGroups.map((g) => [g.status, g._count]));
  const campaignsByStatus = Object.fromEntries(campaignCounts.map((g) => [g.status, g._count]));
  const totalRecipients = recipientGroups.reduce((sum, g) => sum + g._count, 0);

  const rate = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

  const overview: SendgridOverviewDto = {
    emailsSent: totals.sent,
    openRate: eventCount > 0 ? rate(totals.opened, totals.delivered || totals.sent) : null,
    clickRate: eventCount > 0 ? rate(totals.clicked, totals.opened) : null,
    bounceRate: eventCount > 0 ? rate(totals.bounced, totals.sent) : null,
    totalLists: listCount,
    totalRecipients,
    subscribedRecipients: recipientsByStatus[EmailRecipientStatus.SUBSCRIBED] ?? 0,
    unsubscribedRecipients: recipientsByStatus[EmailRecipientStatus.UNSUBSCRIBED] ?? 0,
    bouncedRecipients: recipientsByStatus[EmailRecipientStatus.BOUNCED] ?? 0,
    campaignsSent: campaignsByStatus[EmailCampaignStatus.SENT] ?? 0,
    draftCampaigns: campaignsByStatus[EmailCampaignStatus.DRAFT] ?? 0,
    scheduledCampaigns: scheduled.map((c) => ({
      id: c.id,
      name: c.name,
      recipients: c.totalRecipients > 0 ? c.totalRecipients : c.list?._count.members ?? 0,
      scheduledAt: c.scheduledAt?.toISOString() ?? "",
    })),
    funnel: totals,
    metricsAvailable: eventCount > 0,
    recentActivity: recentCampaigns.map((c) => ({
      id: c.id,
      kind: c.status,
      title:
        c.status === EmailCampaignStatus.SENT
          ? "Campaign sent"
          : c.status === EmailCampaignStatus.FAILED
            ? "Campaign failed"
            : c.status === EmailCampaignStatus.SCHEDULED
              ? "Campaign scheduled"
              : c.status === EmailCampaignStatus.SENDING
                ? "Campaign sending"
                : "Draft updated",
      detail:
        c.status === EmailCampaignStatus.SENT
          ? `${c.name} reached ${c.totalRecipients} recipients`
          : c.status === EmailCampaignStatus.FAILED
            ? `${c.name} — ${c.failedReason ?? "send failed"}`
            : c.name,
      at: (c.sentAt ?? c.updatedAt).toISOString(),
    })),
    lastCampaignSentAt: lastSent?.sentAt?.toISOString() ?? null,
  };

  return { ok: true, overview };
}

// ── Lists ────────────────────────────────────────────────────────────────────

async function nextListId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(list_id FROM 6) AS INTEGER)) AS max FROM email_lists
  `;
  return `LIST-${String((row?.max ?? 0) + 1).padStart(3, "0")}`;
}

type ListWithCounts = {
  id: string;
  listId: string;
  name: string;
  description: string | null;
  doubleOptIn: boolean;
  isSystem: boolean;
  updatedAt: Date;
  members: { recipient: { status: EmailRecipientStatus } }[];
};

function toListDto(list: ListWithCounts): EmailListDto {
  const statuses = list.members.map((m) => m.recipient.status);
  return {
    id: list.id,
    listId: list.listId,
    name: list.name,
    description: list.description,
    doubleOptIn: list.doubleOptIn,
    isSystem: list.isSystem,
    memberCount: statuses.length,
    unsubscribedCount: statuses.filter((s) => s === EmailRecipientStatus.UNSUBSCRIBED).length,
    bouncedCount: statuses.filter((s) => s === EmailRecipientStatus.BOUNCED).length,
    updatedAt: list.updatedAt.toISOString(),
  };
}

const listInclude = {
  members: { select: { recipient: { select: { status: true } } } },
} as const;

export async function listEmailLists(): Promise<ActionResult<{ lists: EmailListDto[] }>> {
  const gate = await requirePermission("sendgrid:view");
  if (!gate.ok) return fail(403, gate.error);

  const lists = await prisma.emailList.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    include: listInclude,
  });
  return { ok: true, lists: lists.map(toListDto) };
}

export async function createEmailList(input: {
  name: string;
  description?: string;
  doubleOptIn?: boolean;
}): Promise<ActionResult<{ list: EmailListDto }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  const name = input.name?.trim();
  if (!name) return fail(400, "List name is required.");

  const list = await prisma.emailList.create({
    data: {
      listId: await nextListId(),
      name,
      description: input.description?.trim() || null,
      doubleOptIn: Boolean(input.doubleOptIn),
      createdById: gate.profile.id,
    },
    include: listInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_CREATED",
    entityType: "EMAIL_LIST",
    entityId: list.id,
    newValues: { name: list.name },
  });

  return { ok: true, list: toListDto(list) };
}

export async function updateEmailList(
  id: string,
  input: { name?: string; description?: string | null; doubleOptIn?: boolean },
): Promise<ActionResult<{ list: EmailListDto }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  const existing = await prisma.emailList.findUnique({ where: { id } });
  if (!existing) return fail(404, "List not found.");
  if (existing.isSystem && input.name !== undefined && input.name.trim() !== existing.name) {
    return fail(400, "The All Contacts master list cannot be renamed.");
  }

  const list = await prisma.emailList.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.doubleOptIn !== undefined ? { doubleOptIn: input.doubleOptIn } : {}),
    },
    include: listInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_UPDATED",
    entityType: "EMAIL_LIST",
    entityId: id,
    oldValues: { name: existing.name, description: existing.description },
    newValues: { name: list.name, description: list.description },
  });

  return { ok: true, list: toListDto(list) };
}

export async function deleteEmailList(id: string): Promise<ActionResult<object>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  const existing = await prisma.emailList.findUnique({ where: { id } });
  if (!existing) return fail(404, "List not found.");
  if (existing.isSystem) return fail(400, "The All Contacts master list cannot be deleted.");

  const usedBySending = await prisma.emailCampaign.count({
    where: { listId: id, status: { in: [EmailCampaignStatus.SENDING, EmailCampaignStatus.SCHEDULED] } },
  });
  if (usedBySending > 0) {
    return fail(400, "This list is the audience of a scheduled or sending campaign. Cancel that campaign first.");
  }

  await prisma.emailList.delete({ where: { id } });
  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_DELETED",
    entityType: "EMAIL_LIST",
    entityId: id,
    oldValues: { name: existing.name },
  });

  return { ok: true };
}

// ── Members ──────────────────────────────────────────────────────────────────

function toRecipientDto(r: {
  id: string; email: string; firstName: string | null; lastName: string | null;
  phone: string | null; source: string | null; status: EmailRecipientStatus;
  createdAt: Date; updatedAt: Date;
}): EmailRecipientDto {
  return {
    id: r.id, email: r.email, firstName: r.firstName, lastName: r.lastName,
    phone: r.phone, source: r.source, status: r.status,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listMembers(
  listDbId: string,
  search?: string,
): Promise<ActionResult<{ members: EmailRecipientDto[]; listName: string }>> {
  const gate = await requirePermission("sendgrid:view");
  if (!gate.ok) return fail(403, gate.error);

  const list = await prisma.emailList.findUnique({ where: { id: listDbId }, select: { name: true } });
  if (!list) return fail(404, "List not found.");

  const q = search?.trim();
  const where: Prisma.EmailListMemberWhereInput = {
    listId: listDbId,
    ...(q
      ? {
          recipient: {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const members = await prisma.emailListMember.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { recipient: true },
  });

  return { ok: true, members: members.map((m) => toRecipientDto(m.recipient)), listName: list.name };
}

/**
 * Upserts one recipient by email and adds them to `listDbId` (and to the
 * system All Contacts list). Never resubscribes an UNSUBSCRIBED/BOUNCED
 * address — membership is added but global status is preserved.
 */
async function upsertRecipientAndMemberships(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  source: string;
  crmContactId?: string | null;
  listDbId: string;
  actorId: string;
  updateExisting: boolean;
}): Promise<{ recipientId: string; existed: boolean }> {
  const email = normalizeEmail(params.email);
  const existing = await prisma.emailRecipient.findUnique({ where: { email } });

  let recipientId: string;
  if (existing) {
    recipientId = existing.id;
    if (params.updateExisting) {
      await prisma.emailRecipient.update({
        where: { id: existing.id },
        data: {
          firstName: params.firstName ?? existing.firstName,
          lastName: params.lastName ?? existing.lastName,
          phone: params.phone ?? existing.phone,
          crmContactId: params.crmContactId ?? existing.crmContactId,
        },
      });
    }
  } else {
    const created = await prisma.emailRecipient.create({
      data: {
        email,
        firstName: params.firstName?.trim() || null,
        lastName: params.lastName?.trim() || null,
        phone: params.phone?.trim() || null,
        source: params.source,
        crmContactId: params.crmContactId ?? null,
      },
    });
    recipientId = created.id;
  }

  await prisma.emailListMember.createMany({
    data: [
      { listId: params.listDbId, recipientId, addedById: params.actorId },
      ...(params.listDbId === SYSTEM_LIST_ID
        ? []
        : [{ listId: SYSTEM_LIST_ID, recipientId, addedById: params.actorId }]),
    ],
    skipDuplicates: true,
  });

  return { recipientId, existed: Boolean(existing) };
}

export async function addMemberManually(
  listDbId: string,
  input: { email: string; firstName?: string; lastName?: string; phone?: string },
): Promise<ActionResult<{ member: EmailRecipientDto }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  const email = normalizeEmail(input.email ?? "");
  if (!EMAIL_RE.test(email)) return fail(400, "Enter a valid email address.");

  const list = await prisma.emailList.findUnique({ where: { id: listDbId }, select: { id: true } });
  if (!list) return fail(404, "List not found.");

  const { recipientId } = await upsertRecipientAndMemberships({
    email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    source: "manual",
    listDbId,
    actorId: gate.profile.id,
    updateExisting: true,
  });

  const recipient = await prisma.emailRecipient.findUniqueOrThrow({ where: { id: recipientId } });
  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_MEMBER_ADDED",
    entityType: "EMAIL_LIST",
    entityId: listDbId,
    newValues: { email },
  });

  return { ok: true, member: toRecipientDto(recipient) };
}

export async function addMembersFromCrmContacts(
  listDbId: string,
  contactIds: string[],
): Promise<ActionResult<{ added: number; skippedNoEmail: number }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  const list = await prisma.emailList.findUnique({ where: { id: listDbId }, select: { id: true } });
  if (!list) return fail(404, "List not found.");

  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds }, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  let added = 0;
  let skippedNoEmail = 0;
  for (const contact of contacts) {
    const email = contact.email ? normalizeEmail(contact.email) : "";
    if (!EMAIL_RE.test(email)) {
      skippedNoEmail += 1;
      continue;
    }
    await upsertRecipientAndMemberships({
      email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      source: "crm-contact",
      crmContactId: contact.id,
      listDbId,
      actorId: gate.profile.id,
      updateExisting: false,
    });
    added += 1;
  }

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_MEMBER_ADDED",
    entityType: "EMAIL_LIST",
    entityId: listDbId,
    newValues: { fromCrm: added, skippedNoEmail },
  });

  return { ok: true, added, skippedNoEmail };
}

export async function removeMember(
  listDbId: string,
  recipientId: string,
): Promise<ActionResult<object>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);

  await prisma.emailListMember.deleteMany({ where: { listId: listDbId, recipientId } });
  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_MEMBER_REMOVED",
    entityType: "EMAIL_LIST",
    entityId: listDbId,
    oldValues: { recipientId },
  });
  return { ok: true };
}

// ── Import / export ──────────────────────────────────────────────────────────

export type ImportRow = { email: string; firstName?: string; lastName?: string; phone?: string };

export type ImportPreview = {
  total: number;
  valid: number;
  newCount: number;
  duplicateCount: number;
  invalidCount: number;
  unsubscribedCount: number;
  invalidSamples: string[];
};

function classifyRows(rows: ImportRow[]): { valid: ImportRow[]; invalid: string[] } {
  const seen = new Set<string>();
  const valid: ImportRow[] = [];
  const invalid: string[] = [];
  for (const row of rows) {
    const email = normalizeEmail(row.email ?? "");
    if (!EMAIL_RE.test(email)) {
      invalid.push(row.email ?? "(empty)");
      continue;
    }
    if (seen.has(email)) continue; // in-file duplicate — keep first occurrence
    seen.add(email);
    valid.push({ ...row, email });
  }
  return { valid, invalid };
}

export async function previewImport(
  listDbId: string,
  rows: ImportRow[],
): Promise<ActionResult<{ preview: ImportPreview }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);
  if (!Array.isArray(rows) || rows.length === 0) return fail(400, "No rows to import.");
  if (rows.length > IMPORT_ROW_LIMIT) return fail(400, `Imports are limited to ${IMPORT_ROW_LIMIT} rows per file.`);

  const list = await prisma.emailList.findUnique({ where: { id: listDbId }, select: { id: true } });
  if (!list) return fail(404, "List not found.");

  const { valid, invalid } = classifyRows(rows);
  const existing = await prisma.emailRecipient.findMany({
    where: { email: { in: valid.map((r) => r.email) } },
    select: { email: true, status: true },
  });
  const existingByEmail = new Map(existing.map((r) => [r.email, r.status]));

  const duplicateCount = valid.filter((r) => existingByEmail.has(r.email)).length;
  const unsubscribedCount = valid.filter((r) => {
    const status = existingByEmail.get(r.email);
    return status === EmailRecipientStatus.UNSUBSCRIBED || status === EmailRecipientStatus.BOUNCED;
  }).length;

  return {
    ok: true,
    preview: {
      total: rows.length,
      valid: valid.length,
      newCount: valid.length - duplicateCount,
      duplicateCount,
      invalidCount: invalid.length,
      unsubscribedCount,
      invalidSamples: invalid.slice(0, 5),
    },
  };
}

export async function commitImport(
  listDbId: string,
  rows: ImportRow[],
  options: { duplicateMode: "update" | "skip"; skipUnsubscribed: boolean; method: "csv" | "paste" },
): Promise<ActionResult<{ imported: number; updated: number; skipped: number; invalid: number }>> {
  const gate = await requirePermission("sendgrid:manageLists");
  if (!gate.ok) return fail(403, gate.error);
  if (!Array.isArray(rows) || rows.length === 0) return fail(400, "No rows to import.");
  if (rows.length > IMPORT_ROW_LIMIT) return fail(400, `Imports are limited to ${IMPORT_ROW_LIMIT} rows per file.`);

  const list = await prisma.emailList.findUnique({ where: { id: listDbId }, select: { id: true, name: true } });
  if (!list) return fail(404, "List not found.");

  const { valid, invalid } = classifyRows(rows);
  const existing = await prisma.emailRecipient.findMany({
    where: { email: { in: valid.map((r) => r.email) } },
    select: { id: true, email: true, status: true },
  });
  const existingByEmail = new Map(existing.map((r) => [r.email, r]));
  const source = options.method === "csv" ? "csv-import" : "pasted";

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  // Create brand-new recipients in bulk…
  const newRows = valid.filter((r) => !existingByEmail.has(r.email));
  if (newRows.length > 0) {
    await prisma.emailRecipient.createMany({
      data: newRows.map((r) => ({
        email: r.email,
        firstName: r.firstName?.trim() || null,
        lastName: r.lastName?.trim() || null,
        phone: r.phone?.trim() || null,
        source,
      })),
      skipDuplicates: true,
    });
    imported = newRows.length;
  }

  // …then resolve every valid email to a recipient id for memberships.
  const allRecipients = await prisma.emailRecipient.findMany({
    where: { email: { in: valid.map((r) => r.email) } },
    select: { id: true, email: true, status: true },
  });
  const idByEmail = new Map(allRecipients.map((r) => [r.email, r]));

  const membershipData: { listId: string; recipientId: string; addedById: string }[] = [];
  for (const row of valid) {
    const recipient = idByEmail.get(row.email);
    if (!recipient) continue;
    const wasExisting = existingByEmail.has(row.email);
    const isOptedOut =
      recipient.status === EmailRecipientStatus.UNSUBSCRIBED ||
      recipient.status === EmailRecipientStatus.BOUNCED;

    if (wasExisting && isOptedOut && options.skipUnsubscribed) {
      skipped += 1;
      continue;
    }
    if (wasExisting) {
      if (options.duplicateMode === "update") {
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            ...(row.firstName?.trim() ? { firstName: row.firstName.trim() } : {}),
            ...(row.lastName?.trim() ? { lastName: row.lastName.trim() } : {}),
            ...(row.phone?.trim() ? { phone: row.phone.trim() } : {}),
          },
        });
        updated += 1;
      } else {
        skipped += 1;
        // "Skip duplicates" still leaves existing membership rows untouched —
        // but does not add the contact to the target list.
        continue;
      }
    }
    membershipData.push(
      { listId: listDbId, recipientId: recipient.id, addedById: gate.profile.id },
      ...(listDbId === SYSTEM_LIST_ID
        ? []
        : [{ listId: SYSTEM_LIST_ID, recipientId: recipient.id, addedById: gate.profile.id }]),
    );
  }

  if (membershipData.length > 0) {
    await prisma.emailListMember.createMany({ data: membershipData, skipDuplicates: true });
  }

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CONTACTS_IMPORTED",
    entityType: "EMAIL_LIST",
    entityId: listDbId,
    newValues: { list: list.name, imported, updated, skipped, invalid: invalid.length, method: options.method },
  });

  return { ok: true, imported, updated, skipped, invalid: invalid.length };
}

export async function exportListCsv(
  listDbId: string,
): Promise<ActionResult<{ csv: string; filename: string }>> {
  const gate = await requirePermission("sendgrid:export");
  if (!gate.ok) return fail(403, gate.error);

  const list = await prisma.emailList.findUnique({
    where: { id: listDbId },
    select: {
      name: true,
      members: {
        select: { recipient: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!list) return fail(404, "List not found.");

  // Exported fields only — never internal ids or unsubscribe tokens.
  const csv = toCsv(
    ["email", "first_name", "last_name", "phone", "status", "source", "created_at"],
    list.members.map(({ recipient: r }) => [
      r.email,
      r.firstName ?? "",
      r.lastName ?? "",
      r.phone ?? "",
      r.status,
      r.source ?? "",
      r.createdAt.toISOString().slice(0, 10),
    ]),
  );

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_LIST_EXPORTED",
    entityType: "EMAIL_LIST",
    entityId: listDbId,
    newValues: { list: list.name, rows: list.members.length },
  });

  const safeName = list.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return { ok: true, csv, filename: `${safeName}-recipients.csv` };
}

// ── Campaigns ────────────────────────────────────────────────────────────────

async function nextCampaignId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(campaign_id FROM 5) AS INTEGER)) AS max FROM email_campaigns
  `;
  return `CMP-${String((row?.max ?? 0) + 1).padStart(3, "0")}`;
}

type CampaignWithList = Prisma.EmailCampaignGetPayload<{ include: { list: { select: { name: true } } } }>;

function toCampaignDto(c: CampaignWithList, metrics: CampaignMetricsDto): EmailCampaignDto {
  return {
    id: c.id,
    campaignId: c.campaignId,
    name: c.name,
    subject: c.subject,
    previewText: c.previewText,
    fromName: c.fromName,
    fromEmail: c.fromEmail,
    htmlBody: c.htmlBody,
    templateKey: c.templateKey,
    status: c.status,
    listId: c.listId,
    listName: c.list?.name ?? null,
    scheduledAt: c.scheduledAt?.toISOString() ?? null,
    sentAt: c.sentAt?.toISOString() ?? null,
    sentById: c.sentById,
    failedReason: c.failedReason,
    totalRecipients: c.totalRecipients,
    metrics,
    lastEventAt: c.lastEventAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listCampaigns(): Promise<ActionResult<{ campaigns: EmailCampaignDto[] }>> {
  const gate = await requirePermission("sendgrid:view");
  if (!gate.ok) return fail(403, gate.error);

  const [campaigns, metricsMap] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { list: { select: { name: true } } },
    }),
    campaignMetricsByCampaign(),
  ]);

  return {
    ok: true,
    campaigns: campaigns.map((c) => toCampaignDto(c, metricsMap.get(c.id) ?? EMPTY_METRICS)),
  };
}

type CampaignInput = {
  name?: string;
  subject?: string;
  previewText?: string | null;
  fromName?: string;
  htmlBody?: string;
  templateKey?: string | null;
  listId?: string | null;
};

export async function createCampaign(input: CampaignInput): Promise<ActionResult<{ campaign: EmailCampaignDto }>> {
  const gate = await requirePermission("sendgrid:manageCampaigns");
  if (!gate.ok) return fail(403, gate.error);

  const name = input.name?.trim();
  if (!name) return fail(400, "Campaign name is required.");

  const template = input.templateKey ? getMarketingTemplate(input.templateKey) : undefined;
  const settings = await getOrCreateSettings();

  if (input.listId) {
    const list = await prisma.emailList.findUnique({ where: { id: input.listId }, select: { id: true } });
    if (!list) return fail(400, "Selected audience list no longer exists.");
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      campaignId: await nextCampaignId(),
      name,
      subject: input.subject?.trim() ?? template?.subject ?? "",
      previewText: input.previewText?.trim() || template?.previewText || null,
      fromName: input.fromName?.trim() || settings.defaultFromName,
      // Campaigns always send from the dedicated newsletter identity — never
      // from no-reply@ (auth/system mail only).
      fromEmail: NEWSLETTER_FROM_EMAIL,
      htmlBody: input.htmlBody ?? template?.html ?? "",
      templateKey: input.templateKey ?? null,
      listId: input.listId ?? null,
      createdById: gate.profile.id,
    },
    include: { list: { select: { name: true } } },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_CREATED",
    entityType: "EMAIL_CAMPAIGN",
    entityId: campaign.id,
    newValues: { name: campaign.name },
  });

  return { ok: true, campaign: toCampaignDto(campaign, EMPTY_METRICS) };
}

export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<ActionResult<{ campaign: EmailCampaignDto }>> {
  const gate = await requirePermission("sendgrid:manageCampaigns");
  if (!gate.ok) return fail(403, gate.error);

  const existing = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!existing) return fail(404, "Campaign not found.");
  if (existing.status !== EmailCampaignStatus.DRAFT && existing.status !== EmailCampaignStatus.SCHEDULED) {
    return fail(400, "Only draft or scheduled campaigns can be edited. Duplicate a sent campaign to reuse it.");
  }

  if (input.listId) {
    const list = await prisma.emailList.findUnique({ where: { id: input.listId }, select: { id: true } });
    if (!list) return fail(400, "Selected audience list no longer exists.");
  }

  const campaign = await prisma.emailCampaign.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.subject !== undefined ? { subject: input.subject.trim() } : {}),
      ...(input.previewText !== undefined ? { previewText: input.previewText?.trim() || null } : {}),
      ...(input.fromName !== undefined ? { fromName: input.fromName.trim() } : {}),
      ...(input.htmlBody !== undefined ? { htmlBody: input.htmlBody } : {}),
      ...(input.templateKey !== undefined ? { templateKey: input.templateKey } : {}),
      ...(input.listId !== undefined ? { listId: input.listId } : {}),
    },
    include: { list: { select: { name: true } } },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_UPDATED",
    entityType: "EMAIL_CAMPAIGN",
    entityId: id,
    newValues: { name: campaign.name },
  });

  return { ok: true, campaign: toCampaignDto(campaign, EMPTY_METRICS) };
}

export async function duplicateCampaign(id: string): Promise<ActionResult<{ campaign: EmailCampaignDto }>> {
  const gate = await requirePermission("sendgrid:manageCampaigns");
  if (!gate.ok) return fail(403, gate.error);

  const existing = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!existing) return fail(404, "Campaign not found.");

  const campaign = await prisma.emailCampaign.create({
    data: {
      campaignId: await nextCampaignId(),
      name: `Copy of ${existing.name}`,
      subject: existing.subject,
      previewText: existing.previewText,
      fromName: existing.fromName,
      fromEmail: NEWSLETTER_FROM_EMAIL,
      htmlBody: existing.htmlBody,
      templateKey: existing.templateKey,
      listId: existing.listId,
      createdById: gate.profile.id,
    },
    include: { list: { select: { name: true } } },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_DUPLICATED",
    entityType: "EMAIL_CAMPAIGN",
    entityId: campaign.id,
    newValues: { from: existing.campaignId, name: campaign.name },
  });

  return { ok: true, campaign: toCampaignDto(campaign, EMPTY_METRICS) };
}

export async function deleteCampaign(id: string): Promise<ActionResult<object>> {
  const gate = await requirePermission("sendgrid:manageCampaigns");
  if (!gate.ok) return fail(403, gate.error);

  const existing = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!existing) return fail(404, "Campaign not found.");
  if (existing.status === EmailCampaignStatus.SENDING) {
    return fail(400, "A campaign that is currently sending cannot be deleted.");
  }

  await prisma.emailCampaign.delete({ where: { id } });
  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_DELETED",
    entityType: "EMAIL_CAMPAIGN",
    entityId: id,
    oldValues: { name: existing.name, status: existing.status },
  });

  return { ok: true };
}

export async function cancelScheduledCampaign(id: string): Promise<ActionResult<object>> {
  const gate = await requirePermission("sendgrid:send");
  if (!gate.ok) return fail(403, gate.error);

  const claimed = await prisma.emailCampaign.updateMany({
    where: { id, status: EmailCampaignStatus.SCHEDULED },
    data: { status: EmailCampaignStatus.DRAFT, scheduledAt: null },
  });
  if (claimed.count === 0) return fail(400, "Campaign is not scheduled.");

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_CANCELLED",
    entityType: "EMAIL_CAMPAIGN",
    entityId: id,
  });

  return { ok: true };
}

// ── Send validation ──────────────────────────────────────────────────────────

type SendReadiness =
  | { ok: true; targets: { email: string; firstName: string | null; unsubscribeToken: string; recipientId: string }[] }
  | { ok: false; error: string };

async function checkSendReadiness(campaign: {
  subject: string;
  htmlBody: string;
  fromEmail: string;
  listId: string | null;
}): Promise<SendReadiness> {
  if (!isSendgridConfigured()) return { ok: false, error: "SendGrid API key is not configured." };
  if (!campaign.subject.trim()) return { ok: false, error: "Subject line is empty." };
  if (!campaign.htmlBody.trim()) return { ok: false, error: "Email body is empty." };
  if (campaign.fromEmail !== NEWSLETTER_FROM_EMAIL) {
    return { ok: false, error: `Campaigns must send from ${NEWSLETTER_FROM_EMAIL}.` };
  }
  if (!campaign.listId) return { ok: false, error: "No audience list is selected." };

  // Only SUBSCRIBED recipients with a syntactically valid address are
  // eligible — unsubscribed, bounced and removed contacts are excluded here,
  // at the last moment before every send.
  const members = await prisma.emailListMember.findMany({
    where: { listId: campaign.listId, recipient: { status: EmailRecipientStatus.SUBSCRIBED } },
    select: { recipient: { select: { id: true, email: true, firstName: true, unsubscribeToken: true } } },
  });
  const targets = members
    .map((m) => m.recipient)
    .filter((r) => EMAIL_RE.test(r.email))
    .map((r) => ({ email: r.email, firstName: r.firstName, unsubscribeToken: r.unsubscribeToken, recipientId: r.id }));

  if (targets.length === 0) {
    return { ok: false, error: "The selected audience has no subscribed recipients." };
  }
  return { ok: true, targets };
}

export async function getSendPrecheck(id: string): Promise<
  ActionResult<{ ready: boolean; reason: string | null; recipientCount: number; listName: string | null }>
> {
  const gate = await requirePermission("sendgrid:send");
  if (!gate.ok) return fail(403, gate.error);

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { list: { select: { name: true } } },
  });
  if (!campaign) return fail(404, "Campaign not found.");
  if (campaign.status !== EmailCampaignStatus.DRAFT && campaign.status !== EmailCampaignStatus.SCHEDULED) {
    return {
      ok: true,
      ready: false,
      reason: "This campaign has already been sent. Duplicate it to send again.",
      recipientCount: 0,
      listName: campaign.list?.name ?? null,
    };
  }

  const readiness = await checkSendReadiness(campaign);
  return {
    ok: true,
    ready: readiness.ok,
    reason: readiness.ok ? null : readiness.error,
    recipientCount: readiness.ok ? readiness.targets.length : 0,
    listName: campaign.list?.name ?? null,
  };
}

// ── Test send ────────────────────────────────────────────────────────────────

export async function sendCampaignTestEmail(
  id: string,
  emails: string[],
): Promise<ActionResult<{ sentTo: string[] }>> {
  const gate = await requirePermission("sendgrid:send");
  if (!gate.ok) return fail(403, gate.error);

  const recipients = [...new Set(emails.map(normalizeEmail).filter((e) => EMAIL_RE.test(e)))];
  if (recipients.length === 0) return fail(400, "Enter at least one valid test email address.");
  if (recipients.length > 5) return fail(400, "Test sends are limited to 5 addresses.");

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return fail(404, "Campaign not found.");
  if (!isSendgridConfigured()) return fail(400, "SendGrid API key is not configured.");
  if (!campaign.subject.trim()) return fail(400, "Add a subject line before sending a test.");
  if (!campaign.htmlBody.trim()) return fail(400, "Add email content before sending a test.");

  const settings = await getOrCreateSettings();
  const result = await sendCampaignTest(
    {
      subject: campaign.subject,
      previewText: campaign.previewText,
      htmlBody: campaign.htmlBody,
      fromName: campaign.fromName,
      fromEmail: NEWSLETTER_FROM_EMAIL,
      clickTracking: false,
      openTracking: false,
      sandboxMode: settings.sandboxMode,
    },
    recipients,
  );
  if (!result.sent) return fail(502, result.error ?? "SendGrid rejected the test send.");

  await logActivity({
    actorId: gate.profile.id,
    action: "EMAIL_CAMPAIGN_TEST_SENT",
    entityType: "EMAIL_CAMPAIGN",
    entityId: id,
    newValues: { to: recipients },
  });

  return { ok: true, sentTo: recipients };
}

// ── Real send ────────────────────────────────────────────────────────────────

export async function sendCampaign(
  id: string,
  options?: { scheduleAt?: string },
): Promise<ActionResult<{ status: EmailCampaignStatus; totalRecipients: number }>> {
  const gate = await requirePermission("sendgrid:send");
  if (!gate.ok) return fail(403, gate.error);

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { list: { select: { name: true } } },
  });
  if (!campaign) return fail(404, "Campaign not found.");

  const readiness = await checkSendReadiness(campaign);
  if (!readiness.ok) return fail(400, readiness.error);

  // Schedule-for-later path: DRAFT → SCHEDULED, the cron route sends it.
  if (options?.scheduleAt) {
    const scheduledAt = new Date(options.scheduleAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60_000) {
      return fail(400, "Schedule time must be at least a minute in the future.");
    }
    const claimed = await prisma.emailCampaign.updateMany({
      where: { id, status: EmailCampaignStatus.DRAFT },
      data: {
        status: EmailCampaignStatus.SCHEDULED,
        scheduledAt,
        totalRecipients: readiness.targets.length,
        sentById: gate.profile.id,
      },
    });
    if (claimed.count === 0) return fail(409, "This campaign was already sent or scheduled.");

    await logActivity({
      actorId: gate.profile.id,
      action: "EMAIL_CAMPAIGN_SCHEDULED",
      entityType: "EMAIL_CAMPAIGN",
      entityId: id,
      newValues: { scheduledAt: scheduledAt.toISOString(), recipients: readiness.targets.length },
    });
    return { ok: true, status: EmailCampaignStatus.SCHEDULED, totalRecipients: readiness.targets.length };
  }

  // Immediate send: atomically claim DRAFT/SCHEDULED → SENDING. A concurrent
  // second click (or second admin) loses the claim and gets a 409 — this is
  // the duplicate-send guard.
  const claimed = await prisma.emailCampaign.updateMany({
    where: { id, status: { in: [EmailCampaignStatus.DRAFT, EmailCampaignStatus.SCHEDULED] } },
    data: { status: EmailCampaignStatus.SENDING, sendStartedAt: new Date(), sentById: gate.profile.id },
  });
  if (claimed.count === 0) return fail(409, "This campaign was already sent or is currently sending.");

  return executeCampaignSend(id, gate.profile.id);
}

/**
 * Runs the actual send for a campaign already claimed as SENDING. Shared by
 * the dashboard send action and the scheduled-campaign cron.
 */
export async function executeCampaignSend(
  id: string,
  actorId: string | null,
): Promise<ActionResult<{ status: EmailCampaignStatus; totalRecipients: number }>> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { list: { select: { name: true } } },
  });
  if (!campaign || campaign.status !== EmailCampaignStatus.SENDING) {
    return fail(409, "Campaign is not in a sending state.");
  }

  const readiness = await checkSendReadiness(campaign);
  if (!readiness.ok) {
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: EmailCampaignStatus.FAILED, failedReason: readiness.error },
    });
    return fail(400, readiness.error);
  }

  const settings = await getOrCreateSettings();
  const batchId = randomUUID();

  // Persist the exact recipient set before calling SendGrid, so a crash
  // mid-send leaves an auditable record of who was targeted.
  await prisma.emailCampaign.update({
    where: { id },
    data: { totalRecipients: readiness.targets.length, sgBatchId: batchId },
  });
  await prisma.emailCampaignRecipient.createMany({
    data: readiness.targets.map((t) => ({
      campaignId: id,
      recipientId: t.recipientId,
      email: t.email,
    })),
    skipDuplicates: true,
  });

  const outcome = await sendCampaignBatches(
    {
      campaignDbId: id,
      subject: campaign.subject,
      previewText: campaign.previewText,
      htmlBody: campaign.htmlBody,
      fromName: campaign.fromName,
      fromEmail: NEWSLETTER_FROM_EMAIL,
      clickTracking: settings.clickTracking,
      openTracking: settings.openTracking,
      sandboxMode: settings.sandboxMode,
    },
    readiness.targets.map((t) => {
      // campaignRecipientId is resolved by email on webhook events instead of
      // pre-reading row ids — keeps the send path to two bulk queries.
      return { email: t.email, firstName: t.firstName, unsubscribeToken: t.unsubscribeToken, campaignRecipientId: t.recipientId };
    }),
    batchId,
  );

  const now = new Date();
  if (outcome.sentEmails.length > 0) {
    await prisma.emailCampaignRecipient.updateMany({
      where: { campaignId: id, email: { in: outcome.sentEmails } },
      data: { status: EmailSendStatus.SENT },
    });
  }
  if (outcome.failedEmails.length > 0) {
    await prisma.emailCampaignRecipient.updateMany({
      where: { campaignId: id, email: { in: outcome.failedEmails } },
      data: { status: EmailSendStatus.FAILED },
    });
  }

  const allFailed = outcome.sentEmails.length === 0;
  await prisma.emailCampaign.update({
    where: { id },
    data: allFailed
      ? { status: EmailCampaignStatus.FAILED, failedReason: outcome.error ?? "SendGrid rejected the send." }
      : { status: EmailCampaignStatus.SENT, sentAt: now, scheduledAt: null, failedReason: outcome.error ?? null },
  });

  await logActivity({
    actorId,
    action: allFailed ? "EMAIL_CAMPAIGN_SEND_FAILED" : "EMAIL_CAMPAIGN_SENT",
    entityType: "EMAIL_CAMPAIGN",
    entityId: id,
    newValues: {
      name: campaign.name,
      list: campaign.list?.name,
      sent: outcome.sentEmails.length,
      failed: outcome.failedEmails.length,
      error: outcome.error,
    },
  });

  if (!allFailed) {
    await dispatchNotification({
      type: "EMAIL_CAMPAIGN_SENT",
      actorId,
      entityType: "EMAIL_CAMPAIGN",
      entityId: id,
      actionUrl: "/dashboard/sendgrid",
      content: {
        title: "Campaign sent",
        body: `"${campaign.name}" was sent to ${outcome.sentEmails.length} recipient${outcome.sentEmails.length === 1 ? "" : "s"}.`,
      },
    });
    return { ok: true, status: EmailCampaignStatus.SENT, totalRecipients: outcome.sentEmails.length };
  }

  return fail(502, outcome.error ?? "SendGrid rejected the send.");
}

/** Cron entry point: claims and sends every due SCHEDULED campaign. */
export async function sendDueScheduledCampaigns(): Promise<{ processed: number; failed: number }> {
  const due = await prisma.emailCampaign.findMany({
    where: { status: EmailCampaignStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
    select: { id: true, sentById: true },
  });

  let processed = 0;
  let failed = 0;
  for (const campaign of due) {
    const claimed = await prisma.emailCampaign.updateMany({
      where: { id: campaign.id, status: EmailCampaignStatus.SCHEDULED },
      data: { status: EmailCampaignStatus.SENDING, sendStartedAt: new Date() },
    });
    if (claimed.count === 0) continue;
    const result = await executeCampaignSend(campaign.id, campaign.sentById);
    if (result.ok) processed += 1;
    else failed += 1;
  }
  return { processed, failed };
}

// ── Settings ─────────────────────────────────────────────────────────────────

async function getOrCreateSettings() {
  return prisma.sendgridSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", defaultFromName: NEWSLETTER_FROM_NAME, defaultFromEmail: NEWSLETTER_FROM_EMAIL },
  });
}

function toSettingsDto(s: Awaited<ReturnType<typeof getOrCreateSettings>>): SendgridSettingsDto {
  return {
    defaultFromName: s.defaultFromName,
    defaultFromEmail: s.defaultFromEmail,
    clickTracking: s.clickTracking,
    openTracking: s.openTracking,
    sandboxMode: s.sandboxMode,
    lastConnectionTestAt: s.lastConnectionTestAt?.toISOString() ?? null,
  };
}

export async function getSendgridSettings(): Promise<ActionResult<{ settings: SendgridSettingsDto }>> {
  const gate = await requirePermission("sendgrid:manageSettings");
  if (!gate.ok) return fail(403, gate.error);
  return { ok: true, settings: toSettingsDto(await getOrCreateSettings()) };
}

export async function updateSendgridSettings(input: {
  defaultFromName?: string;
  clickTracking?: boolean;
  openTracking?: boolean;
  sandboxMode?: boolean;
}): Promise<ActionResult<{ settings: SendgridSettingsDto }>> {
  const gate = await requirePermission("sendgrid:manageSettings");
  if (!gate.ok) return fail(403, gate.error);

  await getOrCreateSettings();
  const settings = await prisma.sendgridSettings.update({
    where: { id: "default" },
    data: {
      ...(input.defaultFromName !== undefined ? { defaultFromName: input.defaultFromName.trim() || NEWSLETTER_FROM_NAME } : {}),
      ...(input.clickTracking !== undefined ? { clickTracking: input.clickTracking } : {}),
      ...(input.openTracking !== undefined ? { openTracking: input.openTracking } : {}),
      ...(input.sandboxMode !== undefined ? { sandboxMode: input.sandboxMode } : {}),
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "SENDGRID_SETTINGS_UPDATED",
    entityType: "SENDGRID_SETTINGS",
    entityId: "default",
    newValues: input,
  });

  return { ok: true, settings: toSettingsDto(settings) };
}

export async function runConnectionTest(): Promise<ActionResult<{ connection: SendgridConnectionInfo }>> {
  const gate = await requirePermission("sendgrid:manageSettings");
  if (!gate.ok) return fail(403, gate.error);

  const connection = await testSendgridConnection();
  if (connection.ok) {
    await getOrCreateSettings();
    await prisma.sendgridSettings.update({
      where: { id: "default" },
      data: { lastConnectionTestAt: new Date() },
    });
  }
  return { ok: true, connection };
}
