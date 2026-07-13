import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type {
  EmailCampaignDto,
  EmailListDto,
  EmailRecipientDto,
  SendgridOverviewDto,
  SendgridSettingsDto,
} from "@/features/integrations/sendgrid-actions";
import type { SendgridConfigStatus } from "@/lib/sendgrid-marketing";

async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errorMessage);
  return res.json();
}

export function useSendgridStatusQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sendgridStatus(),
    queryFn: () =>
      fetchJson<{ connected: boolean; config: SendgridConfigStatus }>(
        "/api/dashboard/sendgrid/status",
        "Failed to fetch SendGrid status",
      ),
    enabled,
    staleTime: 60_000,
  });
}

export function useSendgridOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.sendgridOverview(),
    queryFn: () =>
      fetchJson<{ overview: SendgridOverviewDto }>(
        "/api/dashboard/sendgrid/overview",
        "Failed to fetch SendGrid overview",
      ),
    staleTime: 30_000,
  });
}

export function useSendgridListsQuery() {
  return useQuery({
    queryKey: queryKeys.sendgridLists(),
    queryFn: () =>
      fetchJson<{ lists: EmailListDto[] }>("/api/dashboard/sendgrid/lists", "Failed to fetch contact lists"),
    staleTime: 30_000,
  });
}

export function useSendgridListMembersQuery(listId: string | null, search: string) {
  return useQuery({
    queryKey: queryKeys.sendgridListMembers(listId ?? "", search),
    queryFn: () =>
      fetchJson<{ members: EmailRecipientDto[]; listName: string }>(
        `/api/dashboard/sendgrid/lists/${listId}/members?search=${encodeURIComponent(search)}`,
        "Failed to fetch list members",
      ),
    enabled: Boolean(listId),
    staleTime: 15_000,
  });
}

export function useSendgridCampaignsQuery() {
  return useQuery({
    queryKey: queryKeys.sendgridCampaigns(),
    queryFn: () =>
      fetchJson<{ campaigns: EmailCampaignDto[] }>(
        "/api/dashboard/sendgrid/campaigns",
        "Failed to fetch campaigns",
      ),
    staleTime: 30_000,
  });
}

export function useSendgridSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sendgridSettings(),
    queryFn: () =>
      fetchJson<{ settings: SendgridSettingsDto }>(
        "/api/dashboard/sendgrid/settings",
        "Failed to fetch SendGrid settings",
      ),
    enabled,
    staleTime: 60_000,
  });
}
