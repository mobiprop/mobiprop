"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type {
  EmailCampaignDto,
  EmailListDto,
  EmailRecipientDto,
  ImportPreview,
  ImportRow,
  SendgridSettingsDto,
} from "@/features/integrations/sendgrid-actions";
import type { SendgridConnectionInfo } from "@/lib/sendgrid-marketing";

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined
      ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function useInvalidate() {
  const qc = useQueryClient();
  return {
    lists: () => qc.invalidateQueries({ queryKey: queryKeys.sendgridLists() }),
    campaigns: () => qc.invalidateQueries({ queryKey: queryKeys.sendgridCampaigns() }),
    overview: () => qc.invalidateQueries({ queryKey: queryKeys.sendgridOverview() }),
    settings: () => qc.invalidateQueries({ queryKey: queryKeys.sendgridSettings() }),
  };
}

// ── Lists ────────────────────────────────────────────────────────────────────

export function useCreateListMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; doubleOptIn?: boolean }) =>
      request<{ list: EmailListDto }>("/api/dashboard/sendgrid/lists", "POST", input),
    onSuccess: () => Promise.all([inv.lists(), inv.overview()]),
  });
}

export function useUpdateListMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; description?: string | null; doubleOptIn?: boolean }) =>
      request<{ list: EmailListDto }>(`/api/dashboard/sendgrid/lists/${id}`, "PATCH", input),
    onSuccess: () => inv.lists(),
  });
}

export function useDeleteListMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => request<object>(`/api/dashboard/sendgrid/lists/${id}`, "DELETE"),
    onSuccess: () => Promise.all([inv.lists(), inv.overview()]),
  });
}

// ── Members ──────────────────────────────────────────────────────────────────

export function useAddMemberMutation() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ listId, ...input }: { listId: string; email: string; firstName?: string; lastName?: string; phone?: string }) =>
      request<{ member: EmailRecipientDto }>(`/api/dashboard/sendgrid/lists/${listId}/members`, "POST", input),
    onSuccess: (_data, { listId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["sendgrid-lists", "members", listId] }),
        inv.lists(),
        inv.overview(),
      ]),
  });
}

export function useAddMembersFromCrmMutation() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ listId, contactIds }: { listId: string; contactIds: string[] }) =>
      request<{ added: number; skippedNoEmail: number }>(
        `/api/dashboard/sendgrid/lists/${listId}/members`,
        "POST",
        { contactIds },
      ),
    onSuccess: (_data, { listId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["sendgrid-lists", "members", listId] }),
        inv.lists(),
        inv.overview(),
      ]),
  });
}

export function useRemoveMemberMutation() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ listId, recipientId }: { listId: string; recipientId: string }) =>
      request<object>(`/api/dashboard/sendgrid/lists/${listId}/members`, "DELETE", { recipientId }),
    onSuccess: (_data, { listId }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["sendgrid-lists", "members", listId] }),
        inv.lists(),
        inv.overview(),
      ]),
  });
}

// ── Import ───────────────────────────────────────────────────────────────────

export function usePreviewImportMutation() {
  return useMutation({
    mutationFn: (input: { listId: string; rows: ImportRow[] }) =>
      request<{ preview: ImportPreview }>("/api/dashboard/sendgrid/lists/import/preview", "POST", input),
  });
}

export function useCommitImportMutation() {
  const qc = useQueryClient();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      listId: string;
      rows: ImportRow[];
      duplicateMode: "update" | "skip";
      skipUnsubscribed: boolean;
      method: "csv" | "paste";
    }) =>
      request<{ imported: number; updated: number; skipped: number; invalid: number }>(
        "/api/dashboard/sendgrid/lists/import/commit",
        "POST",
        input,
      ),
    onSuccess: () =>
      Promise.all([
        inv.lists(),
        inv.overview(),
        qc.invalidateQueries({ queryKey: ["sendgrid-lists", "members"] }),
      ]),
  });
}

// ── Campaigns ────────────────────────────────────────────────────────────────

type CampaignInput = {
  name?: string;
  subject?: string;
  previewText?: string | null;
  fromName?: string;
  htmlBody?: string;
  templateKey?: string | null;
  listId?: string | null;
};

export function useCreateCampaignMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: CampaignInput) =>
      request<{ campaign: EmailCampaignDto }>("/api/dashboard/sendgrid/campaigns", "POST", input),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

export function useUpdateCampaignMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & CampaignInput) =>
      request<{ campaign: EmailCampaignDto }>(`/api/dashboard/sendgrid/campaigns/${id}`, "PATCH", input),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

export function useDuplicateCampaignMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ campaign: EmailCampaignDto }>(`/api/dashboard/sendgrid/campaigns/${id}/duplicate`, "POST"),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

export function useDeleteCampaignMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => request<object>(`/api/dashboard/sendgrid/campaigns/${id}`, "DELETE"),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

export function useSendTestEmailMutation() {
  return useMutation({
    mutationFn: ({ id, emails }: { id: string; emails: string[] }) =>
      request<{ sentTo: string[] }>(`/api/dashboard/sendgrid/campaigns/${id}/test`, "POST", { emails }),
  });
}

export function useSendCampaignMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, scheduleAt }: { id: string; scheduleAt?: string }) =>
      request<{ status: string; totalRecipients: number }>(
        `/api/dashboard/sendgrid/campaigns/${id}/send`,
        "POST",
        scheduleAt ? { scheduleAt } : {},
      ),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

export function useCancelScheduleMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => request<object>(`/api/dashboard/sendgrid/campaigns/${id}/cancel-schedule`, "POST"),
    onSuccess: () => Promise.all([inv.campaigns(), inv.overview()]),
  });
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function useUpdateSendgridSettingsMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: { defaultFromName?: string; clickTracking?: boolean; openTracking?: boolean; sandboxMode?: boolean }) =>
      request<{ settings: SendgridSettingsDto }>("/api/dashboard/sendgrid/settings", "PATCH", input),
    onSuccess: () => inv.settings(),
  });
}

export function useTestConnectionMutation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: () => request<{ connection: SendgridConnectionInfo }>("/api/dashboard/sendgrid/settings/test", "POST"),
    onSuccess: () => inv.settings(),
  });
}
