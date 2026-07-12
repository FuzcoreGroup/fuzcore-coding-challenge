import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Sign up failed");
      return res.json() as Promise<{ token: string }>;
    },
    onSuccess: (data) => {
      login(data.token);
      navigate("/dashboard");
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#246052]">
            FuzCore <span className="font-light text-gray-400">LTD</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30 focus:border-[#246052]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30 focus:border-[#246052]"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl h-10"
            >
              {mutation.isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-[#246052] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
