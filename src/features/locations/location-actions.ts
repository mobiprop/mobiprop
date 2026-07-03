import "server-only";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { requireUser } from "@/lib/require-user";
import { logActivity } from "@/lib/activity-log";
import { geocodeAddress } from "@/lib/maps";
import { PropertyType, PropertyStatus, ContractStatus } from "@/generated/prisma/enums";
import { createLocationSchema, updateLocationSchema } from "@/schemas/location.schema";
import type { CreateLocationInput, UpdateLocationInput } from "@/schemas/location.schema";
import type {
  LocationDto,
  LocationActivityDto,
  LocationActivityKind,
  LocationSuggestionDto,
} from "./types/location-dto";

export type LocationActionError = { ok: false; error: string; status: number };
export type LocationActionResult<T> = ({ ok: true } & T) | LocationActionError;

// ── ID generation ─────────────────────────────────────────────────────────────

async function nextLocationId(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(location_id FROM 5) AS INTEGER)) AS max FROM locations
  `;
  return `LOC-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
}

// ── Stats computation ────────────────────────────────────────────────────────
// 3 bulk queries total (regardless of location count), then bucketed in memory
// per location by exact Property.locationId match. Avoids N+1 round trips
// while still deriving every number live from real rows.

type StatsProperty = {
  id: string;
  locationId: string | null;
  type: PropertyType;
  status: PropertyStatus;
  salePrice: { toString(): string } | null;
  totalAreaM2: number | null;
  assignedAgentId: string | null;
  createdAt: Date;
};

type StatsContract = { value: { toString(): string } | null; propertyId: string | null };

type StatsActivityLog = {
  id: string;
  action: string;
  entityId: string;
  newValues: unknown;
  createdAt: Date;
};

function activityKindFor(action: string, newValues: unknown): LocationActivityKind {
  if (action === "PROPERTY_CREATED") return "created";
  if (
    action === "PROPERTY_STATUS_CHANGED" &&
    typeof newValues === "object" &&
    newValues !== null &&
    "status" in newValues &&
    (newValues as { status?: unknown }).status === PropertyStatus.SOLD
  ) {
    return "sold";
  }
  return "updated";
}

function activityDescriptionFor(kind: LocationActivityKind): string {
  if (kind === "created") return "New property listed";
  if (kind === "sold") return "Property sold";
  return "Listing updated";
}

function buildLocationDtos(
  locations: {
    id: string;
    locationId: string;
    name: string;
    region: string;
    address: string;
    postalCode: string;
    latitude: { toString(): string } | null;
    longitude: { toString(): string } | null;
    createdAt: Date;
    updatedAt: Date;
  }[],
  properties: StatsProperty[],
  contracts: StatsContract[],
  activityLogs: StatsActivityLog[],
  activeProfileIds: Set<string>,
): LocationDto[] {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return locations.map((loc) => {
    const matched = properties.filter((p) => p.locationId === loc.id);
    const matchedIds = new Set(matched.map((p) => p.id));

    const active = matched.filter((p) => p.status === PropertyStatus.ACTIVE).length;
    const sold = matched.filter((p) => p.status === PropertyStatus.SOLD).length;

    const houses = matched.filter(
      (p) => p.type === PropertyType.HOUSE || p.type === PropertyType.TOWNHOUSE,
    ).length;
    const apartments = matched.filter((p) => p.type === PropertyType.APARTMENT).length;
    const lots = matched.filter((p) => p.type === PropertyType.LOT).length;
    const commercial = matched.filter((p) => p.type === PropertyType.COMMERCIAL_OFFICE).length;

    // Active agents only — excludes inactive/pending/revoked staff per the
    // documented metric definition.
    const agents = new Set(
      matched
        .map((p) => p.assignedAgentId)
        .filter((id): id is string => Boolean(id) && activeProfileIds.has(id!)),
    ).size;

    const withPriceAndArea = matched.filter((p) => p.salePrice != null && p.totalAreaM2);
    const avgPricePerM2 = withPriceAndArea.length
      ? Math.round(
          withPriceAndArea.reduce((sum, p) => {
            const sqm = p.totalAreaM2 ?? 0;
            return sum + (sqm > 0 ? Number(p.salePrice) / sqm : 0);
          }, 0) / withPriceAndArea.length,
        )
      : 0;

    const revenue =
      contracts
        .filter((c) => c.propertyId && matchedIds.has(c.propertyId))
        .reduce((sum, c) => sum + (c.value ? Number(c.value) : 0), 0) / 1_000_000;

    const thisMonthCount = matched.filter((p) => p.createdAt >= thisMonthStart).length;
    const lastMonthCount = matched.filter(
      (p) => p.createdAt >= lastMonthStart && p.createdAt < thisMonthStart,
    ).length;
    // Best-effort month-over-month proxy — no historical snapshot table exists.
    const growthPercent =
      lastMonthCount > 0
        ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
        : thisMonthCount > 0
          ? 100
          : 0;

    const activity: LocationActivityDto[] = activityLogs
      .filter((a) => matchedIds.has(a.entityId))
      .slice(0, 5)
      .map((a) => {
        const kind = activityKindFor(a.action, a.newValues);
        return {
          id: a.id,
          kind,
          description: activityDescriptionFor(kind),
          createdAt: a.createdAt.toISOString(),
        };
      });

    return {
      id: loc.id,
      locationId: loc.locationId,
      name: loc.name,
      region: loc.region,
      address: loc.address,
      postalCode: loc.postalCode,
      coordinates: {
        lat: loc.latitude ? Number(loc.latitude) : 0,
        lng: loc.longitude ? Number(loc.longitude) : 0,
      },
      growthPercent,
      properties: matched.length,
      active,
      sold,
      revenue,
      agents,
      avgPricePerM2,
      distribution: { houses, apartments, lots, commercial },
      activity,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    };
  });
}

