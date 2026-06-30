import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { GoogleCalendarStatus } from "@/features/dashboard/calendar-integration-actions";

async function fetchGoogleCalendarStatus(): Promise<{ success: boolean; status: GoogleCalendarStatus }> {
  const response = await fetch("/api/integrations/google-calendar/status");
  if (!response.ok) throw new Error("Failed to fetch Google Calendar status");
  return response.json();
}

export function useGoogleCalendarStatusQuery() {
  return useQuery({
    queryKey: queryKeys.googleCalendarStatus(),
    queryFn: fetchGoogleCalendarStatus,
    staleTime: 30_000,
  });
}
