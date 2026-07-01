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
}): number {
  return computeCommissionAmount(toNum(o.dealSize), toNum(o.commission), o.commissionUnit) ?? 0;
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
  agentCommissionValue: unknown;
  agentCommissionUnit: string | null;
}): number {
  const companyRevenue = resolveCompanyRevenue(o);
  return computeCommissionAmount(companyRevenue || null, toNum(o.agentCommissionValue), o.agentCommissionUnit) ?? 0;
}
