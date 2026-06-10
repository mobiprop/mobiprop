import { notFound } from "next/navigation";

// Catches any unmatched /dashboard/* route and triggers the dashboard's
// not-found.tsx (rendered inside the dashboard shell) instead of the
// root not-found page.
export default function DashboardCatchAll(): never {
  notFound();
}
