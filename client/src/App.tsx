import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router, useLocation } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthedLayout from "@/components/AuthedLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import TransactionsPage from "@/pages/TransactionsPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";
import ReportsPage from "@/pages/ReportsPage";
import HireBookkeeperPage from "@/pages/HireBookkeeperPage";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (auth.status === "unauthenticated") setLocation("/login");
  }, [auth.status, setLocation]);

  if (auth.status === "loading") {
    return <div className="p-6">Loading...</div>;
  }

  if (auth.status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}

function HomeRoute() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (auth.status === "authenticated") setLocation("/dashboard");
    if (auth.status === "unauthenticated") setLocation("/login");
  }, [auth.status, setLocation]);

  return <div className="p-6">Redirecting...</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Route path="/">
            <HomeRoute />
          </Route>
          <Route path="/login">
            <LoginPage />
          </Route>
          <Route path="/register">
            <RegisterPage />
          </Route>

          <Route path="/dashboard">
            <RequireAuth>
              <AuthedLayout>
                <DashboardPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/customers">
            <RequireAuth>
              <AuthedLayout>
                <CustomersPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/transactions">
            <RequireAuth>
              <AuthedLayout>
                <TransactionsPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/invoices/:id">
            <RequireAuth>
              <AuthedLayout>
                <InvoiceDetailPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/invoices">
            <RequireAuth>
              <AuthedLayout>
                <InvoicesPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/reports">
            <RequireAuth>
              <AuthedLayout>
                <ReportsPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
          <Route path="/hire">
            <RequireAuth>
              <AuthedLayout>
                <HireBookkeeperPage />
              </AuthedLayout>
            </RequireAuth>
          </Route>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
