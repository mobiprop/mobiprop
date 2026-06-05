// Number / date formatters

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(date));
}
