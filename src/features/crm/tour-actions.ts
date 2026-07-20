import "server-only";

import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { logActivity } from "@/lib/activity-log";
import { sendTourCancelledEmail, sendTourConfirmedEmail, sendTourRescheduledEmail } from "@/lib/email";
import {
  notifyTourRequested,
  notifyTourAssigned,
  notifyTourStatusChanged,
} from "@/features/notifications/server/notify-events";
import { TourStatus, UserStatus } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/permissions";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import { getValidAccessToken, createEvent, patchEventTime, deleteEvent } from "@/lib/google-calendar";
import { isSlotAvailable, findAvailableSlots } from "./tour-availability";
import {
  requestTourSchema,
  createTourSchema,
  updateTourSchema,
  updateTourStatusSchema,
  assignTourSchema,
  tourListFiltersSchema,
} from "@/schemas/tour.schema";
import type { TourDto, MyTourDto } from "./types/crm-dto";

export type TourActionError = { ok: false; error: string; status: number; suggestedSlots?: string[] };
export type TourActionResult<T> = ({ ok: true } & T) | TourActionError;

// ── Availability + Google Calendar sync (best-effort; never blocks a tour
// mutation if the calendar API has a hiccup — only the availability *check*
// itself is allowed to stop a create/reschedule from going through) ──────────

/** `force` (staff only) skips the check entirely; the public flow never sets it. */
async function checkAvailability(
  agentId: string | null | undefined,
  start: Date,
  durationMinutes: number,
  force?: boolean,
): Promise<{ ok: true } | { ok: false; suggestedSlots: string[] }> {
  if (!agentId || force) return { ok: true };

  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const available = await isSlotAvailable(agentId, start, end);
  if (available) return { ok: true };

  const suggestedSlots = await findAvailableSlots(agentId, start, durationMinutes);
  return { ok: false, suggestedSlots };
}

/** Creates the Google Calendar event for a brand-new tour. No-op if the agent hasn't connected a calendar. */
async function createTourCalendarEvent(opts: {
  tourId: string;
  agentId: string | null | undefined;
  summary: string;
  description: string;
  location: string | null;
  start: Date;
  durationMinutes: number;
}): Promise<void> {
  if (!opts.agentId) return;
  try {
    const agent = await prisma.profile.findUnique({ where: { id: opts.agentId } });
    if (!agent) return;
    const accessToken = await getValidAccessToken(agent);
    if (!accessToken) return;

    const end = new Date(opts.start.getTime() + opts.durationMinutes * 60_000);
    const eventId = await createEvent(accessToken, {
      summary: opts.summary,
      description: opts.description,
      location: opts.location ?? undefined,
      start: opts.start,
      end,
    });
    await prisma.tour.update({ where: { id: opts.tourId }, data: { googleCalendarEventId: eventId } });
  } catch (error) {
    console.error("[google-calendar] failed to create event for tour", opts.tourId, error);
  }
}

/** Moves an existing event to a new time, or creates one if the agent connected their calendar after the tour was made. */
async function syncTourCalendarTime(opts: {
  tourId: string;
  agentId: string | null | undefined;
  existingEventId: string | null | undefined;
  summary: string;
  description: string;
  location: string | null;
  start: Date;
  durationMinutes: number;
}): Promise<void> {
  if (!opts.agentId) return;
  try {
    const agent = await prisma.profile.findUnique({ where: { id: opts.agentId } });
    if (!agent) return;
    const accessToken = await getValidAccessToken(agent);
    if (!accessToken) return;

    const end = new Date(opts.start.getTime() + opts.durationMinutes * 60_000);
    if (opts.existingEventId) {
      await patchEventTime(accessToken, opts.existingEventId, opts.start, end);
    } else {
      const eventId = await createEvent(accessToken, {
        summary: opts.summary,
        description: opts.description,
        location: opts.location ?? undefined,
        start: opts.start,
        end,
      });
      await prisma.tour.update({ where: { id: opts.tourId }, data: { googleCalendarEventId: eventId } });
    }
  } catch (error) {
    console.error("[google-calendar] failed to sync event time for tour", opts.tourId, error);
  }
}

