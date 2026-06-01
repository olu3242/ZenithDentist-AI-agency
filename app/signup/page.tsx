"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [practiceName, setPracticeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceName, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Registration failed. Please try again.");
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

        <h1 className="text-white text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-slate-400 text-sm mb-8">
          Start your free 14-day trial. No credit card required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="practiceName" className="block text-sm font-medium text-slate-300 mb-1.5">
              Practice name
            </label>
            <input
              id="practiceName"
              type="text"
              autoComplete="organization"
              required
              value={practiceName}
              onChange={e => setPracticeName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-slate-600 focus:border-blue-500 transition-colors"
              style={{ backgroundColor: "#0F172A" }}
              placeholder="Sunrise Dental Group"
            />
          </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-white text-sm outline-none border border-slate-600 focus:border-blue-500 transition-colors"
              style={{ backgroundColor: "#0F172A" }}
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
