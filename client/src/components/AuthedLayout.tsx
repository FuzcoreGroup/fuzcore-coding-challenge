import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Overview", path: "/dashboard" },
  { label: "Transactions", path: "/transactions" },
  { label: "Reports", path: "/reports" },
  { label: "Hire Bookkeeper", path: "/hire" },
] as const;

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="font-bold text-lg">Fuzzy Accounting</div>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const active = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={[
                    "text-sm",
                    active
                      ? "text-primary font-semibold border-b-2 border-primary pb-1"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {auth.status === "authenticated" ? (
              <div className="text-sm text-muted-foreground hidden sm:block">
                {auth.user.businessName}
              </div>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                auth.logout();
                setLocation("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
