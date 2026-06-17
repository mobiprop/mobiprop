import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type {
  CreateTourInput,
  UpdateTourInput,
  UpdateTourStatusInput,
  AssignTourInput,
  RequestTourInput,
} from "@/schemas/tour.schema";

// ── Create (dashboard) ────────────────────────────────────────────────────────

export function useCreateTourMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTourInput) => {
      const res = await fetch("/api/dashboard/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create tour");
      return json.tour;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
      qc.invalidateQueries({ queryKey: queryKeys.tourMetrics() });
    },
  });
}

// ── Update (dashboard) ────────────────────────────────────────────────────────

export function useUpdateTourMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTourInput) => {
      const res = await fetch(`/api/dashboard/tours/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update tour");
      return json.tour;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tourDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
    },
  });
}

// ── Status transition ─────────────────────────────────────────────────────────

export function useUpdateTourStatusMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTourStatusInput) => {
      const res = await fetch(`/api/dashboard/tours/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update tour status");
      return json.tour;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tourDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
      qc.invalidateQueries({ queryKey: queryKeys.tourMetrics() });
    },
  });
}

// ── Assign agent ──────────────────────────────────────────────────────────────

export function useAssignTourAgentMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignTourInput) => {
      const res = await fetch(`/api/dashboard/tours/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to assign agent");
      return json.tour;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tourDetail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
    },
  });
}

// ── Public tour request (listing page, no auth needed) ────────────────────────

export function useRequestTourMutation() {
  return useMutation({
    mutationFn: async (input: RequestTourInput) => {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit tour request");
      return json.tour as { id: string; tourNumber: string; scheduledAt: string };
    },
  });
}

// ── Public user cancel their own tour ─────────────────────────────────────────

export function useCancelMyTourMutation(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tourId: string) => {
      const res = await fetch(`/api/tours/${tourId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to cancel tour");
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: queryKeys.scheduledTours(userId) });
    },
  });
}