/** Best-effort delete on cancel. No-op if there was never a synced event. */
async function deleteTourCalendarEvent(
  agentId: string | null | undefined,
  eventId: string | null | undefined,
): Promise<void> {
  if (!agentId || !eventId) return;
  try {
    const agent = await prisma.profile.findUnique({ where: { id: agentId } });
    if (!agent) return;
    const accessToken = await getValidAccessToken(agent);
    if (!accessToken) return;
    await deleteEvent(accessToken, eventId);
  } catch (error) {
    console.error("[google-calendar] failed to delete event", eventId, error);
  }
}

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextTourNumber(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(tour_number FROM 5) AS INTEGER)) AS max FROM tours
  `;
  return `TUR-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

function formatTourDuration(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (minutes < 60) return `${minutes} minutes`;
  return `${(minutes / 60).toFixed(1)} hours`;
}

// ── Include / DTO helpers ─────────────────────────────────────────────────────

const tourInclude = {
  contact: {
    select: { id: true, contactId: true, firstName: true, lastName: true, email: true, phone: true },
  },
  property: {
    select: {
      id: true,
      listingId: true,
      title: true,
      location: true,
      slug: true,
      images: { select: { url: true, isCover: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
    },
  },
} as const;

type TourRow = Prisma.TourGetPayload<{ include: typeof tourInclude }>;

async function toTourDto(
  t: TourRow,
  agentMap?: Map<string, { id: string; fullName: string | null; email: string; avatarUrl: string | null }>,
): Promise<TourDto> {
  const coverImage = t.property?.images[0] ?? null;
  const agent = t.assignedAgentId ? (agentMap?.get(t.assignedAgentId) ?? null) : null;

  return {
    id: t.id,
    tourNumber: t.tourNumber,
    submittedName: t.submittedName,
    submittedEmail: t.submittedEmail,
    submittedPhone: t.submittedPhone,
    submittedMessage: t.submittedMessage,
    contactId: t.contactId,
    contact: t.contact
      ? {
          id: t.contact.id,
          contactId: t.contact.contactId,
          fullName: `${t.contact.firstName} ${t.contact.lastName}`.trim(),
          email: t.contact.email,
          phone: t.contact.phone,
        }
      : null,
    propertyId: t.propertyId,
    property: t.property
      ? {
          id: t.property.id,
          listingId: t.property.listingId,
          title: t.property.title,
          location: t.property.location,
          slug: t.property.slug,
          coverUrl: coverImage?.url ?? null,
        }
      : null,
    leadId: t.leadId,
    assignedAgentId: t.assignedAgentId,
    assignedAgent: agent,
    createdById: t.createdById,
    status: t.status,
    scheduledAt: t.scheduledAt.toISOString(),
    durationMinutes: t.durationMinutes,
    confirmationNote: t.confirmationNote,
    rescheduleNote: t.rescheduleNote,
    cancellationReason: t.cancellationReason,
    completionNote: t.completionNote,
    rescheduledFrom: t.rescheduledFrom?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    cancelledAt: t.cancelledAt?.toISOString() ?? null,
    source: t.source,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

async function buildAgentMap(
  ids: (string | null)[],
): Promise<Map<string, { id: string; fullName: string | null; email: string; avatarUrl: string | null }>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return new Map();
  const profiles = await prisma.profile.findMany({
    where: { id: { in: unique } },
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  });
  return new Map(profiles.map((p) => [p.id, p]));
}

// ── Record-level scope ────────────────────────────────────────────────────────

/**
 * ADMIN sees all tours. MANAGER sees their own + their team's (agents whose
 * teamLeaderId points to them). AGENT only ones they created or are assigned
 * to.
 */
async function tourRecordScope(profile: Profile): Promise<Prisma.TourWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return {};
  return { OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
}

// ── Find or reuse an existing open lead for this contact+property pair ─────────

async function findOrCreateLead(opts: {
  contactId: string | null;
  propertyId?: string | null;
  agentId?: string | null;
  submittedName: string;
  submittedEmail?: string | null;
  submittedPhone?: string | null;
  createdById?: string | null;
}): Promise<{ leadId: string; wasCreated: boolean }> {
  const { contactId, propertyId, agentId, submittedName, submittedEmail, submittedPhone, createdById } = opts;

  // Look for an active (non-archived, non-converted, non-closed) lead for this
  // contact+listing pair so we don't duplicate funnel entries. Without a
  // contactId (the common case now — tours don't auto-create a Contact), fall
  // back to matching on the submitted email/phone so we don't dedupe two
  // different anonymous prospects against each other via a shared
  // `contactId: null`; with neither, there's no reliable identity to match on
  // so a new lead is always created.
  const identityMatch = contactId
    ? { contactId }
    : submittedEmail
      ? { contactId: null, submittedEmail }
      : submittedPhone
        ? { contactId: null, submittedPhone }
        : null;

  const existing = identityMatch
    ? await prisma.lead.findFirst({
        where: {
          ...identityMatch,
          ...(propertyId ? { primaryListingId: propertyId } : {}),
          isArchived: false,
          lifecycleStatus: { notIn: ["CONVERTED", "CLOSED", "UNQUALIFIED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;
  if (existing) return { leadId: existing.id, wasCreated: false };

  // Pull listing context so the lead isn't left ambiguous: source detail/url
  // point back at the listing, and budget defaults to its price since a tour
  // request is anchored to one specific property (no budget field on the
  // public form).
  let sourceDetail: string | null = null;
  let sourceUrl: string | null = null;
  let budgetMin: number | null = null;
  let budgetMax: number | null = null;

  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true, slug: true, salePrice: true, rentPrice: true },
    });
    if (property) {
      sourceDetail = `Tour requested for: ${property.title}`;
      sourceUrl = `/listings/${property.slug}`;
      const price = property.salePrice ?? property.rentPrice;
      if (price) {
        budgetMin = Number(price);
        budgetMax = Number(price);
      }
    }
  }

  // Generate lead number
  const [numRow] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(lead_number FROM 5) AS INTEGER)) AS max FROM leads
  `;
  const leadNumber = `LDR-${String((numRow?.max ?? 0) + 1).padStart(4, "0")}`;

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      contactId,
      primaryListingId: propertyId ?? null,
      assignedAgentId: agentId ?? null,
      createdById: createdById ?? null,
      submittedName,
      submittedEmail: submittedEmail ?? null,
      submittedPhone: submittedPhone ?? null,
      source: "SCHEDULED_TOUR",
      sourceDetail,
      sourceUrl,
      budgetMin,
      budgetMax,
    },
    select: { id: true },
  });
  return { leadId: lead.id, wasCreated: true };
}

// ── List (dashboard) ──────────────────────────────────────────────────────────

export async function listTours(
  rawFilters: Record<string, unknown> = {},
): Promise<TourActionResult<{ tours: TourDto[]; total: number; page: number; limit: number }>> {
  const gate = await requirePermission("tours:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = tourListFiltersSchema.safeParse(rawFilters);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid filters", status: 422 };

  const { search, status, assignedAgentId, unassigned, propertyId, leadId, fromDate, toDate, upcoming, sortBy, page, limit } =
    parsed.data;

  const scope = await tourRecordScope(gate.profile);
  const andConditions: Prisma.TourWhereInput[] = [];
  if (Object.keys(scope).length > 0) andConditions.push(scope);

  if (search) {
    andConditions.push({
      OR: [
        { tourNumber: { contains: search, mode: "insensitive" } },
        { submittedName: { contains: search, mode: "insensitive" } },
        { submittedEmail: { contains: search, mode: "insensitive" } },
        { submittedPhone: { contains: search, mode: "insensitive" } },
        { contact: { firstName: { contains: search, mode: "insensitive" } } },
        { contact: { lastName: { contains: search, mode: "insensitive" } } },
        { property: { title: { contains: search, mode: "insensitive" } } },
        { property: { listingId: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  const now = new Date();
  const where: Prisma.TourWhereInput = {
    ...(status && { status }),
    ...(assignedAgentId && { assignedAgentId }),
    ...(unassigned && { assignedAgentId: null }),
    ...(propertyId && { propertyId }),
    ...(leadId && { leadId }),
    ...(fromDate && { scheduledAt: { gte: new Date(fromDate) } }),
    ...(toDate && { scheduledAt: { lte: new Date(toDate) } }),
    ...(upcoming && {
      scheduledAt: { gte: now },
      status: { in: [TourStatus.REQUESTED, TourStatus.CONFIRMED, TourStatus.RESCHEDULED] },
    }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  const orderBy: Prisma.TourOrderByWithRelationInput = (() => {
    switch (sortBy) {
      case "oldest": return { createdAt: "asc" as const };
      case "scheduled_asc": return { scheduledAt: "asc" as const };
      case "scheduled_desc": return { scheduledAt: "desc" as const };
      default: return { createdAt: "desc" as const };
    }
  })();

  const [rows, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: tourInclude,
    }),
    prisma.tour.count({ where }),
  ]);

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));
  const tours = await Promise.all(rows.map((r) => toTourDto(r, agentMap)));

  return { ok: true, tours, total, page, limit };
}

// ── Get single (dashboard) ────────────────────────────────────────────────────

export async function getTour(id: string): Promise<TourActionResult<{ tour: TourDto }>> {
  const gate = await requirePermission("tours:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const scope = await tourRecordScope(gate.profile);
  const row = await prisma.tour.findFirst({
    where: { id, ...scope },
    include: tourInclude,
  });
  if (!row) return { ok: false, error: "Tour not found", status: 404 };

  const agentMap = await buildAgentMap([row.assignedAgentId]);
  return { ok: true, tour: await toTourDto(row, agentMap) };
}

// ── Dashboard create (staff) ───────────────────────────────────────────────────

export async function createTour(
  rawInput: unknown,
): Promise<TourActionResult<{ tour: TourDto }>> {
  const gate = await requirePermission("tours:create");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createTourSchema.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const d = parsed.data;
  const scheduledAt = new Date(d.scheduledAt);
  if (scheduledAt <= new Date())
    return { ok: false, error: "Scheduled date must be in the future", status: 422 };

  // Validate agent is active
  if (d.assignedAgentId) {
    const agent = await prisma.profile.findUnique({ where: { id: d.assignedAgentId }, select: { status: true } });
    if (!agent || agent.status !== UserStatus.ACTIVE)
      return { ok: false, error: "Cannot assign to inactive or non-existent agent", status: 422 };
  }

  // Staff can override (force) a Google Calendar conflict; the public flow can't.
  const availability = await checkAvailability(d.assignedAgentId, scheduledAt, d.durationMinutes, d.force);
  if (!availability.ok) {
    return {
      ok: false,
      error: "This time conflicts with the agent's calendar.",
      status: 409,
      suggestedSlots: availability.suggestedSlots,
    };
  }

  // No auto-created Contact here either — same rule as the public flow. Staff
  // can still pass an explicit `contactId` if one was already picked.
  const contactId = d.contactId ?? null;

  // Find or create lead
  let leadId = d.leadId;
  let leadCreated = false;
  if (!leadId) {
    const result = await findOrCreateLead({
      contactId,
      propertyId: d.propertyId,
      agentId: d.assignedAgentId,
      submittedName: d.submittedName,
      submittedEmail: d.submittedEmail || null,
      submittedPhone: d.submittedPhone || null,
      createdById: gate.profile.id,
    });
    leadId = result.leadId;
    leadCreated = result.wasCreated;
  }

  const tourNumber = await nextTourNumber();
  const row = await prisma.tour.create({
    data: {
      tourNumber,
      submittedName: d.submittedName,
      submittedEmail: d.submittedEmail || null,
      submittedPhone: d.submittedPhone || null,
      submittedMessage: d.submittedMessage || null,
      contactId,
      propertyId: d.propertyId ?? null,
      leadId: leadId ?? null,
      assignedAgentId: d.assignedAgentId || null,
      createdById: gate.profile.id,
      scheduledAt,
      durationMinutes: d.durationMinutes,
      source: d.source,
    },
    include: tourInclude,
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "TOUR_CREATED",
    entityType: "TOUR",
    entityId: row.id,
    newValues: { tourNumber, source: d.source, leadCreated },
  });

  await notifyTourRequested({
    tourId: row.id,
    leadId: row.leadId,
    assignedAgentId: row.assignedAgentId,
    actorId: gate.profile.id,
    source: "DASHBOARD_CREATED",
  });

  await createTourCalendarEvent({
    tourId: row.id,
    agentId: row.assignedAgentId,
    summary: `Property Tour — ${d.submittedName}`,
    description: [
      row.property ? `Listing: ${row.property.title}` : null,
      d.submittedMessage || null,
      [d.submittedEmail, d.submittedPhone].filter(Boolean).join(" · ") || null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    location: row.property?.location ?? null,
    start: scheduledAt,
    durationMinutes: d.durationMinutes,
  });

  const agentMap = await buildAgentMap([row.assignedAgentId]);
  return { ok: true, tour: await toTourDto(row, agentMap) };
}

// ── Update tour (staff) ────────────────────────────────────────────────────────

export async function updateTour(
  id: string,
  rawInput: unknown,
): Promise<TourActionResult<{ tour: TourDto }>> {
  const gate = await requirePermission("tours:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateTourSchema.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const scope = await tourRecordScope(gate.profile);
  const existing = await prisma.tour.findFirst({
    where: { id, ...scope },
    select: {
      id: true,
      status: true,
      assignedAgentId: true,
      durationMinutes: true,
      googleCalendarEventId: true,
    },
  });
  if (!existing) return { ok: false, error: "Tour not found", status: 404 };
  if (existing.status === TourStatus.COMPLETED || existing.status === TourStatus.CANCELLED)
    return { ok: false, error: "Cannot edit a completed or cancelled tour", status: 422 };

  const d = parsed.data;
  const newScheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
  if (newScheduledAt && newScheduledAt <= new Date())
    return { ok: false, error: "Scheduled date must be in the future", status: 422 };

  if (newScheduledAt) {
    const durationMinutes = d.durationMinutes ?? existing.durationMinutes;
    const availability = await checkAvailability(existing.assignedAgentId, newScheduledAt, durationMinutes, d.force);
    if (!availability.ok) {
      return {
        ok: false,
        error: "This time conflicts with the agent's calendar.",
        status: 409,
        suggestedSlots: availability.suggestedSlots,
      };
    }
  }

  const row = await prisma.tour.update({
    where: { id },
    data: {
      ...(d.submittedName !== undefined && { submittedName: d.submittedName }),
      ...(d.submittedEmail !== undefined && { submittedEmail: d.submittedEmail || null }),
      ...(d.submittedPhone !== undefined && { submittedPhone: d.submittedPhone }),
      ...(d.submittedMessage !== undefined && { submittedMessage: d.submittedMessage }),
      ...(newScheduledAt && { scheduledAt: newScheduledAt }),
      ...(d.durationMinutes !== undefined && { durationMinutes: d.durationMinutes }),
      ...(d.leadId !== undefined && { leadId: d.leadId }),
      ...(d.propertyId !== undefined && { propertyId: d.propertyId }),
    },
    include: tourInclude,
  });

  await logActivity({ actorId: gate.profile.id, action: "TOUR_UPDATED", entityType: "TOUR", entityId: id });

  if (newScheduledAt) {
    await syncTourCalendarTime({
      tourId: row.id,
      agentId: row.assignedAgentId,
      existingEventId: existing.googleCalendarEventId,
      summary: `Property Tour — ${row.submittedName}`,
      description: row.property ? `Listing: ${row.property.title}` : "",
      location: row.property?.location ?? null,
      start: newScheduledAt,
      durationMinutes: row.durationMinutes,
    });
  }

  const agentMap = await buildAgentMap([row.assignedAgentId]);
  return { ok: true, tour: await toTourDto(row, agentMap) };
}

// ── Status transition (staff) ─────────────────────────────────────────────────

const VALID_STATUS_TRANSITIONS: Partial<Record<TourStatus, TourStatus[]>> = {
  [TourStatus.REQUESTED]: [TourStatus.CONFIRMED, TourStatus.RESCHEDULED, TourStatus.CANCELLED],
  [TourStatus.CONFIRMED]: [TourStatus.RESCHEDULED, TourStatus.COMPLETED, TourStatus.CANCELLED, TourStatus.NO_SHOW],
  [TourStatus.RESCHEDULED]: [TourStatus.CONFIRMED, TourStatus.COMPLETED, TourStatus.CANCELLED, TourStatus.NO_SHOW],
};

const STATUS_ACTION_MAP: Record<TourStatus, string> = {
  [TourStatus.REQUESTED]: "TOUR_CREATED",
  [TourStatus.CONFIRMED]: "TOUR_CONFIRMED",
  [TourStatus.RESCHEDULED]: "TOUR_RESCHEDULED",
  [TourStatus.COMPLETED]: "TOUR_COMPLETED",
  [TourStatus.CANCELLED]: "TOUR_CANCELLED",
  [TourStatus.NO_SHOW]: "TOUR_NO_SHOW",
};

// Which status transitions emit a push/in-app notification.
const TOUR_STATUS_NOTIFICATION: Partial<
  Record<TourStatus, "TOUR_CONFIRMED" | "TOUR_RESCHEDULED" | "TOUR_CANCELLED" | "TOUR_COMPLETED" | "TOUR_NO_SHOW">
> = {
  [TourStatus.CONFIRMED]: "TOUR_CONFIRMED",
  [TourStatus.RESCHEDULED]: "TOUR_RESCHEDULED",
  [TourStatus.CANCELLED]: "TOUR_CANCELLED",
  [TourStatus.COMPLETED]: "TOUR_COMPLETED",
  [TourStatus.NO_SHOW]: "TOUR_NO_SHOW",
};

export async function updateTourStatus(
  id: string,
  rawInput: unknown,
): Promise<TourActionResult<{ tour: TourDto }>> {
  const gate = await requirePermission("tours:update");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateTourStatusSchema.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const { status: newStatus, confirmationNote, rescheduleNote, cancellationReason, completionNote, scheduledAt, force } =
    parsed.data;

  const scope = await tourRecordScope(gate.profile);
  const existing = await prisma.tour.findFirst({
    where: { id, ...scope },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      assignedAgentId: true,
      durationMinutes: true,
      googleCalendarEventId: true,
    },
  });
  if (!existing) return { ok: false, error: "Tour not found", status: 404 };

  const allowed = VALID_STATUS_TRANSITIONS[existing.status];
  if (!allowed?.includes(newStatus)) {
    return {
      ok: false,
      error: `Cannot transition from ${existing.status} to ${newStatus}`,
      status: 422,
    };
  }

  const newScheduledAt =
    newStatus === TourStatus.RESCHEDULED && scheduledAt ? new Date(scheduledAt) : null;
  if (newScheduledAt && newScheduledAt <= new Date()) {
    return { ok: false, error: "Rescheduled date must be in the future", status: 422 };
  }

  if (newScheduledAt) {
    const availability = await checkAvailability(existing.assignedAgentId, newScheduledAt, existing.durationMinutes, force);
    if (!availability.ok) {
      return {
        ok: false,
        error: "This time conflicts with the agent's calendar.",
        status: 409,
        suggestedSlots: availability.suggestedSlots,
      };
    }
  }

  const row = await prisma.tour.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === TourStatus.CONFIRMED && { confirmationNote: confirmationNote ?? null }),
      ...(newStatus === TourStatus.RESCHEDULED && {
        rescheduleNote: rescheduleNote ?? null,
        rescheduledFrom: existing.scheduledAt,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      }),
      ...(newStatus === TourStatus.CANCELLED && {
        cancellationReason: cancellationReason ?? null,
        cancelledAt: new Date(),
      }),
      ...(newStatus === TourStatus.COMPLETED && {
        completionNote: completionNote ?? null,
        completedAt: new Date(),
      }),
    },
    include: tourInclude,
  });

  const action = STATUS_ACTION_MAP[newStatus] as Parameters<typeof logActivity>[0]["action"];
  await logActivity({ actorId: gate.profile.id, action, entityType: "TOUR", entityId: id });

  if (newScheduledAt) {
    await syncTourCalendarTime({
      tourId: row.id,
      agentId: row.assignedAgentId,
      existingEventId: existing.googleCalendarEventId,
      summary: `Property Tour — ${row.submittedName}`,
      description: row.property ? `Listing: ${row.property.title}` : "",
      location: row.property?.location ?? null,
      start: newScheduledAt,
      durationMinutes: row.durationMinutes,
    });
  } else if (newStatus === TourStatus.CANCELLED) {
    await deleteTourCalendarEvent(existing.assignedAgentId, existing.googleCalendarEventId);
  }

  // Best-effort notification for the assigned agent on confirm/reschedule/cancel.
  const notifyType = TOUR_STATUS_NOTIFICATION[newStatus];
  if (notifyType) {
    await notifyTourStatusChanged({
      tourId: id,
      leadId: row.leadId,
      assignedAgentId: row.assignedAgentId,
      type: notifyType,
      actorId: gate.profile.id,
      occurredAt: row.updatedAt,
    });
  }

  const agentMap = await buildAgentMap([row.assignedAgentId]);

  // Best-effort status emails to the prospect — never block the status
  // transition itself if SendGrid has a hiccup or isn't configured.
  const agentName = row.assignedAgentId ? (agentMap.get(row.assignedAgentId)?.fullName ?? null) : null;
  try {
    if (newStatus === TourStatus.CONFIRMED && row.submittedEmail) {
      await sendTourConfirmedEmail({
        to: row.submittedEmail,
        submittedName: row.submittedName,
        tourNumber: row.tourNumber,
        scheduledAtLabel: format(row.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a"),
        durationLabel: formatTourDuration(row.durationMinutes),
        propertyTitle: row.property?.title ?? null,
        propertyLocation: row.property?.location ?? null,
        agentName,
        confirmationNote: row.confirmationNote,
      });
    } else if (newStatus === TourStatus.RESCHEDULED && newScheduledAt && row.submittedEmail) {
      await sendTourRescheduledEmail({
        to: row.submittedEmail,
        submittedName: row.submittedName,
        tourNumber: row.tourNumber,
        previousScheduledAtLabel: format(existing.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a"),
        newScheduledAtLabel: format(newScheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a"),
        durationLabel: formatTourDuration(row.durationMinutes),
        propertyTitle: row.property?.title ?? null,
        propertyLocation: row.property?.location ?? null,
        agentName,
        rescheduleNote: row.rescheduleNote,
      });
    } else if (newStatus === TourStatus.CANCELLED && row.submittedEmail) {
      await sendTourCancelledEmail({
        to: row.submittedEmail,
        submittedName: row.submittedName,
        tourNumber: row.tourNumber,
        scheduledAtLabel: format(row.scheduledAt, "EEEE, MMMM d, yyyy 'at' h:mm a"),
        propertyTitle: row.property?.title ?? null,
        propertyLocation: row.property?.location ?? null,
        cancellationReason: row.cancellationReason,
      });
    }
  } catch (error) {
    console.error("[email] failed to send tour status email", row.id, newStatus, error);
  }

  return { ok: true, tour: await toTourDto(row, agentMap) };
}

// ── Assign agent (staff) ───────────────────────────────────────────────────────

export async function assignTourAgent(
  id: string,
  rawInput: unknown,
): Promise<TourActionResult<{ tour: TourDto }>> {
  const gate = await requirePermission("tours:assign");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = assignTourSchema.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  if (parsed.data.agentId) {
    const agent = await prisma.profile.findUnique({
      where: { id: parsed.data.agentId },
      select: { status: true },
    });
    if (!agent || agent.status !== UserStatus.ACTIVE)
      return { ok: false, error: "Cannot assign to inactive or non-existent agent", status: 422 };
  }

  const existing = await prisma.tour.findUnique({ where: { id }, select: { id: true, assignedAgentId: true } });
  if (!existing) return { ok: false, error: "Tour not found", status: 404 };

  const row = await prisma.tour.update({
    where: { id },
    data: { assignedAgentId: parsed.data.agentId },
    include: tourInclude,
  });

  const action = existing.assignedAgentId ? "TOUR_REASSIGNED" : "TOUR_ASSIGNED";
  await logActivity({
    actorId: gate.profile.id,
    action,
    entityType: "TOUR",
    entityId: id,
    oldValues: { agentId: existing.assignedAgentId },
    newValues: { agentId: parsed.data.agentId },
  });

  if (parsed.data.agentId) {
    await notifyTourAssigned({
      tourId: id,
      leadId: row.leadId,
      assignedAgentId: parsed.data.agentId,
      actorId: gate.profile.id,
    });
  }

  const agentMap = await buildAgentMap([row.assignedAgentId]);
  return { ok: true, tour: await toTourDto(row, agentMap) };
}

// ── Public tour request (from listing page, no auth required) ─────────────────

export async function requestPublicTour(
  rawInput: unknown,
): Promise<TourActionResult<{ tour: { id: string; tourNumber: string; scheduledAt: string } }>> {
  const parsed = requestTourSchema.safeParse(rawInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 422 };

  const d = parsed.data;
  const scheduledAt = new Date(d.scheduledAt);
  if (scheduledAt <= new Date())
    return { ok: false, error: "Please choose a future date and time", status: 422 };

  // Look up the property to determine the default agent
  let assignedAgentId: string | null = null;
  let propertyTitle: string | null = null;
  let propertyLocation: string | null = null;
  if (d.propertyId) {
    const prop = await prisma.property.findUnique({
      where: { id: d.propertyId },
      select: { assignedAgentId: true, title: true, location: true },
    });
    assignedAgentId = prop?.assignedAgentId ?? null;
    propertyTitle = prop?.title ?? null;
    propertyLocation = prop?.location ?? null;
  }

  // The public flow can never override a conflict — only suggest alternatives.
  const availability = await checkAvailability(assignedAgentId, scheduledAt, d.durationMinutes);
  if (!availability.ok) {
    return {
      ok: false,
      error: "This time is no longer available. Please choose another time.",
      status: 409,
      suggestedSlots: availability.suggestedSlots,
    };
  }

  // No Contact is created here — a tour request stays a prospect (Lead only)
  // until staff explicitly convert it to an Opportunity.
  const { leadId, wasCreated: leadCreated } = await findOrCreateLead({
    contactId: null,
    propertyId: d.propertyId,
    agentId: assignedAgentId,
    submittedName: d.submittedName,
    submittedEmail: d.submittedEmail || null,
    submittedPhone: d.submittedPhone || null,
  });

  const tourNumber = await nextTourNumber();
  const tour = await prisma.tour.create({
    data: {
      tourNumber,
      submittedName: d.submittedName,
      submittedEmail: d.submittedEmail || null,
      submittedPhone: d.submittedPhone || null,
      submittedMessage: d.submittedMessage || null,
      contactId: null,
      propertyId: d.propertyId ?? null,
      leadId,
      assignedAgentId,
      scheduledAt,
      durationMinutes: d.durationMinutes,
      source: "PUBLIC_REQUEST",
    },
    select: { id: true, tourNumber: true, scheduledAt: true },
  });

  // Log against the lead so it appears in the lead activity feed
  await logActivity({
    action: "LEAD_TOUR_LINKED",
    entityType: "LEAD",
    entityId: leadId,
    newValues: { tourId: tour.id, tourNumber, leadCreated },
  });
  await logActivity({
    action: "TOUR_CREATED",
    entityType: "TOUR",
    entityId: tour.id,
    newValues: { tourNumber, source: "PUBLIC_REQUEST" },
  });

  // Best-effort: alert the assigned agent (if any) and all admins/managers.
  await notifyTourRequested({
    tourId: tour.id,
    leadId,
    assignedAgentId,
    actorId: null,
  });

  await createTourCalendarEvent({
    tourId: tour.id,
    agentId: assignedAgentId,
    summary: `Property Tour — ${d.submittedName}`,
    description: [
      propertyTitle ? `Listing: ${propertyTitle}` : null,
      d.submittedMessage || null,
      [d.submittedEmail, d.submittedPhone].filter(Boolean).join(" · ") || null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    location: propertyLocation,
    start: scheduledAt,
    durationMinutes: d.durationMinutes,
  });

  return { ok: true, tour: { id: tour.id, tourNumber: tour.tourNumber, scheduledAt: tour.scheduledAt.toISOString() } };
}

// ── "My Tours" for authenticated public users ──────────────────────────────────

export async function getMyTours(profileId: string): Promise<MyTourDto[]> {
  // Public users only see tours where their submitted email matches the profile
  // email (identified by Supabase Auth). Matched directly on the tour's own
  // submitted-info snapshot — tours no longer require a linked Contact.
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { email: true },
  });
  if (!profile) return [];

  const rows = await prisma.tour.findMany({
    where: {
      submittedEmail: { equals: profile.email, mode: "insensitive" },
    },
    orderBy: { scheduledAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          listingId: true,
          title: true,
          location: true,
          slug: true,
          images: { select: { url: true, isCover: true }, orderBy: { sortOrder: "asc" as const }, take: 1 },
        },
      },
    },
  });

  const agentMap = await buildAgentMap(rows.map((r) => r.assignedAgentId));

  return rows.map((t): MyTourDto => {
    const agent = t.assignedAgentId ? (agentMap.get(t.assignedAgentId) ?? null) : null;
    return {
      id: t.id,
      tourNumber: t.tourNumber,
      status: t.status,
      scheduledAt: t.scheduledAt.toISOString(),
      durationMinutes: t.durationMinutes,
      property: t.property
        ? {
            id: t.property.id,
            listingId: t.property.listingId,
            title: t.property.title,
            location: t.property.location,
            slug: t.property.slug,
            coverUrl: t.property.images[0]?.url ?? null,
          }
        : null,
      assignedAgent: agent,
      cancellationReason: t.cancellationReason,
      createdAt: t.createdAt.toISOString(),
    };
  });
}

// ── Public user cancel their own tour ─────────────────────────────────────────

export async function cancelMyTour(
  tourId: string,
  profileId: string,
): Promise<TourActionResult<{ ok: true }>> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { email: true } });
  if (!profile) return { ok: false, error: "User not found", status: 404 };

  const tour = await prisma.tour.findFirst({
    where: {
      id: tourId,
      submittedEmail: { equals: profile.email, mode: "insensitive" },
    },
    select: { id: true, status: true },
  });
  if (!tour) return { ok: false, error: "Tour not found", status: 404 };
  if (tour.status === TourStatus.COMPLETED || tour.status === TourStatus.CANCELLED)
    return { ok: false, error: "This tour is already completed or cancelled", status: 422 };

  await prisma.tour.update({
    where: { id: tourId },
    data: { status: TourStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: "Cancelled by visitor" },
  });

  await logActivity({
    actorId: profileId,
    action: "TOUR_CANCELLED",
    entityType: "TOUR",
    entityId: tourId,
    newValues: { cancelledBy: "visitor" },
  });

  return { ok: true };
}
