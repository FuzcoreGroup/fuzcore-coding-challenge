import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import AppLayout from "@/layouts/AppLayout";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Dashboard from "@/pages/dashboard/index";
import Categories from "@/pages/categories/index";
import Customers from "@/pages/customers/index";
import Invoices from "@/pages/invoices/index";
import Transactions from "@/pages/transactions/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/sign-in" replace />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{children}</>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/sign-in"
        element={
          <AuthRoute>
            <SignIn />
          </AuthRoute>
        }
      />
      <Route
        path="/sign-up"
        element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  React.useEffect(() => {
    const AUTH_TOKEN_KEY = "fuzcore_token";
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);

      if (response.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = "/sign-in";
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
