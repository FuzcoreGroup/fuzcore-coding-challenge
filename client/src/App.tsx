import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import AuthPage from "./pages/auth-page";
import CustomersPage from "./pages/customers-page";
import TransactionsPage from "./pages/transactions-page";
import InvoicesPage from "./pages/invoices-page";
import InvoiceDetailPage from "./pages/invoice-detail-page";
import DashboardPage from "./pages/dashboard-page";
import CategoriesPage from "./pages/categories-page";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Tag,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect } from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/transactions", label: "Transactions", icon: Wallet },
    { href: "/categories", label: "Categories", icon: Tag },
    { href: "/invoices", label: "Invoices", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-card border-r flex flex-col ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Brand */}
        <div
          className={`h-16 flex items-center px-4 border-b ${isCollapsed ? "justify-center" : ""}`}
        >
          <Link href="/">
            <a className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <div className="w-8 h-8 min-w-[32px] rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                A
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg tracking-tight">
                  AccountIQ
                </span>
              )}
            </a>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link href={item.href} key={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap group ${
                    isCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 min-w-[20px] ${isActive ? "" : "group-hover:scale-110 transition-transform"}`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t space-y-2 bg-muted/30">
          <div
            className={`flex items-center gap-3 px-3 py-2 overflow-hidden rounded-lg ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 min-w-[32px] rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate text-foreground">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${isCollapsed ? "justify-center" : ""}`}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              {!isCollapsed && (
                <span className="font-medium text-sm">
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </span>
              )}
            </button>

            <button
              onClick={() => logout.mutate()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 whitespace-nowrap ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Log out" : undefined}
            >
              <LogOut className="w-5 h-5 min-w-[20px]" />
              {!isCollapsed && (
                <span className="font-medium text-sm">Log out</span>
              )}
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              {!isCollapsed && (
                <span className="font-medium text-sm">Collapse</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 min-h-screen ${isCollapsed ? "ml-16" : "ml-64"}`}
      >
        <div className="p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // prevent flash
  if (!user) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/login">{user ? <Redirect to="/" /> : <AuthPage />}</Route>
      <Route path="/customers">
        <ProtectedRoute component={CustomersPage} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={TransactionsPage} />
      </Route>
      <Route path="/categories">
        <ProtectedRoute component={CategoriesPage} />
      </Route>
      <Route path="/invoices">
        <ProtectedRoute component={InvoicesPage} />
      </Route>
      <Route path="/invoices/:id">
        <ProtectedRoute component={InvoiceDetailPage} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      {/* Fallback */}
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}
