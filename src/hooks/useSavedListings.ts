"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

type AuthState = { userId: string | null; checked: boolean };

function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ userId: null, checked: false });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setState({ userId: data.user?.id ?? null, checked: true });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ userId: session?.user?.id ?? null, checked: true });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return state;
}

/** Manages the saved/favorite state for listings across the public site. */
export function useSavedListings() {
  const { userId, checked } = useAuthState();
  const queryClient = useQueryClient();
  const queryKey = queryKeys.savedListings(userId ?? "");

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/saved-listings");
      if (!res.ok) return { savedIds: [] as string[] };
      return res.json() as Promise<{ savedIds: string[] }>;
    },
    enabled: checked && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const savedSet = new Set(data?.savedIds ?? []);

  const saveMutation = useMutation({
    mutationFn: (propertyId: string) =>
      fetch("/api/saved-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      }),
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ savedIds: string[] }>(queryKey);
      queryClient.setQueryData<{ savedIds: string[] }>(queryKey, (old) => ({
        savedIds: [...(old?.savedIds ?? []), propertyId],
      }));
      return { previous };
    },
    onError: (_err, _propertyId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) =>
      fetch(`/api/saved-listings/${propertyId}`, { method: "DELETE" }),
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ savedIds: string[] }>(queryKey);
      queryClient.setQueryData<{ savedIds: string[] }>(queryKey, (old) => ({
        savedIds: (old?.savedIds ?? []).filter((id) => id !== propertyId),
      }));
      return { previous };
    },
    onError: (_err, _propertyId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const isSaved = useCallback(
    (propertyId: string) => savedSet.has(propertyId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.savedIds],
  );

  const toggleSave = useCallback(
    (propertyId: string, onUnauth?: () => void) => {
      if (!userId) {
        onUnauth?.();
        return;
      }
      if (savedSet.has(propertyId)) {
        unsaveMutation.mutate(propertyId);
      } else {
        saveMutation.mutate(propertyId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, data?.savedIds],
  );

  return {
    isSaved,
    toggleSave,
    isLoggedIn: !!userId,
    authChecked: checked,
  };
}
