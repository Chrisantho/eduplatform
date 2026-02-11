import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, type Notification } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: [API_PATHS.notifications.list],
    queryFn: async () => {
      const res = await fetch(API_PATHS.notifications.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: [API_PATHS.notifications.unreadCount],
    queryFn: async () => {
      const res = await fetch(API_PATHS.notifications.unreadCount, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", API_PATHS.notifications.markRead(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.notifications.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.notifications.unreadCount] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", API_PATHS.notifications.markAllRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.notifications.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.notifications.unreadCount] });
    },
  });
}
