"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { LocationDto } from "@/features/locations/types/location-dto";

async function postLocation(body: unknown): Promise<{ location: LocationDto }> {
  const res = await fetch("/api/dashboard/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create location");
  return data;
}

export function useCreateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations() });
      qc.invalidateQueries({ queryKey: queryKeys.locationNameSuggestions() });
    },
  });
}

async function patchLocation({ id, body }: { id: string; body: unknown }): Promise<{ location: LocationDto }> {
  const res = await fetch(`/api/dashboard/locations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update location");
  return data;
}

export function useUpdateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations() });
      qc.invalidateQueries({ queryKey: queryKeys.locationNameSuggestions() });
    },
  });
}

async function deleteLocationReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/locations/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete location");
  return data;
}

export function useDeleteLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLocationReq,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.locations() });
      qc.invalidateQueries({ queryKey: queryKeys.locationNameSuggestions() });
    },
  });
}
