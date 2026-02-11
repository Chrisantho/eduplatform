import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, type User } from "@/lib/api";
import { useLocation } from "wouter";

export function useUser() {
  return useQuery<User | null>({
    queryKey: [API_PATHS.auth.me],
    queryFn: async () => {
      const res = await fetch(API_PATHS.auth.me, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch(API_PATHS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        const errorText = await res.text().catch(() => "");
        throw new Error(`Login failed (${res.status}): ${errorText || "Please try again"}`);
      }

      return (await res.json()) as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([API_PATHS.auth.me], user);
      if (user.role === "ADMIN") {
        setLocation("/admin");
      } else {
        setLocation("/student");
      }
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: { username: string; password: string; fullName: string; email?: string; role?: string }) => {
      const res = await fetch(API_PATHS.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Registration failed");
      }

      return (await res.json()) as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([API_PATHS.auth.me], user);
      if (user.role === "ADMIN") {
        setLocation("/admin");
      } else {
        setLocation("/student");
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      await fetch(API_PATHS.auth.logout, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData([API_PATHS.auth.me], null);
      setLocation("/");
    },
  });
}
