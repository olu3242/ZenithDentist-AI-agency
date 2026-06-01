import Link from "next/link";
import { loginAction } from "@/app/auth-actions";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/auth/submit-button";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; reason?: string }> }) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Log in"
      subtitle="Resolve your Zenith profile and continue to the correct portal."
      footer={<span>Need access? <Link className="font-black text-teal" href="/signup">Create an account</Link>. Forgot credentials? <Link className="font-black text-teal" href="/forgot-password">Reset access</Link>.</span>}
    >
      <AuthError message={params?.error ?? (params?.reason === "auth-required" ? "Log in to access that portal." : undefined)} />
      <form action={loginAction} className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold text-ink">Email<input name="email" type="email" required autoComplete="email" className="rounded border border-line px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-bold text-ink">Password<input name="password" type="password" required autoComplete="current-password" className="rounded border border-line px-3 py-2" /></label>
        <SubmitButton pendingText="Signing in...">Log In</SubmitButton>
      </form>
    </AuthCard>
  );
}
