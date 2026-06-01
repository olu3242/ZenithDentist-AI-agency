"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      router.push("/portal");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0F172A" }}>
      <div className="w-full max-w-md px-6 py-10 rounded-2xl shadow-xl" style={{ backgroundColor: "#1E293B" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: "#2563EB" }}
          >
            Z
          </div>
          <span className="text-white font-semibold text-xl">Zenith AI</span>
        </div>

        <h1 className="text-white text-2xl font-bold mb-2">Sign in to your account</h1>
        <p className="text-slate-400 text-sm mb-8">
          Access your practice revenue intelligence portal.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-slate-600 focus:border-blue-500 transition-colors"
              style={{ backgroundColor: "#0F172A" }}
              placeholder="you@practice.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-slate-600 focus:border-blue-500 transition-colors"
              style={{ backgroundColor: "#0F172A" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg text-sm text-red-400 border border-red-800" style={{ backgroundColor: "#1a0f0f" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#2563EB" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
