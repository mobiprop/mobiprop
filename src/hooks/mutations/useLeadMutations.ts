import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { CreateLeadInput, UpdateLeadInput, AssignLeadInput, AddLeadNoteInput, LinkLeadConversionInput } from "@/schemas/lead.schema";

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const res = await fetch("/api/dashboard/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create lead");
      return json.lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadMetrics() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
    },
  });
}

// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateLeadMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateLeadInput) => {
      const res = await fetch(`/api/dashboard/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update lead");
      return json.lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadMetrics() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
    },
  });
}

// ── Assign ────────────────────────────────────────────────────────────────────

export function useAssignLeadMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignLeadInput) => {
      const res = await fetch(`/api/dashboard/leads/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to assign lead");
      return json.lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadActivities(id) });
      qc.invalidateQueries({ queryKey: queryKeys.agents() });
    },
  });
}

// ── Add Note ──────────────────────────────────────────────────────────────────

export function useAddLeadNoteMutation(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddLeadNoteInput) => {
      const res = await fetch(`/api/dashboard/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add note");
      return json.note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadNotes(leadId) });
      qc.invalidateQueries({ queryKey: queryKeys.leadActivities(leadId) });
    },
  });
}

// ── Archive ───────────────────────────────────────────────────────────────────

export function useArchiveLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/leads/${id}/archive`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to archive lead");
      return json.lead;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leadMetrics() });
    },
  });
}

// ── Restore ───────────────────────────────────────────────────────────────────

export function useRestoreLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/leads/${id}/restore`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to restore lead");
      return json.lead;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leadMetrics() });
    },
  });
}

// ── Convert ───────────────────────────────────────────────────────────────────

export function useConvertLeadMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LinkLeadConversionInput) => {
      const res = await fetch(`/api/dashboard/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to convert lead");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
      qc.invalidateQueries({ queryKey: queryKeys.leadMetrics() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardMetrics() });
    },
  });
}
