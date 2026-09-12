import type { Currency } from "@/generated/prisma/enums";

/**
 * Resolves a commission entry (amount + unit) against a deal size into a
 * concrete dollar figure — "7% of a $500,000 deal" becomes $35,000, while a
 * "$" unit is already a concrete amount. Shared by the server (revenue/agent
 * earnings rollups) and the client (live preview while editing a form) so
 * both sides agree on the math.
 */
export function computeCommissionAmount(
  dealSize: number | null | undefined,
  commission: number | null | undefined,
  unit: string | null | undefined,
): number | null {
  if (commission === null || commission === undefined) return null;
  if (unit === "%") {
    if (!dealSize) return null;
    return (dealSize * commission) / 100;
  }
  return commission;
}

// Prisma returns Decimal columns as Decimal objects; Number() coerces them
// (and plain numbers) to a number, or null when the column is unset.
const toNum = (d: unknown): number | null => (d === null || d === undefined ? null : Number(d));

/**
 * Company revenue ($) for one opportunity — the "Commission Amount" resolved
 * against the deal size (`% of deal size` or a flat `$`). 0 when unset. This is
 * what "revenue" means everywhere in the dashboard: the brokerage's commission,
 * NOT the full deal size.
 */
export function resolveCompanyRevenue(o: {
  dealSize: unknown;
  commission: unknown;
  commissionUnit: string | null;
  agencyCommissionTotal?: unknown;
}): number {
  return Math.max(0, (computeCommissionAmount(toNum(o.dealSize), toNum(o.commission), o.commissionUnit) ?? 0) - (toNum(o.agencyCommissionTotal) ?? 0));
}

/**
 * The agent's personal earnings ($) for one opportunity — the "Agent
 * Commission" resolved against the *company commission amount* (not the full
 * deal size). 0 when unset. Feeds the agent's "Mi Comisión" card and their
 * profile's Total Earnings.
 *
 * Math: agentCommission% of companyRevenue (e.g. 20% of $56k = $11,200,
 * NOT 20% of the $800k deal size).
 */
export function resolveAgentEarnings(o: {
  dealSize: unknown;
  commission: unknown;
  commissionUnit: string | null;
  agencyCommissionTotal?: unknown;
  agentCommissionValue: unknown;
  agentCommissionUnit: string | null;
}): number {
  const companyRevenue = resolveCompanyRevenue(o);
  return computeCommissionAmount(companyRevenue || null, toNum(o.agentCommissionValue), o.agentCommissionUnit) ?? 0;
}

/**
 * Net company revenue ($) for one opportunity — the resolved company
 * commission (gross, see resolveCompanyRevenue) minus whatever cut goes to
 * the agent (resolveAgentEarnings). This is what the company actually keeps.
 */
export function resolveNetCompanyRevenue(o: {
  dealSize: unknown;
  commission: unknown;
  commissionUnit: string | null;
  agencyCommissionTotal?: unknown;
  agentCommissionValue: unknown;
  agentCommissionUnit: string | null;
}): number {
  return resolveCompanyRevenue(o) - resolveAgentEarnings(o);
}

// ── USD-normalized dashboard figures ────────────────────────────────────────
// Every dashboard rollup must stay USD-only, even though individual deals can
// be entered in ARS. USD amounts pass through unchanged. ARS amounts convert
// using the deal's own frozen `exchangeRate` (set once, at the moment it was
// marked CLOSED_WON) when present, or the caller-supplied `liveRate` (a
// same-request snapshot of today's rate) for ARS deals that are still OPEN
// and haven't locked a rate yet. Returns null when neither is available —
// callers must exclude that figure from a sum rather than guess.

export function toUsd(amountNative: number, currency: Currency, rate: number | null): number | null {
  if (currency === "USD") return amountNative;
  if (!rate) return null;
  return amountNative / rate;
}

function resolveRate(o: { currency: Currency; exchangeRate: unknown }, liveRate: number | null): number | null {
  return toNum(o.exchangeRate) ?? liveRate;
}

export function resolveCompanyRevenueUsd(
  o: {
    dealSize: unknown;
    commission: unknown;
    commissionUnit: string | null;
    agencyCommissionTotal?: unknown;
    currency: Currency;
    exchangeRate: unknown;
  },
  liveRate: number | null,
): number | null {
  return toUsd(resolveCompanyRevenue(o), o.currency, resolveRate(o, liveRate));
}

export function resolveAgentEarningsUsd(
  o: {
    dealSize: unknown;
    commission: unknown;
    commissionUnit: string | null;
    agencyCommissionTotal?: unknown;
    agentCommissionValue: unknown;
    agentCommissionUnit: string | null;
    currency: Currency;
    exchangeRate: unknown;
  },
  liveRate: number | null,
): number | null {
  return toUsd(resolveAgentEarnings(o), o.currency, resolveRate(o, liveRate));
}

export function resolveNetCompanyRevenueUsd(
  o: {
    dealSize: unknown;
    commission: unknown;
    commissionUnit: string | null;
    agencyCommissionTotal?: unknown;
    agentCommissionValue: unknown;
    agentCommissionUnit: string | null;
    currency: Currency;
    exchangeRate: unknown;
  },
  liveRate: number | null,
): number | null {
  return toUsd(resolveNetCompanyRevenue(o), o.currency, resolveRate(o, liveRate));
}

/** Each percentage is applied to the same total commission, never sequentially. */
export function calculateAgencyCommission(total: number, participants: { role: string; commissionValue?: unknown; commissionUnit?: string | null }[]): number {
  const amount = participants.filter(p => p.role === "AGENCY").reduce((sum, p) => sum + (computeCommissionAmount(total, Number(p.commissionValue ?? 0), p.commissionUnit ?? "%") ?? 0), 0);
  if (!Number.isFinite(amount) || amount < 0 || amount > total + 0.005) throw new Error("La comisión de las inmobiliarias no puede superar la comisión total.");
  return Math.round(amount * 100) / 100;
}
