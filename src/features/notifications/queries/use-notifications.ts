"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  dismissNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/features/dashboard/notification-actions";
import { queryKeys } from "@/lib/query-keys";

/**
 * In-app notification server-state. The list/count come from recipient-scoped
 * server actions (Prisma) — the source of truth — and Supabase Realtime only
 * invalidates these keys (see use-notifications-realtime). Mutations invalidate
 * rather than patch, which keeps Realtime INSERT/UPDATE from duplicating state.
 */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: async (): Promise<NotificationItem[]> => {
      const result = await getMyNotifications();
      if (!result.ok) throw new Error(result.error);
      return result.notifications;
    },
    staleTime: 30_000,
  });
}

export function useUnreadCountQuery() {
  return useQuery({
    queryKey: queryKeys.unreadNotificationsCount(),
    queryFn: async (): Promise<number> => {
      const result = await getUnreadNotificationCount();
      return result.count;
    },
    staleTime: 30_000,
  });
}

function useNotificationInvalidator() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationsCount() });
  };
}

export function useMarkNotificationReadMutation() {
  const invalidate = useNotificationInvalidator();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
}

export function useDismissNotificationMutation() {
  const invalidate = useNotificationInvalidator();
  return useMutation({
    mutationFn: (id: string) => dismissNotification(id),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsReadMutation() {
  const invalidate = useNotificationInvalidator();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });
}
