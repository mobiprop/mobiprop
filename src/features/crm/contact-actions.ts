import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { ContactType } from "@/generated/prisma/enums";
import { createContactSchema, updateContactSchema } from "@/schemas/contact.schema";
import type { CreateContactInput, UpdateContactInput } from "@/schemas/contact.schema";
import type { ContactDto, ContactMetrics } from "./types/crm-dto";

export type CrmActionError = {
  ok: false;
  error: string;
  status: number;
  // Present when create was rejected for matching an existing contact's email/phone.
  existingContact?: { id: string; contactId: string; fullName: string };
};
export type CrmActionResult<T> = ({ ok: true } & T) | CrmActionError;

// ── Record-level access (mirrors lead-actions.ts / listing-actions.ts) ────────

/**
 * ADMIN/MANAGER (contacts:view_all) see every contact. AGENT holders only see
 * contacts they created, are directly assigned to, or that are linked to a
 * lead/opportunity/tour/listing assigned to them.
 */
function contactRecordScope(profile: Profile): Prisma.ContactWhereInput {
  if (hasPermission(profile.role, "contacts:view_all")) return {};
  return {
    OR: [
      { createdById: profile.id },
      { assignedAgentId: profile.id },
      { leads: { some: { assignedAgentId: profile.id } } },
      { opportunities: { some: { assignedAgentId: profile.id } } },
      { tours: { some: { assignedAgentId: profile.id } } },
      { properties: { some: { property: { assignedAgentId: profile.id } } } },
    ],
  };
}

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
  _count: { select: { opportunities: { where: { isDeleted: false } } } },
} satisfies Prisma.ContactInclude;

// ── List ──────────────────────────────────────────────────────────────────────

export async function listContacts(search?: string, limit?: number): Promise<
  CrmActionResult<{ contacts: ContactDto[]; metrics: ContactMetrics }>
> {
  const gate = await requirePermission("contacts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const where: Prisma.ContactWhereInput = {
    isDeleted: false,
    AND: [
      contactRecordScope(gate.profile),
      ...(search
        ? [
            {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
                { contactId: { contains: search, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const contacts = await prisma.contact.findMany({
    where,
    include: contactInclude,
    orderBy: { createdAt: "desc" },
    ...((limit ?? (search ? 10 : undefined)) !== undefined && { take: limit ?? 10 }),
  });

  const dtos = contacts.map(toContactDto);

  return {
    ok: true,
    contacts: dtos,
    metrics: {
      total: dtos.length,
      buyers: dtos.filter((c) => c.type === ContactType.BUYER).length,
      sellers: dtos.filter((c) => c.type === ContactType.SELLER).length,
      both: dtos.filter((c) => c.type === ContactType.BOTH).length,
      withListings: dtos.filter((c) => c.properties.length > 0).length,
      withOpportunities: contacts.filter((c) => c._count.opportunities > 0).length,
    },
  };
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getContact(
  id: string,
): Promise<CrmActionResult<{ contact: ContactDto }>> {
  const gate = await requirePermission("contacts:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const contact = await prisma.contact.findFirst({
    where: { id, ...contactRecordScope(gate.profile) },
    include: contactInclude,
  });

  if (!contact) return { ok: false, error: "Contact not found", status: 404 };
  if (contact.isDeleted) return { ok: false, error: "Contact not found", status: 404 };

  return { ok: true, contact: toContactDto(contact) };
}

// ── Duplicate lookup (manual create only — automatic find-or-create for
// public-facing flows lives in tour-actions.ts::findOrCreateContact) ──────────

type ExistingContactMatch = { id: string; contactId: string; firstName: string; lastName: string };

async function findDuplicateContact(
  email: string | null,
  phone: string | null,
): Promise<{ matchedOn: "email address" | "phone number"; existing: ExistingContactMatch } | null> {
  if (email) {
    const existing = await prisma.contact.findFirst({
      where: { isDeleted: false, email: { equals: email, mode: "insensitive" } },
      select: { id: true, contactId: true, firstName: true, lastName: true },
    });
    if (existing) return { matchedOn: "email address", existing };
  }

  const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";
  if (normalizedPhone) {
    const rows = await prisma.$queryRaw<ExistingContactMatch[]>`
      SELECT id, contact_id AS "contactId", first_name AS "firstName", last_name AS "lastName"
      FROM contacts
      WHERE is_deleted = false AND phone IS NOT NULL
        AND regexp_replace(phone, '\D', '', 'g') = ${normalizedPhone}
      LIMIT 1
    `;
    if (rows[0]) return { matchedOn: "phone number", existing: rows[0] };
  }

  return null;
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
  const email = fields.email || null;
  const phone = fields.phone || null;

  const duplicate = await findDuplicateContact(email, phone);
  if (duplicate) {
    const { existing, matchedOn } = duplicate;
    return {
      ok: false,
      status: 409,
      error: `A contact with this ${matchedOn} already exists: ${existing.firstName} ${existing.lastName} (${existing.contactId}).`,
      existingContact: {
        id: existing.id,
        contactId: existing.contactId,
        fullName: `${existing.firstName} ${existing.lastName}`.trim(),
      },
    };
  }

  const contactId = await nextContactId();

  const contact = await prisma.contact.create({
    data: {
      ...fields,
      email,
      contactId,
      createdById: gate.profile.id,
      // Property links from this form represent ownership (the section only
      // renders for Seller/Both contacts) — see decision 5.C in the CRM plan.
      properties: propertyIds?.length
        ? { create: propertyIds.map((propertyId) => ({ propertyId, role: "OWNER" })) }
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
  if (propertyIds?.length) {
    await logActivity({
      actorId: gate.profile.id,
      action: "CONTACT_PROPERTY_LINKED",
      entityType: "CONTACT",
      entityId: contact.id,
      newValues: { propertyIds, role: "OWNER" },
    });
  }

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

  if (propertyIds !== undefined) {
    const desired = new Set(propertyIds);
    const currentLinks = await prisma.contactProperty.findMany({
      where: { contactId: id, role: "OWNER" },
      select: { propertyId: true },
    });
    const current = new Set(currentLinks.map((l) => l.propertyId));
    const toRemove = [...current].filter((propertyId) => !desired.has(propertyId));
    const toAdd = [...desired].filter((propertyId) => !current.has(propertyId));

    if (toRemove.length || toAdd.length) {
      await prisma.$transaction([
        ...(toRemove.length
          ? [prisma.contactProperty.deleteMany({ where: { contactId: id, propertyId: { in: toRemove }, role: "OWNER" } })]
          : []),
        ...toAdd.map((propertyId) =>
          prisma.contactProperty.upsert({
            where: { contactId_propertyId: { contactId: id, propertyId } },
            create: { contactId: id, propertyId, role: "OWNER" },
            update: { role: "OWNER" },
          }),
        ),
      ]);

      await logActivity({
        actorId: gate.profile.id,
        action: toAdd.length ? "CONTACT_PROPERTY_LINKED" : "CONTACT_PROPERTY_UNLINKED",
        entityType: "CONTACT",
        entityId: id,
        oldValues: { propertyIds: [...current] },
        newValues: { propertyIds: [...desired] },
      });
    }
  }

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

// ── Soft delete (archive) ──────────────────────────────────────────────────────

export async function deleteContact(
  id: string,
): Promise<CrmActionResult<{ id: string }>> {
  // This is a soft delete (archive) — Admin AND Manager may perform it per the
  // CRM plan ("Create/edit/archive: Admin, Manager"). Permanent/hard delete
  // does not exist yet; reserve contacts:delete (Admin-only) for that later.
  const gate = await requirePermission("contacts:archive");
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
