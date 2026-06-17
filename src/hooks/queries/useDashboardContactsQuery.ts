import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ContactDto, ContactMetrics } from "@/features/crm/types/crm-dto";

async function fetchContacts(): Promise<{ contacts: ContactDto[]; metrics: ContactMetrics }> {
  const res = await fetch("/api/dashboard/contacts");
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

export function useDashboardContactsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardContacts(),
    queryFn: fetchContacts,
    staleTime: 60_000,
  });
}
