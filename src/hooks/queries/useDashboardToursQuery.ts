import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { TourDto, TourMetrics, MyTourDto } from "@/features/crm/types/crm-dto";
import type { TourListFilters } from "@/schemas/tour.schema";

// ── Tours list ────────────────────────────────────────────────────────────────

async function fetchTours(filters: Partial<TourListFilters>): Promise<{
  tours: TourDto[];
  total: number;
  page: number;
  limit: number;
}> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const res = await fetch(`/api/dashboard/tours?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tours");
  const json = await res.json();
  return { tours: json.tours, total: json.total, page: json.page, limit: json.limit };
}

export function useDashboardToursQuery(filters: Partial<TourListFilters> = {}) {
  return useQuery({
    queryKey: queryKeys.tours(filters),
    queryFn: () => fetchTours(filters),
    staleTime: 30_000,
  });
}

// ── Tour metrics ──────────────────────────────────────────────────────────────

async function fetchTourMetrics(): Promise<TourMetrics> {
  const res = await fetch("/api/dashboard/tours/metrics");
  if (!res.ok) throw new Error("Failed to fetch tour metrics");
  const json = await res.json();
  return json.metrics;
}

export function useTourMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.tourMetrics(),
    queryFn: fetchTourMetrics,
    staleTime: 60_000,
  });
}

// ── Tour detail ───────────────────────────────────────────────────────────────

async function fetchTourDetail(id: string): Promise<TourDto> {
  const res = await fetch(`/api/dashboard/tours/${id}`);
  if (!res.ok) throw new Error("Failed to fetch tour");
  const json = await res.json();
  return json.tour;
}

export function useTourDetailQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.tourDetail(id),
    queryFn: () => fetchTourDetail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── My tours (public user account) ───────────────────────────────────────────

async function fetchMyTours(): Promise<MyTourDto[]> {
  const res = await fetch("/api/tours/mine");
  if (!res.ok) throw new Error("Failed to fetch your tours");
  const json = await res.json();
  return json.tours;
}

export function useMyToursQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.scheduledTours(userId ?? ""),
    queryFn: fetchMyTours,
    enabled: !!userId,
    staleTime: 60_000,
  });
}
