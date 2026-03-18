import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";

export type AuthUser = {
  id: string;
  email: string;
  businessName: string;
};

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated"; token: null; user: null }
  | { status: "authenticated"; token: string; user: AuthUser };

type AuthContextValue = AuthState & {
  register: (args: { email: string; password: string; businessName: string }) => Promise<void>;
  login: (args: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({ status: "loading" }));

  const tokenFromStorage = useMemo(() => {
    if (typeof window === "undefined") return null;
    const t = window.localStorage.getItem("token");
    return t ? t : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!tokenFromStorage) {
        setState({ status: "unauthenticated", token: null, user: null });
        return;
      }

      try {
        const data = await apiFetch<{ user: AuthUser }>("/api/auth/me", tokenFromStorage);
        if (cancelled) return;
        setState({ status: "authenticated", token: tokenFromStorage, user: data.user });
      } catch {
        window.localStorage.removeItem("token");
        if (cancelled) return;
        setState({ status: "unauthenticated", token: null, user: null });
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [tokenFromStorage]);

  const register: AuthContextValue["register"] = async ({ email, password, businessName }) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>(
      "/api/auth/register",
      null,
      {
        method: "POST",
        body: JSON.stringify({ email, password, businessName }),
      },
    );

    window.localStorage.setItem("token", res.token);
    setState({ status: "authenticated", token: res.token, user: res.user });
  };

  const login: AuthContextValue["login"] = async ({ email, password }) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      null,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    window.localStorage.setItem("token", res.token);
    setState({ status: "authenticated", token: res.token, user: res.user });
  };

  const logout: AuthContextValue["logout"] = async () => {
    const currentToken = state.status === "authenticated" ? state.token : null;
    try {
      await apiFetch<undefined>("/api/auth/logout", currentToken, { method: "POST" });
    } catch {
      // even if it fails, we still clear local token
    }
    window.localStorage.removeItem("token");
    setState({ status: "unauthenticated", token: null, user: null });
  };

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      register,
      login,
      logout,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

