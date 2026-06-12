import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

// ── Types ───────────────────────────────────────────────────────────
type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLoginMutation>;
  register: ReturnType<typeof useRegisterMutation>;
  logout: ReturnType<typeof useLogoutMutation>;
};

// ── Mutations ───────────────────────────────────────────────────────
function useLoginMutation() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });
}

function useRegisterMutation() {
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name?: string;
    }) => {
      const res = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });
}

function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
    },
  });
}

// ── Context ─────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const login = useLoginMutation();
  const register = useRegisterMutation();
  const logout = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
