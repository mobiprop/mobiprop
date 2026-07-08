import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { DocusignEnvelopeDto, EnvelopeStats, DocusignSettingsDto } from "@/features/integrations/docusign-actions";
import type { DocusignTemplateSummary } from "@/lib/docusign";
import type { DocusignConfigStatus } from "@/lib/docusign";

async function fetchEnvelopes(): Promise<{ envelopes: DocusignEnvelopeDto[]; stats: EnvelopeStats }> {
  const res = await fetch("/api/dashboard/docusign/envelopes");
  if (!res.ok) throw new Error("Failed to fetch envelopes");
  return res.json();
}

export function useDocusignEnvelopesQuery() {
  return useQuery({
    queryKey: queryKeys.docusignEnvelopes(),
    queryFn: fetchEnvelopes,
    staleTime: 30_000,
  });
}

async function fetchTemplates(): Promise<{ templates: DocusignTemplateSummary[]; usedCounts: Record<string, number> }> {
  const res = await fetch("/api/dashboard/docusign/templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export function useDocusignTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.docusignTemplates(),
    queryFn: fetchTemplates,
    staleTime: 60_000,
  });
}

async function fetchSettings(): Promise<{ settings: DocusignSettingsDto }> {
  const res = await fetch("/api/dashboard/docusign/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export function useDocusignSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.docusignSettings(),
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}

async function fetchStatus(): Promise<{ connected: boolean; config: DocusignConfigStatus }> {
  const res = await fetch("/api/dashboard/docusign/status");
  if (!res.ok) throw new Error("Failed to fetch DocuSign status");
  return res.json();
}

export function useDocusignStatusQuery() {
  return useQuery({
    queryKey: queryKeys.docusignStatus(),
    queryFn: fetchStatus,
    staleTime: 60_000,
  });
}
