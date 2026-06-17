import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { ContactType } from "@/generated/prisma/enums";
import { createContactSchema, updateContactSchema } from "@/schemas/contact.schema";
import type { CreateContactInput, UpdateContactInput } from "@/schemas/contact.schema";
import type { ContactDto, ContactMetrics } from "./types/crm-dto";

export type CrmActionError = { ok: false; error: string; status: number };
export type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextContactId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(contact_id FROM 5) AS INTEGER)) AS max FROM contacts
  `;
  return `CNT-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── DTO mapping ───────────────────────────────────────────────────────────────

function toContactDto(c: {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  address: string | null;
  type: ContactType;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  properties: Array<{ role: string; property: { id: string; listingId: string; title: string; location: string; slug: string } }>;
}): ContactDto {
  return {
    id: c.id,
    contactId: c.contactId,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    phone: c.phone,
    location: c.location,
    address: c.address,
    type: c.type,
    notes: c.notes,
    isDeleted: c.isDeleted,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    assignedAgentId: c.assignedAgentId,
    properties: c.properties.map((cp) => ({
      id: cp.property.id,
      listingId: cp.property.listingId,
      title: cp.property.title,
      location: cp.property.location,
      slug: cp.property.slug,
      role: cp.role,
    })),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

const contactInclude = {
  properties: {
    include: {
      property: { select: { id: true, listingId: true, title: true, location: true, slug: true } },
    },
  },
} as const;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listContacts(): Promise<
  CrmActionResult<{ contacts: ContactDto[]; metrics: ContactMetrics }>
> {
  const gate = await requirePermission("contacts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const contacts = await prisma.contact.findMany({
    where: { isDeleted: false },
    include: contactInclude,
    orderBy: { createdAt: "desc" },
  });

  const dtos = contacts.map(toContactDto);

  return {
    ok: true,
    contacts: dtos,
    metrics: {
      total: dtos.length,
      buyers: dtos.filter((c) => c.type === ContactType.BUYER || c.type === ContactType.BOTH).length,
      sellers: dtos.filter((c) => c.type === ContactType.SELLER || c.type === ContactType.BOTH).length,
      withListings: dtos.filter((c) => c.properties.length > 0).length,
    },
  };
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getContact(
  id: string,
): Promise<CrmActionResult<{ contact: ContactDto }>> {
  const gate = await requirePermission("contacts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: contactInclude,
  });

  if (!contact) return { ok: false, error: "Contact not found", status: 404 };
  if (contact.isDeleted) return { ok: false, error: "Contact not found", status: 404 };

  return { ok: true, contact: toContactDto(contact) };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createContact(
  input: CreateContactInput,
): Promise<CrmActionResult<{ contact: ContactDto }>> {
  const gate = await requirePermission("contacts:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const { propertyIds, ...fields } = parsed.data;
  const contactId = await nextContactId();

  const contact = await prisma.contact.create({
    data: {
      ...fields,
      email: fields.email || null,
      contactId,
      createdById: gate.profile.id,
      properties: propertyIds?.length
        ? {
            create: propertyIds.map((propertyId) => ({
              propertyId,
              role: fields.type === ContactType.SELLER ? "SELLER" : "BUYER",
            })),
          }
        : undefined,
    },
    include: contactInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTACT_CREATED",
    entityType: "CONTACT",
    entityId: contact.id,
    newValues: { contactId: contact.contactId, firstName: contact.firstName, lastName: contact.lastName, type: contact.type },
  });

  return { ok: true, contact: toContactDto(contact) };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<CrmActionResult<{ contact: ContactDto }>> {
  const gate = await requirePermission("contacts:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateContactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    return { ok: false, error: "Contact not found", status: 404 };
  }

  const { propertyIds, ...fields } = parsed.data;

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...fields,
      email: fields.email !== undefined ? (fields.email || null) : undefined,
    },
    include: contactInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTACT_UPDATED",
    entityType: "CONTACT",
    entityId: id,
    oldValues: { firstName: existing.firstName, lastName: existing.lastName, type: existing.type, email: existing.email, phone: existing.phone },
    newValues: { firstName: contact.firstName, lastName: contact.lastName, type: contact.type, email: contact.email, phone: contact.phone },
  });

  return { ok: true, contact: toContactDto(contact) };
}

// ── Soft delete ───────────────────────────────────────────────────────────────

export async function deleteContact(
  id: string,
): Promise<CrmActionResult<{ id: string }>> {
  const gate = await requirePermission("contacts:delete");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Contact not found", status: 404 };
  if (existing.isDeleted) return { ok: false, error: "Contact is already deleted", status: 409 };

  await prisma.contact.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "CONTACT_DELETED",
    entityType: "CONTACT",
    entityId: id,
    oldValues: { firstName: existing.firstName, lastName: existing.lastName, isDeleted: false },
    newValues: { isDeleted: true, deletedAt: new Date().toISOString() },
  });

  return { ok: true, id };
}
