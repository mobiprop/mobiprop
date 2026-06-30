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
