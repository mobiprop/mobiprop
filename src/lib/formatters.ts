// Number / date formatters

// Grouping only — the currency code is prefixed separately below so both
// USD and ARS always read unambiguously (e.g. "ARS $900.000" / "USD $900,000"),
// matching the pattern in src/features/listings/utils/format.ts. Left to
// Intl's own currency formatting, symbol placement isn't guaranteed to
// prefix consistently across currencies.
const GROUP_FORMATTERS: Record<string, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
  ARS: new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }),
};

export function formatCurrency(value: number, currency = "USD"): string {
  const formatter = GROUP_FORMATTERS[currency] ?? GROUP_FORMATTERS.USD;
  return `${currency} $${formatter.format(value)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(date));
}
