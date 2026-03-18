import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AuthOnboardingLayout from "@/components/AuthOnboardingLayout";
import accountingImg from "@/assets/images/accounting.jpg";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthOnboardingLayout
      subtitle="The simplest way to"
      title="Manage your finance"
      sideImageSrc={accountingImg}
      form={
        <form
          className="w-full max-w-md flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              await login({ email, password });
              setLocation("/dashboard");
            } catch (err) {
              setError((err as Error).message || "Login failed");
            } finally {
              setPending(false);
            }
          }}
        >
          <h1 className="text-3xl font-bold">Log in</h1>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-md border px-3 bg-white text-black"
              type="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/70">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-md border px-3 bg-white text-black"
              type="password"
              required
            />
          </label>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>

          <button
            type="button"
            className="text-sm text-emerald-200 underline self-start"
            onClick={() => setLocation("/register")}
          >
            Create an account
          </button>
        </form>
      }
    />
  );
}

