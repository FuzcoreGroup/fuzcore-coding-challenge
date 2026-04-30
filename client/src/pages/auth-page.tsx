import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type Tab = "login" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [, navigate] = useLocation();
  const { login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email: loginEmail, password: loginPassword });
      navigate("/");
    } catch {
      // error shown via login.error below
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters");
      return;
    }
    try {
      await register.mutateAsync({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
      });
      navigate("/");
    } catch {
      // error shown via register.error below
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 flex-col items-center justify-center p-12 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            A
          </div>
          <span className="text-2xl font-semibold text-white">AccountIQ</span>
        </div>
        <p className="text-zinc-400 text-center max-w-sm text-lg leading-relaxed">
          Simple, powerful accounting for small businesses. Manage customers,
          track transactions, and issue invoices — all in one place.
        </p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
          {[
            { label: "Customers", icon: "👥" },
            { label: "Transactions", icon: "💸" },
            { label: "Invoices", icon: "🧾" },
            { label: "Dashboard", icon: "📊" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-zinc-200 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            <span className="text-xl font-semibold">AccountIQ</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border p-1 mb-8">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "login"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account.
              </p>

              {login.error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-4 py-3">
                  {login.error.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending ? "Logging in…" : "Log in"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* Signup form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-muted-foreground text-sm">
                Get started with AccountIQ for free.
              </p>

              {(register.error || signupError) && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-4 py-3">
                  {signupError || register.error?.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Jane Smith"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating account…" : "Create account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
