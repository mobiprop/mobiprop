import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { LeadDto, LeadMetrics, LeadNoteDto, LeadActivityDto } from "@/features/crm/types/crm-dto";
import type { LeadListFilters } from "@/schemas/lead.schema";

// ── Leads list ────────────────────────────────────────────────────────────────

async function fetchLeads(filters: Partial<LeadListFilters>): Promise<{
  leads: LeadDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const res = await fetch(`/api/dashboard/leads?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  const json = await res.json();
  return { leads: json.leads, total: json.total, page: json.page, limit: json.limit };
}

export function useDashboardLeadsQuery(filters: Partial<LeadListFilters> = {}) {
  return useQuery({
    queryKey: queryKeys.leads(filters),
    queryFn: () => fetchLeads(filters),
    staleTime: 30_000,
  });
}

// ── Lead metrics ──────────────────────────────────────────────────────────────

async function fetchLeadMetrics(): Promise<LeadMetrics> {
  const res = await fetch("/api/dashboard/leads/metrics");
  if (!res.ok) throw new Error("Failed to fetch lead metrics");
  const json = await res.json();
  return json.metrics;
}

export function useLeadMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.leadMetrics(),
    queryFn: fetchLeadMetrics,
    staleTime: 60_000,
  });
}

// ── Lead detail ───────────────────────────────────────────────────────────────

async function fetchLeadDetail(id: string): Promise<LeadDto> {
  const res = await fetch(`/api/dashboard/leads/${id}`);
  if (!res.ok) throw new Error("Failed to fetch lead");
  const json = await res.json();
  return json.lead;
}

export function useLeadDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.leadDetail(id),
    queryFn: () => fetchLeadDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Lead notes ────────────────────────────────────────────────────────────────

async function fetchLeadNotes(id: string): Promise<LeadNoteDto[]> {
  const res = await fetch(`/api/dashboard/leads/${id}/notes`);
  if (!res.ok) throw new Error("Failed to fetch lead notes");
  const json = await res.json();
  return json.notes;
}

export function useLeadNotesQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.leadNotes(id),
    queryFn: () => fetchLeadNotes(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Lead activities ───────────────────────────────────────────────────────────

async function fetchLeadActivities(id: string): Promise<LeadActivityDto[]> {
  const res = await fetch(`/api/dashboard/leads/${id}/activities`);
  if (!res.ok) throw new Error("Failed to fetch lead activities");
  const json = await res.json();
  return json.activities;
}

export function useLeadActivitiesQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.leadActivities(id),
    queryFn: () => fetchLeadActivities(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