// ── List (with stats) ────────────────────────────────────────────────────────

export async function listLocationsWithStats(): Promise<
  LocationActionResult<{ locations: LocationDto[] }>
> {
  const gate = await requirePermission("locations:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const locations = await prisma.location.findMany({ orderBy: { createdAt: "asc" } });
  if (locations.length === 0) return { ok: true, locations: [] };

  const properties = await prisma.property.findMany({
    where: { locationId: { not: null } },
    select: {
      id: true,
      locationId: true,
      type: true,
      status: true,
      salePrice: true,
      totalAreaM2: true,
      assignedAgentId: true,
      createdAt: true,
    },
  });

  const propertyIds = properties.map((p) => p.id);
  const agentIds = [...new Set(properties.map((p) => p.assignedAgentId).filter((id): id is string => Boolean(id)))];

  const [contracts, activityLogs, activeProfiles] = await Promise.all([
    propertyIds.length
      ? prisma.contract.findMany({
          // Revenue counts only completed deals — matches the documented rule
          // (closed-won opportunities / completed contracts), not draft/pending value.
          where: { propertyId: { in: propertyIds }, status: ContractStatus.COMPLETED },
          select: { value: true, propertyId: true },
        })
      : Promise.resolve([]),
    propertyIds.length
      ? prisma.activityLog.findMany({
          where: { entityType: "PROPERTY", entityId: { in: propertyIds } },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : Promise.resolve([]),
    agentIds.length
      ? prisma.profile.findMany({ where: { id: { in: agentIds }, status: "ACTIVE" }, select: { id: true } })
      : Promise.resolve([]),
  ]);

  const activeProfileIds = new Set(activeProfiles.map((p) => p.id));

  return {
    ok: true,
    locations: buildLocationDtos(locations, properties, contracts, activityLogs, activeProfileIds),
  };
}

// ── Name suggestions (any authenticated staff member) ───────────────────────

export async function listLocationNameSuggestions(): Promise<
  LocationActionResult<{ locations: LocationSuggestionDto[] }>
> {
  const gate = await requireUser();
  if (!gate.ok) return { ok: false, error: gate.error, status: 401 };

  const locations = await prisma.location.findMany({
    select: { id: true, name: true, region: true, address: true },
    orderBy: { name: "asc" },
  });

  return { ok: true, locations };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createLocation(
  input: CreateLocationInput,
): Promise<LocationActionResult<{ location: LocationDto }>> {
  const gate = await requirePermission("locations:manage");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const locationId = await nextLocationId();
  const geocoded = await geocodeAddress(`${parsed.data.address}, ${parsed.data.region}`);

  const location = await prisma.location.create({
    data: {
      ...parsed.data,
      locationId,
      createdById: gate.profile.id,
      latitude: geocoded?.latitude,
      longitude: geocoded?.longitude,
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "LOCATION_CREATED",
    entityType: "LOCATION",
    entityId: location.id,
    newValues: { locationId: location.locationId, name: location.name, region: location.region },
  });

  const [dto] = buildLocationDtos([location], [], [], [], new Set());
  return { ok: true, location: dto };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateLocation(
  id: string,
  input: UpdateLocationInput,
): Promise<LocationActionResult<{ location: LocationDto }>> {
  const gate = await requirePermission("locations:manage");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const parsed = updateLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", status: 400 };
  }

  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Location not found", status: 404 };

  const addressChanged =
    (parsed.data.address !== undefined && parsed.data.address !== existing.address) ||
    (parsed.data.region !== undefined && parsed.data.region !== existing.region);

  const geocoded = addressChanged
    ? await geocodeAddress(
        `${parsed.data.address ?? existing.address}, ${parsed.data.region ?? existing.region}`,
      )
    : null;

  const location = await prisma.location.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(geocoded && { latitude: geocoded.latitude, longitude: geocoded.longitude }),
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "LOCATION_UPDATED",
    entityType: "LOCATION",
    entityId: id,
    oldValues: { name: existing.name, region: existing.region, address: existing.address },
    newValues: { name: location.name, region: location.region, address: location.address },
  });

  const [dto] = buildLocationDtos([location], [], [], [], new Set());
  return { ok: true, location: dto };
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteLocation(id: string): Promise<LocationActionResult<{ id: string }>> {
  const gate = await requirePermission("locations:manage");
  if (!gate.ok) return { ok: false, error: gate.error, status: 403 };

  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Location not found", status: 404 };

  const linkedCount = await prisma.property.count({ where: { locationId: id } });
  if (linkedCount > 0) {
    return {
      ok: false,
      error: `Cannot delete "${existing.name}" — ${linkedCount} listing(s) are linked to it. Reassign those listings first.`,
      status: 409,
    };
  }

  await prisma.location.delete({ where: { id } });

  await logActivity({
    actorId: gate.profile.id,
    action: "LOCATION_DELETED",
    entityType: "LOCATION",
    entityId: id,
    oldValues: { locationId: existing.locationId, name: existing.name, region: existing.region },
  });

  return { ok: true, id };
}
