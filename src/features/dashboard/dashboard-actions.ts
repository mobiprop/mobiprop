import "server-only";

import {
  startOfDay,
  endOfDay,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { hasPermission } from "@/lib/permissions";
import { resolveOwnerScopeIds } from "@/lib/team-scope";
import {
  resolveCompanyRevenueUsd,
  resolveAgentEarningsUsd,
  resolveNetCompanyRevenueUsd,
} from "@/lib/commission";
import { getDolarBlueVenta } from "@/lib/exchange-rate";
import { OpportunityStatus, PropertyStatus, PropertyOperationType } from "@/generated/prisma/enums";
import { Prisma, type Profile } from "@/generated/prisma/client";
import type {
  ChartGranularity,
  ChartPoint,
  DashboardDateRangeInput,
  LocationRow,
  MetricCard,
  SaleOperation,
  SaleRow,
  TrendDirection,
} from "./types/dashboard-dto";

export type DashboardActionError = { ok: false; error: string; status: number };
export type DashboardActionResult<T> = ({ ok: true } & T) | DashboardActionError;

function statusFor(reason: string): number {
  return reason === "unauthenticated" ? 401 : 403;
}

// ── Record-level access ──────────────────────────────────────────────────────
// Mirrors opportunityRecordScope in opportunity-actions.ts: ADMIN sees
// company-wide figures; MANAGER is scoped to their own + their team's (agents
// whose teamLeaderId points to them); AGENT is scoped to opportunities they
// created or are assigned to.

async function opportunityScope(profile: Profile): Promise<Prisma.OpportunityWhereInput> {
  const scopeIds = await resolveOwnerScopeIds(profile);
  if (scopeIds === null) return { isDeleted: false };
  return { isDeleted: false, OR: [{ assignedAgentId: { in: scopeIds } }, { createdById: { in: scopeIds } }] };
}

// ── Date range resolution ─────────────────────────────────────────────────────
// No historical snapshot table exists, so "trend vs previous period" compares
// the selected window against an equal-length immediately preceding window —
// same best-effort proxy already used by listLocationsWithStats().

function resolveDateRange(input: DashboardDateRangeInput) {
  const end = endOfDay(new Date());
  let start: Date;

  if (input.dateRange === "CUSTOM" && input.from && input.to) {
    const parsedFrom = startOfDay(new Date(input.from));
    const parsedTo = endOfDay(new Date(input.to));
    if (!Number.isNaN(parsedFrom.getTime()) && !Number.isNaN(parsedTo.getTime()) && parsedFrom <= parsedTo) {
      const spanMs = parsedTo.getTime() - parsedFrom.getTime();
      return {
        start: parsedFrom,
        end: parsedTo,
        prevStart: new Date(parsedFrom.getTime() - spanMs),
        prevEnd: new Date(parsedFrom.getTime() - 1),
      };
    }
  }

  if (input.dateRange === "LAST_WEEK") {
    start = startOfDay(subDays(end, 7));
  } else if (input.dateRange === "90_DAYS") {
    start = startOfDay(subDays(end, 90));
  } else {
    start = startOfDay(subDays(end, 60));
  }

  const spanMs = end.getTime() - start.getTime();
  return {
    start,
    end,
    prevStart: new Date(start.getTime() - spanMs),
    prevEnd: new Date(start.getTime() - 1),
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// These metric cards are always company-wide/agent revenue already converted
// to USD (see resolveCompanyRevenueUsd/resolveAgentEarningsUsd below) — the
// prefix is a fixed "USD", matching the "USD $"/"ARS $" pattern used
// everywhere else money is shown (see src/lib/formatters.ts).
function fmtMoney(n: number): string {
  return `USD $${Math.round(n).toLocaleString("en-US")}`;
}

function trendFrom(
  current: number,
  previous: number,
): {
  trendValue: string;
  trendText: string;
  trendDirection: TrendDirection;
} {
  if (previous === 0) {
    return current === 0
      ? {
        trendValue: "0%",
        trendText: "from last month",
        trendDirection: "up",
      }
      : {
        trendValue: "+100%",
        trendText: "from last month",
        trendDirection: "up",
      };
  }

  const percentage =
    Math.round(((current - previous) / previous) * 1000) / 10;

  return {
    trendValue: `${percentage >= 0 ? "+" : ""}${percentage}%`,
    trendText: "from last month",
    trendDirection: percentage >= 0 ? "up" : "down",
  };
}
function sparklineFromDates(dates: Date[], start: Date, end: Date, points = 7): number[] {
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const bucketMs = spanMs / points;
  const counts = new Array(points).fill(0) as number[];
  for (const d of dates) {
    const t = d.getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(points - 1, Math.floor((t - start.getTime()) / bucketMs));
    counts[idx] += 1;
  }
  return counts;
}

function sparklineFromValues(
  items: { date: Date; value: number }[],
  start: Date,
  end: Date,
  points = 7,
): number[] {
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const bucketMs = spanMs / points;
  const sums = new Array(points).fill(0) as number[];
  for (const { date, value } of items) {
    const t = date.getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(points - 1, Math.floor((t - start.getTime()) / bucketMs));
    sums[idx] += value;
  }
  return sums;
}


// ── Metrics ───────────────────────────────────────────────────────────────────

export async function getDashboardMetrics(
  input: DashboardDateRangeInput,
): Promise<DashboardActionResult<{ metrics: MetricCard[] }>> {
  const gate = await requirePermission("dashboard:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: statusFor(gate.reason) };

  const { profile } = gate;
  const { start, end, prevStart } = resolveDateRange(input);
  const isCompanyView = hasPermission(profile.role, "dashboard:viewCompanyRevenue");
  const scopeIds = await resolveOwnerScopeIds(profile);

  const opportunityWhere: Prisma.OpportunityWhereInput = {
    AND: [
      await opportunityScope(profile),
      {
        OR: [
          { createdAt: { gte: prevStart, lte: end } },
          { updatedAt: { gte: prevStart, lte: end } },
          { closedAt: { gte: prevStart, lte: end } },
        ],
      },
    ],
  };

  const propertyWhere: Prisma.PropertyWhereInput =
    scopeIds === null
      ? { status: PropertyStatus.ACTIVE }
      : { status: PropertyStatus.ACTIVE, assignedAgentId: { in: scopeIds } };

  const [listingsTotal, listingRows, opportunityRows, liveRate] = await Promise.all([
    prisma.property.count({ where: propertyWhere }),
    prisma.property.findMany({
      where: { ...propertyWhere, createdAt: { gte: prevStart, lte: end } },
      select: { createdAt: true },
    }),
    prisma.opportunity.findMany({
      where: opportunityWhere,
      select: {
        status: true, dealSize: true, commission: true, commissionUnit: true,
        agentCommissionValue: true, agentCommissionUnit: true, currency: true, exchangeRate: true,
        createdAt: true, updatedAt: true, closedAt: true,
      },
    }),
    getDolarBlueVenta(),
  ]);

  const inWindow = (d: Date) => d >= start && d <= end;
  const inPrevWindow = (d: Date) => d >= prevStart && d < start;

  const listingsInWindow = listingRows.filter((p) => inWindow(p.createdAt));
  const listingsInPrevWindow = listingRows.filter((p) => inPrevWindow(p.createdAt));

  const openInWindow = opportunityRows.filter((o) => o.status === OpportunityStatus.OPEN && inWindow(o.createdAt));
  const openInPrevWindow = opportunityRows.filter(
    (o) => o.status === OpportunityStatus.OPEN && inPrevWindow(o.createdAt),
  );
  // CLOSED_WON deals window on closedAt (the date the rate was locked), not
  // updatedAt. Legacy records without closedAt use updatedAt as a reporting
  // fallback; this does not infer or overwrite the actual closing date.
  const wonInWindow = opportunityRows.filter(
    (o) => o.status === OpportunityStatus.CLOSED_WON && inWindow(o.closedAt ?? o.updatedAt),
  );
  const wonInPrevWindow = opportunityRows.filter(
    (o) => o.status === OpportunityStatus.CLOSED_WON && inPrevWindow(o.closedAt ?? o.updatedAt),
  );
  const lostInWindow = opportunityRows.filter((o) => o.status === OpportunityStatus.CLOSED_LOST && inWindow(o.updatedAt));
  const lostInPrevWindow = opportunityRows.filter(
    (o) => o.status === OpportunityStatus.CLOSED_LOST && inPrevWindow(o.updatedAt),
  );

  // "Revenue" = the company's resolved commission (Commission Amount), never the
  // full deal size, always normalized to USD. Agent's "Mi Comisión" = their own
  // resolved agent commission, also USD. An ARS deal that can't be converted
  // (no locked rate and the live-rate fetch failed) is excluded, not guessed.
  const sumRevenue = (rows: typeof opportunityRows) =>
    rows.reduce((s, o) => s + (resolveCompanyRevenueUsd(o, liveRate) ?? 0), 0);
  const sumNetRevenue = (rows: typeof opportunityRows) =>
    rows.reduce((s, o) => s + (resolveNetCompanyRevenueUsd(o, liveRate) ?? 0), 0);
  const sumAgentEarnings = (rows: typeof opportunityRows) =>
    rows.reduce((s, o) => s + (resolveAgentEarningsUsd(o, liveRate) ?? 0), 0);

  let metrics: MetricCard[];

  if (isCompanyView) {
    const revenueWindow = sumRevenue(wonInWindow);
    const revenuePrevWindow = sumRevenue(wonInPrevWindow);
    const netRevenueWindow = sumNetRevenue(wonInWindow);

    metrics = [
      {
        key: "listings",
        label: "Amount of Listings",
        value: String(listingsTotal),
        iconBg: "#e0e7ff",
        iconColor: "#4f46e5",
        sparkline: sparklineFromDates(listingsInWindow.map((p) => p.createdAt), start, end),
        ...trendFrom(listingsInWindow.length, listingsInPrevWindow.length),
      },
      {
        key: "lost",
        label: "Lost Opportunities",
        value: String(lostInWindow.length),
        sub: fmtMoney(sumRevenue(lostInWindow)),
        iconBg: "#fee2e2",
        iconColor: "#dc2626",
        sparkline: sparklineFromDates(lostInWindow.map((o) => o.updatedAt), start, end),
        ...trendFrom(lostInWindow.length, lostInPrevWindow.length),
      },
      {
        key: "won",
        label: "Won Opportunities",
        value: String(wonInWindow.length),
        sub: fmtMoney(revenueWindow),
        iconBg: "#d1fae5",
        iconColor: "#059669",
        sparkline: sparklineFromDates(wonInWindow.map((o) => o.closedAt ?? o.updatedAt), start, end),
        ...trendFrom(wonInWindow.length, wonInPrevWindow.length),
      },
      {
        key: "revenue",
        label: "Revenue",
        value: fmtMoney(revenueWindow),
        netValue: fmtMoney(netRevenueWindow),
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        sparkline: sparklineFromValues(
          wonInWindow.map((o) => ({ date: o.closedAt ?? o.updatedAt, value: resolveCompanyRevenueUsd(o, liveRate) ?? 0 })),
          start,
          end,
        ),
        ...trendFrom(revenueWindow, revenuePrevWindow),
      },
    ];
  } else {
    const commissionWindow = sumAgentEarnings(wonInWindow);
    const commissionPrevWindow = sumAgentEarnings(wonInPrevWindow);

    metrics = [
      {
        key: "my-listings",
        label: "Mis Propiedades",
        value: String(listingsTotal),
        iconBg: "#e0e7ff",
        iconColor: "#4f46e5",
        sparkline: sparklineFromDates(listingsInWindow.map((p) => p.createdAt), start, end),
        ...trendFrom(listingsInWindow.length, listingsInPrevWindow.length),
      },
      {
        key: "my-open",
        label: "Oportunidades Abiertas",
        value: String(openInWindow.length),
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        sparkline: sparklineFromDates(openInWindow.map((o) => o.createdAt), start, end),
        ...trendFrom(openInWindow.length, openInPrevWindow.length),
      },
      {
        key: "my-won",
        label: "Oportunidades Ganadas",
        value: String(wonInWindow.length),
        iconBg: "#d1fae5",
        iconColor: "#059669",
        sparkline: sparklineFromDates(wonInWindow.map((o) => o.closedAt ?? o.updatedAt), start, end),
        ...trendFrom(wonInWindow.length, wonInPrevWindow.length),
      },
      {
        key: "my-commission",
        label: "Mi Comisión",
        value: fmtMoney(commissionWindow),
        iconBg: "#fef3c7",
        iconColor: "#d97706",
        sparkline: sparklineFromValues(
          wonInWindow.map((o) => ({ date: o.closedAt ?? o.updatedAt, value: resolveAgentEarningsUsd(o, liveRate) ?? 0 })),
          start,
          end,
        ),
        ...trendFrom(commissionWindow, commissionPrevWindow),
      },
    ];
  }

  return { ok: true, metrics };
}

// ── Revenue / open-opportunities chart ───────────────────────────────────────

function buildBuckets(start: Date, end: Date, granularity: ChartGranularity) {
  if (granularity === "weekly") {
    return eachWeekOfInterval({ start, end }).map((d) => ({
      label: format(d, "MMM d"),
      bucketStart: startOfWeek(d) < start ? start : startOfWeek(d),
      bucketEnd: endOfWeek(d) > end ? end : endOfWeek(d),
    }));
  }
  if (granularity === "daily") {
    return eachDayOfInterval({ start, end }).map((d) => ({
      label: format(d, "MMM d"),
      bucketStart: startOfDay(d),
      bucketEnd: endOfDay(d),
    }));
  }
  return eachMonthOfInterval({ start, end }).map((d) => ({
    label: format(d, "MMM"),
    bucketStart: startOfMonth(d) < start ? start : startOfMonth(d),
    bucketEnd: endOfMonth(d) > end ? end : endOfMonth(d),
  }));
}

export async function getRevenueChart(
  input: DashboardDateRangeInput & { granularity?: ChartGranularity },
): Promise<DashboardActionResult<{ chart: ChartPoint[] }>> {
  const gate = await requirePermission("dashboard:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: statusFor(gate.reason) };

  const { start, end } = resolveDateRange(input);
  const granularity = input.granularity ?? "monthly";

  const scope = await opportunityScope(gate.profile);
  const [rows, liveRate] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        AND: [
          scope,
          {
            OR: [
              { createdAt: { gte: start, lte: end } },
              { updatedAt: { gte: start, lte: end } },
              { closedAt: { gte: start, lte: end } },
            ],
          },
        ],
      },
      select: {
        status: true,
        dealSize: true,
        commission: true,
        commissionUnit: true,
        agentCommissionValue: true,
        agentCommissionUnit: true,
        currency: true,
        exchangeRate: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
      },
    }),
    getDolarBlueVenta(),
  ]);

  const chart: ChartPoint[] = buildBuckets(start, end, granularity).map(({ label, bucketStart, bucketEnd }) => {
    // Both series are revenue (resolved company commission, USD-normalized),
    // not deal size. CLOSED_WON buckets on closedAt (when the rate locked).
    const wonInBucket = rows.filter(
      (o) =>
        o.status === OpportunityStatus.CLOSED_WON &&
        (o.closedAt ?? o.updatedAt) >= bucketStart &&
        (o.closedAt ?? o.updatedAt) <= bucketEnd,
    );
    const revenue = wonInBucket.reduce((s, o) => s + (resolveCompanyRevenueUsd(o, liveRate) ?? 0), 0);
    const revenueNet = wonInBucket.reduce((s, o) => s + (resolveNetCompanyRevenueUsd(o, liveRate) ?? 0), 0);
    const openOpportunities = rows
      .filter((o) => o.status === OpportunityStatus.OPEN && o.createdAt >= bucketStart && o.createdAt <= bucketEnd)
      .reduce((s, o) => s + (resolveCompanyRevenueUsd(o, liveRate) ?? 0), 0);
    return {
      label,
      legacyDateCount: wonInBucket.filter((o) => !o.closedAt).length,
      revenue: Math.round(revenue),
      revenueNet: Math.round(revenueNet),
      openOpportunities: Math.round(openOpportunities),
    };
  });

  return { ok: true, chart };
}

// ── Total sales by agent ──────────────────────────────────────────────────────

const OPERATION_LABEL: Record<string, SaleOperation> = {
  [PropertyOperationType.SALE]: "Sale",
  [PropertyOperationType.RENT]: "Rent",
  [PropertyOperationType.SALE_AND_RENT]: "Sale & Rent",
};

export async function getSalesByAgent(
  input: DashboardDateRangeInput,
): Promise<DashboardActionResult<{ sales: SaleRow[] }>> {
  const gate = await requirePermission("dashboard:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: statusFor(gate.reason) };

  const { start, end } = resolveDateRange(input);

  const scope = await opportunityScope(gate.profile);
  const [rows, liveRate] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        AND: [scope, { status: OpportunityStatus.CLOSED_WON }, { OR: [{ closedAt: { gte: start, lte: end } }, { closedAt: null, updatedAt: { gte: start, lte: end } }] }],
      },
      select: {
        opportunityId: true,
        dealSize: true,
        commission: true,
        commissionUnit: true,
        currency: true,
        exchangeRate: true,
        updatedAt: true,
        closedAt: true,
        assignedAgentId: true,
        dealType: true,
        listings: { take: 1, select: { property: { select: { listingId: true, operationType: true } } } },
      },
      orderBy: { closedAt: "desc" },
    }),
    getDolarBlueVenta(),
  ]);

  const agentIds = [...new Set(rows.map((r) => r.assignedAgentId).filter((id): id is string => Boolean(id)))];
  const agents = agentIds.length
    ? await prisma.profile.findMany({ where: { id: { in: agentIds } }, select: { id: true, fullName: true, email: true } })
    : [];
  const agentById = new Map(agents.map((a) => [a.id, a]));

  const sales: SaleRow[] = rows.map((r) => {
    const agent = r.assignedAgentId ? agentById.get(r.assignedAgentId) : undefined;
    const property = r.listings[0]?.property;
    return {
      opportunityId: r.opportunityId,
      agentId: r.assignedAgentId,
      agentName: agent ? agent.fullName ?? agent.email.split("@")[0] : "Unassigned",
      listingId: property?.listingId ?? null,
      // The opportunity's own deal type (chosen at creation) is authoritative —
      // a "Sale & Rent" listing can still close as just a Sale or just a Rent.
      // Only fall back to the listing's operation type for legacy opportunities
      // created before dealType existed.
      operation:
        r.dealType === "Rent" || r.dealType === "Sale"
          ? r.dealType
          : OPERATION_LABEL[property?.operationType ?? PropertyOperationType.SALE],
      date: (r.closedAt ?? r.updatedAt).toISOString(),
      revenue: resolveCompanyRevenueUsd(r, liveRate) ?? 0,
    };
  });

  return { ok: true, sales };
}

// ── Locations with listings ───────────────────────────────────────────────────
// Deliberately bypasses listLocationsWithStats() (gated by "locations:view",
// which AGENT doesn't hold) — this widget only needs a live property count per
// location and must stay visible to every dashboard role.

export async function getLocationSummary(): Promise<DashboardActionResult<{ locations: LocationRow[] }>> {
  const gate = await requirePermission("dashboard:view");
  if (!gate.ok) return { ok: false, error: gate.error, status: statusFor(gate.reason) };

  const locations = await prisma.location.findMany({ select: { id: true, name: true } });
  if (locations.length === 0) return { ok: true, locations: [] };

  const properties = await prisma.property.findMany({
    where: { locationId: { not: null }, status: PropertyStatus.ACTIVE },
    select: { locationId: true },
  });

  const counts = new Map<string, number>();
  for (const p of properties) {
    if (!p.locationId) continue;
    counts.set(p.locationId, (counts.get(p.locationId) ?? 0) + 1);
  }

  const rows: LocationRow[] = locations
    .map((loc) => ({ name: loc.name, count: counts.get(loc.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return { ok: true, locations: rows };
}
